// Copyright (c) 2016, David M. Lee, II
import 'babel-polyfill';

import program from 'commander';
import _ from 'lodash';
import { install as installSourceMapSupport } from 'source-map-support';

import apply from './cli-apply';
import changeSet from './cli-change-set';
import validate from './cli-validate';
import { UserError } from './errors';

import { initLogger, log } from './log';

const { version } = require('../package.json');

installSourceMapSupport();

program.version(version)
  .option('-b --bunyan-format [mode]', 'Parses and displays messages in bunyan format', 'short')
  .option('   --log-level [level]', 'Sets log level; defaults to info', 'info')
  /* eslint-disable global-require*/
  .option('   --require [module]', 'Requires the given module', m => require(m));
  /* eslint-enable */

apply(program);
changeSet(program);
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
