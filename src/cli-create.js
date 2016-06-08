// Copyright (c) 2016, David M. Lee, II

import _ from 'lodash';

import { UserError } from './errors';
import { allSettled, logFailures } from './promises';
import { loadStacks } from './loader';
import { log } from './log';
import { cfn, describeStack, waitForAndLogEvents } from './aws';

function mapOutputs(awsOutput) {
  return _.reduce(awsOutput, (acc, { OutputKey, OutputValue }) => {
    acc[OutputKey] = OutputValue;
    return acc;
  }, {});
}

function objectToKVArray(obj) {
  return _.map(obj, (v, k) => ({ Key: k, Value: v }));
}

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
    const newStack = await waitForAndLogEvents({ stackName });

    if (newStack.StackStatus !== 'CREATE_COMPLETE') {
      log.error({ newStack }, 'Failed to create stack');
      throw new Error(`Failed to create stack ${stackName}`);
    }

    log.info({ stackName, newStack }, 'Stack create complete');

    return newStack;
  });

  await _(only)
    .map(createStack)
    .thru(allSettled)
    .thru(logFailures)
    .value();
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
