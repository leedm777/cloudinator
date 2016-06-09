'use strict'; // eslint-disable-line strict

const fs = require('fs');
const path = require('path');

// If src exists, we're in development mode and we should use that as our entry
// point. Otherwise, the compiled lib is what we really want.

/* eslint-disable global-require */
let err = null;
try {
  fs.statSync(path.join(__dirname, 'src'));
} catch (e) {
  err = e;
}

if (err) {
  module.exports = require('./lib'); // eslint-disable-line import/no-unresolved
} else {
  require('babel-polyfill');
  require('babel-register')({
    retainLines: typeof v8debug !== 'undefined',
  });
  module.exports = require('./src');
}

