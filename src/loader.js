// Copyright (c) 2016, David M. Lee, II

import interpret from 'interpret';
import path from 'path';
import _ from 'lodash';

import { log } from './log';
import { UserError } from './errors';

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

const registered = {};

function register(key) {
  if (registered[key]) {
    return;
  }

  function reg(handler) {
    /* eslint-disable global-require */
    if (_.isNull(handler)) {
      // do nothing
    } else if (_.isString(handler)) {
      log.trace({ handler }, 'loading handler string');
      require(handler);
    } else if (_.isPlainObject(handler)) {
      log.trace({ handler }, 'loading handler object');
      handler.register(require(handler.module));
    } else if (_.isArray(handler)) {
      log.trace({ handler }, 'loading handler array');
      let errors = [];
      for (const h of handler) {
        try {
          reg(h);
          log.trace('Success!');
          errors = [];
          break;
        } catch (err) {
          // continue
          errors.push(err);
        }
      }
      if (!_.isEmpty(errors)) {
        throw errors[0];
      }
    }
    /* eslint-enable */
  }

  reg(interpret.extensions[key]);
  registered[key] = true;
}

export async function loadFile(file, basePath = process.cwd()) {
  log.debug({ file, basePath }, 'loading');
  file = path.resolve(basePath, file);

  const key = _.find(_.keys(interpret.extensions), k => file.endsWith(k));

  if (!key) {
    const ext = path.extname(file);
    log.fatal({ file, ext }, 'Unknown file type');
    throw new UserError(`Unrecognized file type: ${ext}`);
  }

  register(key);

  log.trace({ file }, 'requiring');
  let content = require(file); // eslint-disable-line global-require
  log.trace({ file }, 'resolving');
  content = await resolve(content);
  log.trace({ file, content }, 'loaded');

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

  for (const stackName of _.keys(content.stacks)) {
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
