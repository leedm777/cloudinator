// Copyright (c) 2016, David M. Lee, II
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import _ from 'lodash';

import { log } from './log';
import { UserError } from './errors';

function loadJs(file) {
  return require(file);
}

function loadYaml(file) {
  const content = fs.readFileSync(file, 'utf8');
  return yaml.safeLoad(content, {
    filename: file,
  });
}

function resolve(content) {
  return Promise.resolve(content)
    .then(c => {
      if (_.isFunction(c)) {
        return resolve(c());
      }

      if (_.has(c, 'default')) {
        return resolve(c.default);
      }

      return c;
    });
}

export async function loadFile(file, basePath = process.cwd()) {
  log.debug({ file }, 'loading');
  file = path.resolve(basePath, file);

  const ext = path.extname(file);
  let content;
  switch (ext) {
    case '.js':
    case '.json':
      content = loadJs(file);
      break;
    case '.yaml':
    case '.yml':
      content = loadYaml(file);
      break;
    default:
      throw new UserError(`Unrecognized file type: ${ext}`);
  }

  log.debug({ file }, 'resolving');
  content = await resolve(content);
  log.debug({ file, content }, 'loaded');

  return content;
}

export async function loadStacks(file) {
  const content = await loadFile(file);

  const defaults = _.get(content, 'config.defaults');
  if (!_.isEmpty(defaults)) {
    if (_.isString(defaults)) {
      content.config.defaults = await loadFile(content.config.defaults);
    }
    // flatten parameter arrays
    content.config.defaults =
      _.mapValues(content.config.defaults, v => (_.isArray(v) ? v.join(',') : v));
  }

  for (const stackName in content.stacks) {
    if (!Object.hasOwnProperty.call(content.stacks, stackName)) {
      continue;
    }

    const stack = content.stacks[stackName];
    if (_.isString(stack.template)) {
      stack.template = await loadFile(stack.template, path.dirname(file));
    }

    if (_.isString(stack.parameters)) {
      stack.parameters = await loadFile(stack.parameters, path.dirname(file));
    }

    // flatten parameter arrays
    stack.parameters =
      _.mapValues(stack.parameters, v => (_.isArray(v) ? v.join(',') : v));
  }

  return content;
}
