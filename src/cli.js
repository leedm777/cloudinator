// Copyright (c) 2016, David M. Lee, II
import 'babel-polyfill';

import program from 'commander';
import _ from 'lodash';

import apply from './cli-apply';
import plan from './cli-plan';
import validate from './cli-validate';

import { initLogger, log } from './log';

const { version } = require('../package.json');

program.version(version)
  .option('-b --bunyan-format [mode]', 'Parses and displays messages in bunyan format', 'short')
  .option('   --loglevel [level]', 'Sets log level; defaults to info', 'info');

apply(program);
plan(program);
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

initLogger(_.pick(program, ['bunyanFormat', 'loglevel']));

program.subcommand()
  .then(() => log.trace('done'))
  .catch(err => log.fatal({ err }, 'Uncaught exception'));
