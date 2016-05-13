import assert from 'assert';
import _ from 'lodash';

import { buildDSL, buildTemplate } from '../src/dsl';
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

  describe('building templates', () => {
    it('should have version number', () => {
      const template = buildTemplate();
      const actual = template.toJSON();
      assert.deepEqual(actual, { AWSTemplateFormatVersion: '2010-09-09' });
    });

    it('should use given description', () => {
      const template = buildTemplate({ description: 'I do things' });
      const actual = template.toJSON();
      assert.deepEqual(actual, {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'I do things',
      });
    });

    it('should use given metadata', () => {
      const template = buildTemplate({ metadata: { meta: 'data' } });
      const actual = template.toJSON();
      assert.deepEqual(actual, {
        AWSTemplateFormatVersion: '2010-09-09',
        Metadata: { meta: 'data' },
      });
    });

    describe('Mappings', () => {
      const dsl = buildDSL(f.mappingsSchema);

      it('should add mapping function to dsl', () => {
        assert.ok(_.isFunction(dsl.mapping), 'Should have mapping function');
      });

      it('should add a mapping to the template', () => {
        const template = buildTemplate();
        template.add(dsl.mapping('someMapping', { mapping: 'data' }));

        const actual = template.toJSON();
        assert.deepEqual(actual, {
          AWSTemplateFormatVersion: '2010-09-09',
          Mappings: {
            someMapping: { mapping: 'data' },
          },
        });
      });

      it('should add multiple mapping to the template', () => {
        const template = buildTemplate();
        template.add(dsl.mapping('someMapping', { mapping: 'data' }));
        template.add(dsl.mapping('someOtherMapping', { moar: 'data' }));

        const actual = template.toJSON();
        assert.deepEqual(actual, {
          AWSTemplateFormatVersion: '2010-09-09',
          Mappings: {
            someMapping: { mapping: 'data' },
            someOtherMapping: { moar: 'data' },
          },
        });
      });
    });
  });
});
