// Copyright (c) 2016, David M. Lee, II

import bunyan from 'bunyan';
import bformat from 'bunyan-format';

const { name } = require('../package.json');

export let log;

export function initLogger({ bunyanFormat, loglevel }) {
  log = bunyan.createLogger({
    name,
    serializers: bunyan.stdSerializers,
    level: loglevel,
    stream: bformat({
      outputMode: bunyanFormat,
      color: process.stdout.isTTY,
    }),
  });
}
