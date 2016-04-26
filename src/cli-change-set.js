// Copyright (c) 2016, David M. Lee, II

function changesetList() {
  throw new Error('TODO');
}

function changesetShow(id) {
  throw new Error('TODO', id);
}

function changesetApply(id) {
  throw new Error('TODO', id);
}

function changesetCreate(stackFile) {
  throw new Error('TODO', stackFile);
}

function changesetDiff(stackFile) {
  throw new Error('TODO', stackFile);
}

export default function (program) {
  const command = program
    .command('change-set')
    .description('Show pending changes to a stack')
    .option('--list', 'List change sets')
    .option('--show [change-set-id]', 'Show a change set contents')
    .option('--apply [change-set-id]', 'Apply a change set')
    .option('--create [file]', 'Create a change set for a stack')
    .option('--diff [file]', 'Diff a ')
    .action(options => {
      // eslint-disable no-param-reassign
      if (options.list) {
        options.parent.subcommand = changesetList;
        return;
      }

      if (options.show) {
        options.parent.subcommand = changesetShow.bind(null, options.show);
        return;
      }

      if (options.apply) {
        options.parent.subcommand = changesetApply.bind(null, options.apply);
        return;
      }

      if (options.create) {
        options.parent.subcommand = changesetCreate.bind(null, options.create);
        return;
      }

      if (options.diff) {
        options.parent.subcommand = changesetDiff.bind(null, options.diff);
        return;
      }

      command.help();
      process.exit(1);
    });
}
