// Copyright (c) 2016, David M. Lee, II

import _ from 'lodash';

import { UserError } from './errors';
import { allSettled, logFailures } from './promises';
import { cfn, waitForAndLogEvents } from './aws';
import { loadStacks } from './loader';
import { log } from './log';

async function destroyStacks({ stacksFile, only }) {
  if (!stacksFile) {
    throw new UserError('Missing stacks-file');
  }

  const { stacks } = await loadStacks(stacksFile);

  if (!stacks || !_.isObject(stacks)) {
    throw new UserError(`Expected ${stacksFile} to have \`stacks\` object`);
  }

  if (!_.isEmpty(only)) {
    const unknown = _.difference(only, _.keys(stacks));
    if (!_.isEmpty(unknown)) {
      throw new UserError(`Unknown stacks: ${unknown.join(',')}`);
    }
  } else {
    only = _.keys(stacks);
  }

  const toDestroy = _(only)
    .map(stackName => ({ stackName, dependedBy: [] }))
    .keyBy('stackName')
    .value();

  log.debug({ toDestroy }, 'Inverting Dependencies');

  _.forEach(toDestroy, (v, dependency) => {
    let dependsOn = _.get(stacks[dependency], 'dependsOn');
    if (dependsOn) {
      if (_.isString(dependsOn)) {
        dependsOn = [dependsOn];
      }

      _.forEach(dependsOn, dependent => {
        if (_.has(toDestroy, dependent)) {
          toDestroy[dependent].dependedBy.push(dependency);
        }
      });
    }
  });
  log.debug({ toDestroy }, 'Inverted Dependencies');

  const destroyStack = _.memoize(async stackName => {
    for (const dependent of toDestroy[stackName].dependedBy) {
      log.debug({ stackName, dependent }, 'Waiting');
      await destroyStack(dependent);
    }

    const stack = await cfn.deleteStack({
      StackName: stackName,
    }).promise();
    log.info({ stack }, 'Deleting stack');
    await waitForAndLogEvents({ stackName });
    log.info({ stackName }, 'Deleted stack');
  });

  await _(only)
    .map(destroyStack)
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
    .command('destroy <stacks-file>')
    .description('Destroy stacks')
    .option('--only [stack]', 'Only destroy this stack; can be given more than once', collect, [])
    .action((stacksFile, options) => {
      options.parent.subcommand = destroyStacks.bind(null, _.assign({}, options, { stacksFile }));
    });
}
