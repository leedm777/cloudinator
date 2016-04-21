// Copyright (c) 2016, David M. Lee, II

import bunyan from 'bunyan';
import bformat from 'bunyan-format';

const { name } = require('../package.json');

export function buildLogger({ bunyanFormat, loglevel }) {
  return bunyan.createLogger({
    name,
    level: loglevel,
    stream: bformat({
      outputMode: bunyanFormat,
      color: process.stdout.isTTY,
    }),
  });
}
