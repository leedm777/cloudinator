import _ from 'lodash';

import { log } from './log';

/**
 * Return once an array of promises are all settled.
 *
 * @param array
 * @returns {Promise}
 */
export function allSettled(array) {
  return Promise.all(
    _.map(array, p => p.then(value => ({ value }), cause => ({ cause }))));
}

/**
 * Converts the results of `allSettled` into either an array of values, or the
 * first rejection in the array.
 *
 * @param {Promise} array Results from `allSettled`
 * @param {String} message Log message for failures.
 */
export function logFailures(array, message) {
  return array.then(a => {
    const failures = _(a)
      .filter('cause')
      .map('cause')
      .value();

    if (_.isEmpty(failures)) {
      return _.map(a, 'value');
    }

    _.forEach(failures, err => log.error({ err }, message));
    throw new Error(`${message}: ${_.size(failures)} errors`);
  });
}
