// Copyright (c) 2016, David M. Lee, II
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

import { log } from './log';

function loadJs(file) {
  file = path.relative(__dirname, file);
  
  if (!file.match(/\.?\.?\//)) {
    file = `./${file}`;
  }

  log.debug({ file }, 'loading');
  return require(file);
}

function loadYaml(file) {
  const content = fs.readFileSync(file, 'utf8');
  return yaml.safeLoad(content, {
    filename: file,
  });
}

export function loadFile(file) {
  switch (path.extname(file)) {
    case '.js':
    case '.json':
      return loadJs(file);
    case '.yaml':
    case '.yml':
      return loadYaml(file);
    default:
      throw new TypeError('Unrecognized file type');
  }
}
