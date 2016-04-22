// Copyright (c) 2016, David M. Lee, II

import { log } from './log';
import { load } from './loader';

async function validate(options) {
  const { template, parameters } = options;
  if (!template) {
    log.fatal('Missing --template');
  }

  if (!parameters) {
    log.fatal('Missing --parameters');
  }

  if (!template || !parameters) {
    options.help();
    process.exit(1);
  }

  const t = load(template);
  const p = load(parameters);
}

export default function (program) {
  program
    .command('validate')
    .usage('--template [file] --parameters [file] [options]')
    .description('Validate a template')
    .option('--template [file]', 'Template to plan with')
    .option('--parameters [file]', 'Parameters for the stack')
    .action(options => {
      // eslint-disable-next-line no-param-reassign
      options.parent.subcommand = validate.bind(null, options);
    });
}
