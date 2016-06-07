// Copyright (c) 2016, David M. Lee, II

import 'babel-polyfill';

import _ from 'lodash';
import program from 'commander';
import { install as installSourceMapSupport } from 'source-map-support';

import apply from './cli-apply';
import create from './cli-create';
import destroy from './cli-destroy';
import outdated from './cli-outdated';
import plan from './cli-plan';
import validate from './cli-validate';
import { UserError } from './errors';
import { initLogger, log } from './log';
import { version } from '../package.json';

installSourceMapSupport();

program.version(version)
  .option('-b --bunyan-format [mode]', 'Parses and displays messages in bunyan format', 'short')
  .option('   --log-level [level]', 'Sets log level; defaults to info', 'info')
  /* eslint-disable global-require*/
  .option('   --require [module]', 'Requires the given module', m => require(m));
  /* eslint-enable */

create(program);
outdated(program);
plan(program);
apply(program);
destroy(program);
validate(program);

program.command('*', null, { noHelp: true })
  .action(command => {
    program.subcommand = () => {
      log.fatal({ command }, 'Unknown command');
      process.exit(1);
    };
  });

program.parse(process.argv);

if (!program.subcommand) {
  program.help();
  process.exit(1);
}

initLogger(_.pick(program, ['bunyanFormat', 'logLevel']));

new Promise(resolve => resolve(program.subcommand()))
  .then(() => {
    log.debug('done');
    process.exit(0);
  })
  .catch(err => {
    if (err instanceof UserError) {
      log.fatal(err.message);
    } else {
      log.fatal({ err }, 'Uncaught exception');
    }

    process.exit(1);
  });
