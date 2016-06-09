// Copyright (c) 2016, David M. Lee, II
import _ from 'lodash';

function planStacks() {
  throw new Error('TODO');
}

export default function (program) {
  function collect(val, list) {
    list.push(val);
    return list;
  }

  program
    .command('plan <stacks-file>')
    .description('Create changesets for applying changes to stacks')
    .option('--only [stack]', 'Only apply this stack; can be given more than once', collect, [])
    .action((stacksFile, options) => {
      options.parent.subcommand = planStacks.bind(null, _.assign({}, options, { stacksFile }));
    });
}
