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

export function buildDSL(schema) {
  const fn = _(schema['intrinsic-functions'])
    .map(buildIntrinsicFunction)
    .keyBy('id')
    .valueOf();

  const params = _(schema['pseudo-parameters'])
    .map(buildPseudoParam)
    .keyBy('id')
    .valueOf();

  return {
    fn,
    params,
  };
}
