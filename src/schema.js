import appdirs from 'appdirs';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import { log } from './log';

const URL = 'http://vstoolkit.amazonwebservices.com/CloudFormationSchema/CloudFormationV1.schema';
const cacheDir = appdirs.userCacheDir('cloudinator', 'building5');
const cacheFile = path.join(cacheDir, 'schemaCache.json');

export async function getSchema({ url = URL, file } = {}) {
  let content;

  if (file) {
    content = await new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  } else {
    let cache = null;
    try {
      cache = require(cacheFile);
    } catch (ignored) {
      // default empty cache
      cache = {};
    }

    const cacheEntry = _.get(cache, url, {});

    log.debug({ url }, 'loading schema');
    const res = await fetch(url, {
      headers: {
        'If-None-Match': _.get(cacheEntry, 'etag'),
      },
    });

    switch (res.status) {
      case 200:
        // cache miss
        log.debug('schema cache miss');
        cacheEntry.content = await res.json();
        cacheEntry.etag = res.headers.get('ETag');
        cache[url] = cacheEntry;

        log.debug('schema updating cache');
        try {
          fs.mkdirSync(cacheDir);
        } catch (err) {
          // ignore EEXIST errors
          if (err.code !== 'EEXIST') {
            throw err;
          }
        }
        fs.writeFileSync(cacheFile, JSON.stringify(cache));
        break;
      case 304:
        // cache hit
        log.debug('schema cache hit');
        break;
      default: {
        const message = await res.text();
        log.error({ res: _.pick(res, ['type', 'url', 'status', 'headers']), message },
          'error loading schema');
        throw new Error(`${res.status} error loading schema`);
      }
    }

    content = cacheEntry.content;
  }

  if (_.isString(content)) {
    content = JSON.parse(content);
  }

  return content;
}
