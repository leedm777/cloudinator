// Copyright (c) 2016, David M. Lee, II

import AWS from 'aws-sdk';
import _ from 'lodash';
import colors from 'colors/safe';
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

function mapParameters(awsParameters) {
  return _.reduce(awsParameters, (acc, { ParameterKey, ParameterValue }) => {
    acc[ParameterKey] = ParameterValue;
    return acc;
  }, {});
}
function objectToKVArray(obj) {
  return _.map(obj, (v, k) => ({ Key: k, Value: v }));
}

async function waitFor({ stackName }) {
  log.debug({ stackName }, 'Getting initial events');
  const { StackEvents: initialEvents } =
    await cfn.describeStackEvents({ StackName: stackName }).promise();
  let lastEventId = _.get(initialEvents, 'StackEvents[0].EventId');

  return new Promise((resolve, reject) => {
    async function poll() {
      log.debug({ stackName }, 'Describing stack');
      // capture stack status prior to events, otherwise we might miss the last few events
      const { StackEvents: [stack] } =
        await cfn.describeStacks({ StackName: stackName }).promise();

      log.debug({ stackName }, 'Describing stack events');
      let { StackEvents: stackEvents } =
        await cfn.describeStackEvents({ StackName: stackName }).promise();
      stackEvents = _.takeWhile(stackEvents, e => e.id !== lastEventId);

      if (!_.isEmpty(stackEvents)) {
        _.forEach(stackEvents, stackEvent => log.info({ stackEvent }));
        lastEventId = stackEvents[0].EventId;
      }

      log.debug({ stackName, status: stack.StackStatus, reason: stack.StackStatusReason },
        'Processing status');
      switch (stack.StackStatus) {
        case 'CREATE_IN_PROGRESS':
        case 'ROLLBACK_IN_PROGRESS':
        case 'DELETE_IN_PROGRESS':
        case 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS':
        case 'UPDATE_IN_PROGRESS':
        case 'UPDATE_ROLLBACK_IN_PROGRESS':
        case 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS':
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
    if (d.lhs) {
      console.log(colors.red(`-${JSON.stringify(d.lhs)}`));
    }
    if (d.rhs) {
      console.log(colors.green(`+${JSON.stringify(d.rhs)}`));
    }
    if (d.kind === 'A') {
      if (d.item.lhs) {
        console.log(colors.red(`-[${d.index}] ${JSON.stringify(d.item.lhs)}`));
      }
      if (d.item.rhs) {
        console.log(colors.green(`+[${d.index}] ${JSON.stringify(d.item.rhs)}`));
      }
    }
  });
  /* eslint-enable no-console */
}

async function applyStack({ stacks: stacksFile, only, diff }) {
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

    // now put it in AWS format:
    parameters = _.map(parameters, (v, k) => ({ ParameterKey: k, ParameterValue: v }));

    // wait until we see if the current stack exists
    currentStack = await currentStack;

    if (currentStack.StackStatus === 'ROLLBACK_COMPLETE') {
      log.info({ stackName }, 'Deleting failed stack');
      await cfn.deleteStack({
        StackName: stackName,
      }).promise();
      currentStack = null;
    }

    log.debug({ stackName }, 'getting current template');
    const currentTemplateBody = await getTemplate(stackName);
    const currentParameters = mapParameters(_.get(currentStack, 'Parameters', []));
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

    let newStack;
    if (currentStack) {
      log.info({ stackName }, 'Updating stack');
      const update = await cfn.updateStack({
        StackName: stackName,
        Parameters: parameters,
        StackPolicyBody: stack.policy,
        TemplateBody: JSON.stringify(stack.template),
        Tags: objectToKVArray(stack.tags),
      }).promise();

      log.info({ stackName, update }, 'Stack update started');
      newStack = await waitFor({ stackName, state: 'stackUpdateComplete' });
      log.info({ stackName, updatedStack: newStack }, 'Stack update complete');
    } else {
      // creating stack
      log.info({ stackName }, 'Creating stack');
      const create = await cfn.createStack({
        StackName: stackName,
        Parameters: parameters,
        StackPolicyBody: stack.policy,
        TemplateBody: JSON.stringify(stack.template),
        Tags: objectToKVArray(stack.tags),
      }).promise();

      log.info({ stackName, create }, 'Create stack started');
      newStack = await waitFor({ stackName, state: 'stackUpdateComplete' });
      log.info({ stackName, updatedStack: newStack }, 'Stack create complete');
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
    .command('apply')
    .description('Update a stack from a template and parameters')
    .option('--stacks [file]', 'Stack configuration to apply')
    .option('--only [stack]', 'Only apply this stack; can be given more than once', collect, [])
    .option('--diff', 'Instead of applying, show a diff of the stack objects')
    .action(options => {
      options.parent.subcommand = applyStack.bind(null, options);
    });
}
