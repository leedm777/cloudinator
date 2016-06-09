#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// If server.js exists, we're in development mode and we should use that as
// our entry point. Otherwise, the compiled lib is what we really want.

/* eslint-disable global-require */
fs.stat(path.join(__dirname, '..', 'server.js'), (err) => {
  if (err) {
    require('../lib/cli'); // eslint-disable-line import/no-unresolved
    return;
  }
  require('../server');
});
