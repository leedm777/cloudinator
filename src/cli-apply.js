// Copyright (c) 2016, David M. Lee, II

import AWS from 'aws-sdk';
import _ from 'lodash';
import path from 'path';
import { diff as deepDiff } from 'deep-diff';

import { UserError } from './errors';
import { loadFile } from './loader';
import { log } from './log';
import { promCall } from './promCall';

const cfn = new AWS.CloudFormation({
  apiVersion: '2010-05-15',
  region: 'us-east-1',
});

/**
 *
 * @param awsOutput
 */
function mapOutputs(awsOutput) {
  _.reduce(awsOutput, (acc, { OutputKey, OutputValue }) => {
    acc[OutputKey] = OutputValue;
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

  const { config, stacks } = loadFile(stacksFile);

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

    // wait until we see if the current stack exists
    currentStack = await currentStack;

    if (_.isString(stack.template)) {
      stack.template = loadFile(stack.template, path.dirname(stacksFile));
    }

    if (diff) {
      log.debug({ stackName }, 'getting current template');
      const currentTemplateBody = await getTemplate(stackName);
      const differences = deepDiff({
        parameters: _.get(currentStack, 'Parameters'),
        template: currentTemplateBody,
      }, {
        parameters,
        template: stack.template,
      });
      console.log(JSON.stringify(differences.map(x => _.pick(x, ['kind', 'path'])), null, 2));
      console.log(JSON.stringify(differences, null, 2));
      return null;
    }

    log.fatal('Bailing before doing anything real');
    process.exit(1);

    if (currentStack) {
      log.info({ stackName }, 'Updating stack');
      return promCall(cfn.updateStack, cfn, {
        Parameters: parameters,
        StackPolicyBody: stack.policy,
        TemplateBody: loadFile(stack.template),
        Tags: objectToKVArray(stack.tags),
      });
    }

    // creating stack
    log.info({ stackName }, 'Creating stack');
    return promCall(cfn.createStack, cfn, {
      Parameters: parameters,
      StackPolicyBody: stack.policy,
      TemplateBody: loadFile(stack.template),
      Tags: objectToKVArray(stack.tags),
    });
  });

  let failedStacks = 0;

  await Promise.all(_.map(appliedStacks, (application, stackName) => {
    return application.then(() => {
      log.info({ stackName }, 'Changes applied to stack');
    }, err => {
      ++failedStacks;
      log.error({ stackName, err }, 'Error applying stack');
    });
  }));

  if (failedStacks !== 0) {
    throw new UserError(`Failed to apply ${failedStacks} stacks`);
  }

  // async.parallel(_.map(only, stackName => done => {
  //   cfn.getTemplate({ StackName: stackName }, (err, res) => {
  //     if (_.get(err, 'code') === 'ValidationError') {
  //       // ValidationError == stack does not exist
  //       done(null, { [stackName]: null });
  //       return;
  //     }
  //     done(err, _.get(res, { [stackName]: 'TemplateBody' }));
  //   });
  // }), console.error);
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
