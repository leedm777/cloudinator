// Copyright (c) 2016, David M. Lee, II

import AWS from 'aws-sdk';
import _ from 'lodash';

import { log } from './log';
import { loadFile } from './loader';

import { UserError } from './errors';

const cfn = new AWS.CloudFormation({
  apiVersion: '2010-05-15',
  region: 'us-east-1',
});


async function validate(options) {
  const { template } = options;
  if (!template) {
    throw new UserError('Missing argument --template');
  }

  const content = JSON.stringify(loadFile(template));

  await new Promise((resole, reject) => {
    cfn.validateTemplate({ TemplateBody: content }, (err, data) => {
      if (err) {
        reject(new UserError(err.message));
        return;
      }
      log.info({ template }, 'Okay');
    });
  });
}

export default function (program) {
  program
    .command('validate')
    .usage('--template [file] --parameters [file] [options]')
    .description('Validate a template')
    .option('--template [file]', 'Template to plan with')
    .action(options => {
      // eslint-disable-next-line no-param-reassign
      options.parent.subcommand = validate.bind(null, options);
    });
}
