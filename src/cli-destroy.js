// Copyright (c) 2016, David M. Lee, II
import _ from 'lodash';

function destroyStacks() {
  throw new Error('TODO');
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
