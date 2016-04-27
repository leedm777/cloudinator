// Copyright (c) 2016, David M. Lee, II
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import _ from 'lodash';

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

export function loadStacks(file) {
  const content = loadFile(file);

  if (_.isString(_.get(content, 'config.defaults'))) {
    content.config.defaults = loadFile(content.config.defaults);
  }

  // flatten parameter arrays
  content.config.defaults =
    _.mapValues(content.config.defaults, v => (_.isArray(v) ? v.join(',') : v));

  content.stacks = _.mapValues(content.stacks, stack => {
    if (_.isString(stack.template)) {
      stack.template = loadFile(stack.template, path.dirname(file));
    }

    if (_.isString(stack.parameters)) {
      stack.parameters = loadFile(stack.parameters, path.dirname(file));
    }

    // flatten parameter arrays
    stack.parameters =
      _.mapValues(stack.parameters, v => (_.isArray(v) ? v.join(',') : v));

    return stack;
  });

  return content;
}
