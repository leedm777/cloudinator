// Copyright (c) 2016, David M. Lee, II

import AWS from 'aws-sdk';
import _ from 'lodash';

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

async function createStacks({ stacksFile, only }) {
  if (!stacksFile) {
    throw new UserError('Missing stacks-file');
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

  const createStack = _.memoize(async(stackName) => {
    const stack = stacks[stackName];

    // start with default parameters
    let parameters = _.get(config, 'defaults', {});

    // then learn params from dependencies
    try {
      if (stack.dependsOn) {
        if (_.isString(stack.dependsOn)) {
          stack.dependsOn = [stack.dependsOn];
        }

        parameters = await _.reduce(stack.dependsOn, async(p, dependent) => {
          const description = await (_.includes(only, dependent) ?
            createStack(dependent) : describeStack(dependent));
          const outputs = mapOutputs(_.get(description, 'Outputs'));
          return _.assign({}, await p, outputs);
        }, parameters);
      }
    } catch (err) {
      throw new UserError(`Error from dependency: ${err.message}`);
    }

    // finally params set in the stack itself
    parameters = _.assign({}, parameters, stack.parameters);

    // and remove anything extraneous
    const validParams = _.intersection(
      _.keys(parameters),
      _.keys(_.get(stack, 'template.Parameters', {})));
    parameters = _.pick(parameters, validParams);

    // now put params in AWS format
    parameters = _.map(parameters, (v, k) => ({ ParameterKey: k, ParameterValue: v }));

    // creating stack
    log.info({ stackName }, 'Creating stack');
    const create = await cfn.createStack({
      StackName: stackName,
      Parameters: parameters,
      StackPolicyBody: JSON.stringify(stack.policy),
      TemplateBody: JSON.stringify(stack.template),
      Tags: objectToKVArray(stack.tags),
      Capabilities: ['CAPABILITY_IAM'],
      OnFailure: 'DELETE',
    }).promise();

    log.info({ stackName, create }, 'Create stack started');
    const newStack = await waitFor({ stackName });

    if (newStack.StackStatus !== 'CREATE_COMPLETE') {
      log.error({ newStack }, 'Failed to create stack');
      throw new Error(`Failed to create stack ${stackName}`);
    }

    log.info({ stackName, newStack }, 'Stack create complete');

    return newStack;
  });

  const results = await _(only)
    .map(createStack)
    .map(p => p.then(value => ({ value }), cause => ({ cause })))
    .thru(Promise.all.bind(Promise))
    .value();

  const failures = _(results)
    .filter('cause')
    .map('cause')
    .value();

  if (!_.isEmpty(failures)) {
    _.forEach(failures, err => log.error({ err }, 'Error creating stack'));
    throw new UserError(`Failed to create ${_.size(failures)} stacks`);
  }
}

export default function (program) {
  function collect(val, list) {
    list.push(val);
    return list;
  }

  program
    .command('create <stacks-file>')
    .description('Create stacks')
    .option('--only [stack]', 'Only apply this stack; can be given more than once', collect, [])
    .action((stacksFile, options) => {
      options.parent.subcommand = createStacks.bind(null, _.assign({}, options, { stacksFile }));
    });
}
