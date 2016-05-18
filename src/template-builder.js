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

  render.id = `fn${name.replace(/^Fn::/, '')}`;
  render.cfnName = name;

  return render;
}

function buildPseudoParam(paramSchema, name) {
  return {
    id: name.replace(/^AWS::/, 'aws'),
    value: { Ref: name },
  };
}

function validate(/* schema, object */) {
  // TODO: add some validations; log warnings instead of throwing errors
}

export class TemplateBuilder {
  constructor({ schema }) {
    this.template = {
      AWSTemplateFormatVersion: '2010-09-09',
    };
    this.schema = schema;

    this.pseudoParameters = _(schema['pseudo-parameters'])
      .map(buildPseudoParam)
      .keyBy('id')
      .mapValues(v => v.value)
      .value();

    // attach intrinsic functions directly to the template builder
    _.assign(this, _(schema['intrinsic-functions'])
      .map(buildIntrinsicFunction)
      .keyBy('id')
      .value());

    const addBuilder = (objectSchema, name) => {
      const methodName = `add${name}`;
      this[methodName] = obj => {
        let dest = this.template[name];
        if (!dest) {
          dest = this.template[name] = {};
        }
        _.forEach(obj, validate.bind(objectSchema));
        _.assign(dest, obj);
        // return a map of references
        return _.mapValues(obj, (v, k) => ({ Ref: k }));
      };
    };

    _(_.get(schema, 'root-schema-object.properties'))
      .forEach(addBuilder);
  }

  /**
   * Set arbitrary fields in the template.
   * @param obj
   */
  set(obj) {
    validate(this.schema, obj);
    _.assign(this.template, obj);
  }

  /**
   * Convert an object into an array of {Key: k, Value: v} objects.
   *
   * @param {object} obj Object to convert.
   * @returns {Array} Array of {Key: k, Value: v} objects.
   */
  static obj2kv(obj) {
    return _.map(obj, (v, k) => ({ Key: k, Value: v }));
  }
}
