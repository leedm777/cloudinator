// Copyright (c) 2016, David M. Lee, II

import AWS from 'aws-sdk';
import _ from 'lodash';
import colors from 'colors/safe';
import uuid from 'uuid';
import { diff as deepDiff } from 'deep-diff';

import { UserError } from './errors';
import { loadStacks } from './loader';
import { log } from './log';

const cfn = new AWS.CloudFormation({
  apiVersion: '2010-05-15',
  region: 'us-east-1',
});

function mapOutputs(awsOutput) {
  return _.reduce(awsOutput, (acc, { OutputKey, OutputValue }) => {
    acc[OutputKey] = OutputValue;
    return acc;
  }, {});
}

function objectToKVArray(obj) {
  return _.map(obj, (v, k) => ({ Key: k, Value: v }));
}

async function waitFor({ stackName }) {
  log.debug({ stackName }, 'Getting initial events');
  const rawEvents = await cfn.describeStackEvents({ StackName: stackName }).promise();
  log.trace({ rawEvents }, 'Raw events');
  let lastEventId = _.get(rawEvents, 'StackEvents[0].EventId');

  return new Promise((resolve, reject) => {
    async function poll() {
      try {
        log.trace({ stackName }, 'Describing stack');
        // capture stack status prior to events, otherwise we might miss the last few events
        const { Stacks: [stack] } =
          await cfn.describeStacks({ StackName: stackName }).promise();

        log.trace({ stackName }, 'Describing stack events');
        let { StackEvents: stackEvents } =
          await cfn.describeStackEvents({ StackName: stackName }).promise();
        stackEvents = _.takeWhile(stackEvents, e => e.EventId !== lastEventId);

        if (!_.isEmpty(stackEvents)) {
          _.forEachRight(stackEvents,
            stackEvent => {
              if (stackEvent.ResourceStatus.endsWith('_FAILED')) {
                log.error({ stackEvent },
                  `${stackEvent.LogicalResourceId} ${stackEvent.ResourceStatus}`);
              } else {
                log.info({ stackEvent },
                  `${stackEvent.LogicalResourceId} ${stackEvent.ResourceStatus}`);
              }
            });
          lastEventId = stackEvents[0].EventId;
        }

        log.trace({ stackName, stack: _.pick(stack, ['StackStatus', 'StackStatusReason']) },
          'Processing status');
        switch (stack.StackStatus) {
          case 'CREATE_IN_PROGRESS':
          case 'ROLLBACK_IN_PROGRESS':
          case 'DELETE_IN_PROGRESS':
          case 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS':
          case 'UPDATE_IN_PROGRESS':
          case 'UPDATE_ROLLBACK_IN_PROGRESS':
          case 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS':
            // stack still in progress
            break;

          case 'CREATE_COMPLETE':
          case 'ROLLBACK_COMPLETE':
          case 'DELETE_COMPLETE':
          case 'UPDATE_COMPLETE':
          case 'UPDATE_ROLLBACK_COMPLETE':
            resolve(stack);
            return;

          case 'CREATE_FAILED':
          case 'ROLLBACK_FAILED':
          case 'DELETE_FAILED':
          case 'UPDATE_ROLLBACK_FAILED':
            reject(new Error(`Stack failed: ${stack.StackStatusReason}`));
            return;

          default:
            reject(
              new Error(`Unknown status: ${stack.StackStatus}: ${stack.StackStatusReason}`));
            return;
        }

        // not done yet; try again later
        setTimeout(poll, 5000);
      } catch (err) {
        reject(err);
      }
    }

    // kick off the polling
    setTimeout(poll, 5000);
  });
}

function waitForChangeset({ stackName, id }) {
  return new Promise((resolve, reject) => {
    async function poll() {
      try {
        log.trace({ stackName, id }, 'Describing changeset');
        const changeset =
          await cfn.describeChangeSet({ ChangeSetName: id, StackName: stackName }).promise();

        log.trace({ stackName, changeset }, 'Changeset');

        switch (changeset.Status) {
          case 'CREATE_PENDING':
          case 'CREATE_IN_PROGRESS':
            // changeset still in progress
            break;

          case 'CREATE_COMPLETE':
          case 'DELETE_COMPLETE':
            resolve(changeset);
            break;
          case 'FAILED':
            reject(new Error(`Stack failed: ${changeset.StatusReason}`));
            return;

          default:
            reject(new Error(
              `Unknown status: ${changeset.StackStatus}: ${changeset.StackStatusReason}`));
            return;
        }

        // not done yet; try again later
        setTimeout(poll, 5000);
      } catch (err) {
        reject(err);
      }
    }

    // kick off the polling
    setTimeout(poll, 5000);
  });
}

const describeStack = _.memoize(async stackName => {
  log.debug({ stackName }, 'describing stack');
  try {
    const data = await cfn.describeStacks({ StackName: stackName }).promise();
    return _.get(data, 'Stacks[0]');
  } catch (err) {
    // validation errors are when the stack isn't found; otherwise rethrow
    if (_.get(err, 'code') === 'ValidationError') {
      return null;
    }

    throw err;
  }
});

async function getTemplate(stackName) {
  log.debug({ stackName }, 'getting template');
  try {
    const data = await cfn.getTemplate({ StackName: stackName }).promise();
    return JSON.parse(_.get(data, 'TemplateBody'));
  } catch (err) {
    // validation errors are when the stack isn't found; otherwise rethrow
    if (_.get(err, 'code') === 'ValidationError') {
      return null;
    }

    throw err;
  }
}

function showDiff({ differences, stacksFile, stackName }) {
  /* eslint-disable no-console */
  console.log(`cloudinator --apply --diff --stacks ${stacksFile} --only ${stackName}`);
  console.log(`--- aws ${stackName}`);
  console.log(`+++ ${stacksFile} ${stackName}`);
  differences.forEach(d => {
    console.log(` ${d.path.join('.')}`);
    if (!_.isEmpty(d.lhs)) {
      console.log(colors.red(`-${JSON.stringify(d.lhs)}`));
    }
    if (!_.isEmpty(d.rhs)) {
      console.log(colors.green(`+${JSON.stringify(d.rhs)}`));
    }
    if (d.kind === 'A') {
      if (!_.isEmpty(d.item.lhs)) {
        console.log(colors.red(`-[${d.index}] ${JSON.stringify(d.item.lhs)}`));
      }
      if (!_.isEmpty(d.item.rhs)) {
        console.log(colors.green(`+[${d.index}] ${JSON.stringify(d.item.rhs)}`));
      }
    }
  });
  /* eslint-enable no-console */
}

async function applyStack({ stacksFile, only, diff, changeSet }) {
  if (!stacksFile) {
    throw new UserError('Missing --stacks');
  }

  const { config, stacks } = await loadStacks(stacksFile);

  if (!stacks || !_.isObject(stacks)) {
    throw new UserError(`Expected ${stacks} to have \`stacks\` object`);
  }

  if (!_.isEmpty(only)) {
    const unknown = _.difference(only, _.keys(stacks));
    if (!_.isEmpty(unknown)) {
      throw new UserError(`Unknown stacks: ${unknown.join(',')}`);
    }
  } else {
    only = _.keys(stacks);
  }

  only = _.pick(stacks, only);

  const appliedStacks = _.mapValues(only, async(stack, stackName) => {
    let currentStack = describeStack(stackName);

    // start with default parameters
    let parameters = _.get(config, 'defaults', {});

    // then learn params from dependencies
    if (stack.dependsOn) {
      if (_.isString(stack.dependsOn)) {
        stack.dependsOn = [stack.dependsOn];
      }

      parameters = _.reduce(stack.dependsOn, async(p, dependent) => {
        const description = await (_.has(appliedStacks, dependent) ?
          appliedStacks[dependent] :
          describeStack(dependent));
        const outputs = mapOutputs(_.get(description, 'Outputs'));
        return _.assign({}, await p, outputs);
      }, parameters);

      parameters = await parameters;
    }

    // finally params set in the stack itself
    parameters = _.assign({}, parameters, stack.parameters);

    // and remove anything extraneous
    const validParams = _.intersection(
      _.keys(parameters),
      _.keys(_.get(stack, 'template.Parameters', {})));
    parameters = _.pick(parameters, validParams);

    // wait until we see if the current stack exists
    currentStack = await currentStack;

    if (_.get(currentStack, 'StackStatus') === 'ROLLBACK_COMPLETE') {
      log.info({ stackName, currentStack }, 'Deleting failed stack');
      const del = await cfn.deleteStack({
        StackName: stackName,
      }).promise();
      log.debug({ del }, 'Stack delete started');
      await waitFor({ stackName: currentStack.StackId });
      currentStack = null;
    }

    log.debug({ stackName }, 'getting current template');
    const currentTemplateBody = await getTemplate(stackName);
    const currentParameters = _(_.get(currentStack, 'Parameters', []))
      .keyBy('ParameterKey')
      .mapValues('ParameterValue')
      .value();
    const differences = deepDiff({
      parameters: currentParameters,
      template: currentTemplateBody,
    }, {
      parameters,
      template: stack.template,
    });

    if (differences) {
      showDiff({ differences, stacksFile, stackName });
    } else {
      log.info({ stackName }, 'No changes');
      return currentStack;
    }

    if (diff) {
      return currentStack;
    }

    // now put params in AWS format
    parameters = _.map(parameters, (v, k) => ({ ParameterKey: k, ParameterValue: v }));

    let newStack;
    if (currentStack && changeSet) {
      log.info({ stackName }, 'Creating change set');
      let changeset = await cfn.createChangeSet({
        ChangeSetName: `cs-${uuid.v4()}`,
        StackName: stackName,
        Parameters: parameters,
        TemplateBody: JSON.stringify(stack.template),
        Tags: objectToKVArray(stack.tags),
        Capabilities: ['CAPABILITY_IAM'],
      }).promise();

      log.info({ stackName, changeset }, 'Changeset create started');
      changeset = await waitForChangeset({ stackName, id: changeset.Id });
      log.info({ stackName, changeset }, 'Changeset created');
    } else if (currentStack) {
      log.info({ stackName }, 'Updating stack');
      const update = await cfn.updateStack({
        StackName: stackName,
        Parameters: parameters,
        StackPolicyBody: JSON.stringify(stack.policy),
        TemplateBody: JSON.stringify(stack.template),
        Tags: objectToKVArray(stack.tags),
        Capabilities: ['CAPABILITY_IAM'],
      }).promise();

      log.info({ stackName, update }, 'Stack update started');
      newStack = await waitFor({ stackName, state: 'stackUpdateComplete' });

      if (newStack.StackStatus !== 'UPDATE_COMPLETE') {
        log.error({ newStack }, 'Failed to create stack');
        throw new Error(`Failed to create stack ${stackName}`);
      }

      log.info({ stackName, updatedStack: newStack }, 'Stack update complete');
    } else {
      // creating stack
      log.info({ stackName }, 'Creating stack');
      const create = await cfn.createStack({
        StackName: stackName,
        Parameters: parameters,
        StackPolicyBody: JSON.stringify(stack.policy),
        TemplateBody: JSON.stringify(stack.template),
        Tags: objectToKVArray(stack.tags),
        Capabilities: ['CAPABILITY_IAM'],
      }).promise();

      log.info({ stackName, create }, 'Create stack started');
      newStack = await waitFor({ stackName, state: 'stackUpdateComplete' });

      if (newStack.StackStatus !== 'CREATE_COMPLETE') {
        log.error({ newStack }, 'Failed to create stack');
        throw new Error(`Failed to create stack ${stackName}`);
      }

      log.info({ stackName, newStack }, 'Stack create complete');
    }

    return newStack;
  });

  let failedStacks = 0;

  await Promise.all(_.map(appliedStacks, (application, stackName) =>
    application.then(() => {
    }, err => {
      ++failedStacks;
      log.error({ stackName, err }, 'Error applying stack');
    })));

  if (failedStacks !== 0) {
    throw new UserError(`Failed to apply ${failedStacks} stacks`);
  }
}

export default function (program) {
  function collect(val, list) {
    list.push(val);
    return list;
  }

  program
    .command('apply <stacks-file>')
    .description('Update a stack from a template and parameters')
    .option('--only [stack]', 'Only apply this stack; can be given more than once', collect, [])
    .option('--diff', 'Instead of applying, show a diff of the stack objects')
    .option('--change-set', 'Instead of applying, create a change set')
    .action((stacksFile, options) => {
      options.parent.subcommand = applyStack.bind(null, _.assign({}, options, { stacksFile }));
    });
}
