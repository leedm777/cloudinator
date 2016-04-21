// Copyright (c) 2016, David M. Lee, II
import 'babel-polyfill';

import program from 'commander';

import apply from './cli-apply';
import plan from './cli-plan';
import validate from './cli-validate';

const { version } = require('../package.json');

program.version(version)
  .option('-b --bunyan-format [mode]', 'Parses and displays messages in bunyan format', 'short')
  .option('   --loglevel [level]', 'Sets log level; defaults to info', 'info');

apply(program);
plan(program);
validate(program);

program.command('*', null, { noHelp: true })
  .action(command => {
    console.error(`Unknown command ${command}`); // eslint-disable-line no-console
    process.exit(1);
  });

program.parse(process.argv);
