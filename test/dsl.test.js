import assert from 'assert';
import _ from 'lodash';

import { buildDSL } from '../src/dsl';
import * as f from './dsl.fixture';

describe.only('The dsl', () => {
  describe('pseudo-parameters', () => {
    const dsl = buildDSL(f.pseudoParamsSchema);
    const uut = _.get(dsl, 'params.awsRegion');

    it('should have params', () => {
      assert.ok(dsl.params);
      assert.deepEqual(_.keys(dsl.params), ['awsRegion', 'awsStackId']);
    });

    it('should have render function', () => {
      assert.ok(_.isFunction(uut.render), 'Should have render function');
    });

    it('should render properly', () => {
      assert.deepEqual(uut.render(), { Ref: 'AWS::Region' });
    });

    it('should have description', () => {
      assert.ok(uut.description, 'Should have description');
    });
  });

  describe('functions', () => {
    const dsl = buildDSL(f.functionSchema);

    it('should have functions', () => {
      assert.ok(dsl.fn, 'Should have functions');
      assert.deepEqual(_.keys(dsl.fn), ['cfnObjectParam', 'cfnArrayParam', 'cfnStringParam']);
    });

    _.forEach(dsl.fn, func => {
      describe(func.id, () => {
        it('should be executable', () => {
          assert.ok(_.isFunction(func), `${func.id} should be a function`);
        });

        it('should have description', () => {
          assert.ok(_.isString(func.description), `${func.id} should have description`);
        });

        it('should require a parameter', () => {
          try {
            func();
            assert.fail('Should throw type error');
          } catch (err) {
            assert.ok(err instanceof TypeError, 'Should throw type error');
          }
        });

        it('should render object parameters', () => {
          const actual = func({ Some: 'Object' });
          assert.deepEqual(actual, { [func.cfnName]: { Some: 'Object' } });
        });

        it('should render string parameters', () => {
          const actual = func('some-string');
          assert.deepEqual(actual, { [func.cfnName]: 'some-string' });
        });

        it('should render array parameters', () => {
          const actual = func(['some-string', 'something-else']);
          assert.deepEqual(actual, { [func.cfnName]: ['some-string', 'something-else'] });
        });
      });
    });
  });
});
