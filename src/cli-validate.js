// Copyright (c) 2016, David M. Lee, II

import { buildLogger } from './log';

export default function (program) {
  program
    .command('validate')
    .description('Validate a template')
    .option('--template [file]', 'Template to plan with')
    .option('--parameters [file]', 'Parameters for the stack')
    .action(options => {
      const log = buildLogger(options.parent);
      log.info('validate');
    });
}
