// Copyright (c) 2016, David M. Lee, II
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

import { log } from './log';
import { UserError } from './errors';

function loadJs(file) {
  log.debug({ file }, 'loading JavaScript/JSON');
  return require(file);
}

function loadYaml(file) {
  log.debug({ file }, 'loading yaml');
  const content = fs.readFileSync(file, 'utf8');
  return yaml.safeLoad(content, {
    filename: file,
  });
}

export function loadFile(file, basePath = process.cwd()) {
  file = path.resolve(basePath, file);

  const ext = path.extname(file);
  switch (ext) {
    case '.js':
    case '.json':
      return loadJs(file);
    case '.yaml':
    case '.yml':
      return loadYaml(file);
    default:
      throw new UserError(`Unrecognized file type: ${ext}`);
  }
}
