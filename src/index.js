import 'babel-polyfill';

import _ from 'lodash';

import { getSchema } from './schema';
import { TemplateBuilder } from './template-builder';

export { obj2kv } from './template-builder';

export async function startTemplate(opts, fn) {
  if (!fn && _.isFunction(opts)) {
    fn = opts;
    opts = {};
  }

  const schema = await getSchema({});
  const builder = new TemplateBuilder({ schema });

  await fn({ builder });

  return builder.template;
}
