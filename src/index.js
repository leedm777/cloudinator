import 'babel-polyfill';

import _ from 'lodash';

import { getSchema } from './schema';
import { buildDSL, buildTemplate } from './dsl';

export { obj2kv } from './dsl';

export async function startTemplate(opts, fn) {
  if (!fn && _.isFunction(opts)) {
    fn = opts;
    opts = {};
  }

  const schema = await getSchema({});
  const dsl = buildDSL(schema);
  const template = buildTemplate(opts.template);

  return fn({ template, dsl });
}
