import assert from 'assert';
import _ from 'lodash';

import { buildDSL } from '../src/dsl';

describe.only('The dsl', () => {
  describe('with valid schema', () => {
    describe('functions', () => {
      /* eslint-disable */
      const dsl = buildDSL({
        "intrinsic-functions": {
          "Fn::ObjectParam": {
            "parameter": "Object",
            "return-type": "String",
            "description": "The intrinsic function Fn::Base64 returns the Base64 representation of the input string. This function is typically used to pass encoded data to Amazon EC2 instances by way of the UserData property.",
            "skeleton": "{\"Fn::Base64\" : {}}"
          },
          "Fn::ArrayParam": {
            "parameter": "Array",
            "return-type": "String",
            "description": "The intrinsic function Fn::FindInMap returns the value of a key from a mapping declared in the Mappings section.",
            "skeleton": "{\"Fn::FindInMap\" : [ \"\" , \"\", \"\"] }"
          },
          "Fn::StringParam": {
            "parameter": "String",
            "return-type": "Array",
            "description": "The intrinsic function Fn::GetAZs returns an array that lists all Availability Zones for the specified region.",
            "skeleton": "{ \"Fn::GetAZs\" : \"\" }"
          },
        },
      });
      /* eslint-enable */

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
});
