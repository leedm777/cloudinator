// Copyright (c) 2016, David M. Lee, II
import _ from 'lodash';

function outdatedStacks() {
  throw new Error('TODO');
}

export default function (program) {
  program
    .command('outdated <stacks-file>')
    .description('List which stacks are outdated')
    .action((stacksFile, options) => {
      options.parent.subcommand = outdatedStacks.bind(null, _.assign({}, options, { stacksFile }));
    });
}
