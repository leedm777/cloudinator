import _ from 'lodash';

function buildIntrinsicFunction(funcSchema, name) {
  const render = (...params) => {
    if (_.isEmpty(params)) {
      throw new TypeError('Params required');
    } else if (_.size(params) === 1) {
      return ({ [name]: params[0] });
    }
    return ({ [name]: params });
  };

  render.id = `cfn${name.replace(/^Fn::/, '')}`;
  render.cfnName = name;
  render.description = funcSchema.description;
  render.type = funcSchema['return-type'];

  return render;
}

function buildPseudoParam(paramSchema, name) {
  return {
    id: name.replace(/^AWS::/, 'aws'),
    render: () => ({ Ref: name }),
    description: paramSchema.description,
    type: paramSchema.type,
  };
}

function buildComplexObjectBuilder(/* objectSchema, name */) {
  throw new Error('TODO');
}

function buildSimpleObjectBuilder(objectSchema, name) {
  const childSchemaType = _.get(objectSchema, 'default-child-schema.type');
  switch (childSchemaType) {
    case 'Object':
      break;
    case 'Json':
      {
        const build = (fieldName, data) => ({
          render: () => data,
          add: template => _.set(template, `${name}.${fieldName}`, data),
        });
        build.id = name.charAt(0).toLowerCase() + name.slice(1).replace(/s$/, '');
        build.description = objectSchema.description;
        return build;
      }
    case 'ConditionDefinitions':
      break;
    default:
      throw new TypeError(`Unknown type ${childSchemaType}`);
  }
  return null;
}

function buildObjectBuilder(objectSchema, name) {
  if (!_.isEmpty(objectSchema['child-schemas'])) {
    return buildComplexObjectBuilder(objectSchema, name);
  } else if (!_.isEmpty(objectSchema['default-child-schema'])) {
    return buildSimpleObjectBuilder(objectSchema, name);
  }

  throw new TypeError('Expected child-schemas or default-child-schema');
}

function buildSchemaBuilder(objectSchema, name) {
  if (objectSchema.type === 'Named-Array') {
    return buildObjectBuilder(objectSchema, name);
  }

  // Other types don't need a builder
  return null;
}

export function buildDSL(schema) {
  const fn = _(schema['intrinsic-functions'])
    .map(buildIntrinsicFunction)
    .keyBy('id')
    .valueOf();

  const params = _(schema['pseudo-parameters'])
    .map(buildPseudoParam)
    .keyBy('id')
    .valueOf();

  const builders = _(schema['root-schema-object'])
    .map(buildSchemaBuilder)
    .filter(n => !!n)
    .keyBy('id')
    .valueOf();

  return _.assign({}, builders, { fn, params });
}

export function buildTemplate({ description, metadata } = {}) {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
  };
  if (_.isString(description)) {
    template.Description = description;
  }
  if (_.isObject(metadata)) {
    template.Metadata = metadata;
  }

  return {
    toJSON: () => template,
    add: obj => {
      if (!_.isFunction(obj.add)) {
        throw new TypeError(`Cannot add to template ${obj.toString()}`);
      }
      return obj.add(template);
    },
  };
}
