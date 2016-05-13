import _ from 'lodash';

function jsifyFunctionName(name) {
  return `cfn${name.replace(/^Fn::/, '')}`;
}

export function buildDSL(schema) {
  const fn = _(schema['intrinsic-functions'])
    .map((func, name) => {
      const render = (...params) => {
        if (_.isEmpty(params)) {
          throw new TypeError('Params required');
        } else if (_.size(params) === 1) {
          return ({ [name]: params[0] });
        }
        return ({ [name]: params });
      };

      render.id = jsifyFunctionName(name);
      render.cfnName = name;
      render.description = func.description;
      render.returnType = func['return-type'];

      return render;
    })
    .keyBy('id')
    .valueOf();

  return {
    fn,
  };
}
