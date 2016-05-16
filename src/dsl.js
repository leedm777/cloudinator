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

function mapResourceName(name) {
  let segments = name.split(/::/);
  if (segments[0] === 'AWS') {
    segments = segments.splice(1);
  }
  return segments.join('.');
}

function buildComplexObjectBuilder(objectSchema, name) {
  const res = {
    id: _.lowerFirst(name).replace(/s$/, ''),
    description: objectSchema.description,
  };

  _.forEach(objectSchema['child-schemas'], (childSchema, childName) => {
    const jsName = mapResourceName(childName);
    const build = (fieldName, props) => {
      if (!_.isString(fieldName)) {
        throw new TypeError('fieldName must be a string');
      }

      props = _.assign({}, props, { Type: childName });
      return {
        // TODO: error checking on props
        render() {
          return props;
        },
        add(template) {
          if (_.has(template, `${name}.${fieldName}`)) {
            throw new TypeError(`Template already has ${name}.${fieldName}`);
          }
          _.set(template, `${name}.${fieldName}`, this.render());
          return { Ref: fieldName };
        },
      };
    };
    _.set(res, jsName, build);
  });


  return res;
}

function buildSimpleObjectBuilder(objectSchema, name) {
  const childSchemaType = _.get(objectSchema, 'default-child-schema.type');
  switch (childSchemaType) {
    case 'Object':
      {
        const build = (fieldName, props) => ({
          // TODO: error checking on props
          render() { return props; },
          add(template) {
            _.set(template, `${name}.${fieldName}`, this.render());
            return { Ref: fieldName };
          },
        });

        build.id = _.lowerFirst(name).replace(/s$/, '');
        build.description = objectSchema.description;
        return build;
      }
    case 'Json':
      {
        const build = (fieldName, data) => ({
          add(template) {
            _.set(template, `${name}.${fieldName}`, data);
            return { Ref: fieldName };
          },
        });
        build.id = _.lowerFirst(name).replace(/s$/, '');
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

  const builders = _(_.get(schema, 'root-schema-object.properties'))
    .map(buildSchemaBuilder)
    .filter(n => !!n)
    .keyBy('id')
    .valueOf();

  return _.assign({}, builders, { fn, params });
}

export function buildTemplate({ Description, Metadata } = {}) {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
  };
  if (_.isString(Description)) {
    template.Description = Description;
  }
  if (_.isObject(Metadata)) {
    template.Metadata = Metadata;
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

/**
 * Convert an object into an array of {Key: k, Value: v} objects.
 *
 * @param {object} obj Object to convert.
 * @returns {Array} Array of {Key: k, Value: v} objects.
 */
export function obj2kv(obj) {
  return _.map(obj, (v, k) => ({ Key: k, Value: v }));
}
