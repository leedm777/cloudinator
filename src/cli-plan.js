// Copyright (c) 2016, David M. Lee, II

import { buildLogger } from './log';

export default function (program) {
  program
    .command('plan')
    .description('Show pending changes to a stack')
    .option('--template [file]', 'Template to plan with')
    .option('--parameters [file]', 'Parameters for the stack')
    .action(options => {
      const log = buildLogger(options.parent);
      log.info('plan');
    });
}
