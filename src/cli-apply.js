// Copyright (c) 2016, David M. Lee, II

import AWS from 'aws-sdk';
import _ from 'lodash';
import colors from 'colors/safe';
import { diff as deepDiff } from 'deep-diff';

import { UserError } from './errors';
import { loadStacks } from './loader';
import { log } from './log';
import { promCall } from './promCall';

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

async function applyStack({ stacks: stacksFile, only, diff }) {
  if (!stacksFile) {
    throw new UserError('Missing --stacks');
  }

  const { config, stacks } = loadStacks(stacksFile);

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

  const describeStack = _.memoize(async stackName => {
    log.debug({ stackName }, 'Describing stack');
    try {
      const data = await promCall(cfn.describeStacks, cfn, { StackName: stackName });
      return _.get(data, 'Stacks[0]');
    } catch (err) {
      // validation errors are when the stack isn't found; otherwise rethrow
      if (_.get(err, 'code') === 'ValidationError') {
        return null;
      }

      throw err;
    }
  });

  const getTemplate = async stackName => {
    log.debug({ stackName }, 'Getting template');
    try {
      const data = await promCall(cfn.getTemplate, cfn, { StackName: stackName });
      return JSON.parse(_.get(data, 'TemplateBody'));
    } catch (err) {
      // validation errors are when the stack isn't found; otherwise rethrow
      if (_.get(err, 'code') === 'ValidationError') {
        return null;
      }

      throw err;
    }
  };

  const appliedStacks = _.mapValues(only, async (stack, stackName) => {
    function showDiff(differences) {
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

    let currentStack = describeStack(stackName);

    // start with default parameters
    let parameters = _.get(config, 'defaults', {});

    // then learn params from dependencies
    if (stack.dependsOn) {
      if (_.isString(stack.dependsOn)) {
        stack.dependsOn = [stack.dependsOn];
      }

      parameters = _.reduce(stack.dependsOn, async (p, dependent) => {
        const description = appliedStacks.hasOwnProperty(dependent) ?
          appliedStacks[dependent] :
          describeStack(dependent);
        const outputs = mapOutputs((await description).Outputs);
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
      showDiff(differences, stackName);
    } else {
      log.info({ stackName }, 'No changes');
      return currentStack;
    }

    if (diff) {
      return currentStack;
    }

    log.fatal('Bailing before doing anything real');
    process.exit(1);

    let newStack;
    if (currentStack) {
      log.info({ stackName }, 'Updating stack');
      newStack = await promCall(cfn.updateStack, cfn, {
        Parameters: parameters,
        StackPolicyBody: stack.policy,
        TemplateBody: stack.template,
        Tags: objectToKVArray(stack.tags),
      });
      log.info({ stackName }, 'Updated stack');
    } else {
      // creating stack
      log.info({ stackName }, 'Creating stack');
      newStack = await promCall(cfn.createStack, cfn, {
        Parameters: parameters,
        StackPolicyBody: stack.policy,
        TemplateBody: stack.template,
        Tags: objectToKVArray(stack.tags),
      });
      log.info({ stackName }, 'Created stack');
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
