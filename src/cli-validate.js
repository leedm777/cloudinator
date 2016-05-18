// Copyright (c) 2016, David M. Lee, II

import AWS from 'aws-sdk';

import { UserError } from './errors';
import { loadFile } from './loader';
import { log } from './log';

const cfn = new AWS.CloudFormation({
  apiVersion: '2010-05-15',
  region: 'us-east-1',
});

async function validate({ template }) {
  if (!template) {
    throw new UserError('Missing argument --template');
  }

  let content;
  try {
    content = JSON.stringify(await loadFile(template));
  } catch (err) {
    throw new UserError(err.message);
  }

  await cfn.validateTemplate({ TemplateBody: content }).promise();
  // nothing much to do with the results
  log.info({ template }, 'Okay');
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
