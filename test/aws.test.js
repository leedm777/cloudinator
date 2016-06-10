import _ from 'lodash';
import _sinon from 'sinon';
import assert from 'assert';
import util from 'util';

import * as aws from '../src/aws';

/**
 * Wrap a promise in the AWS wrapper thingie
 * @param p
 * @returns {{promise: (function(): *)}}
 */
function w(p) {
  return {
    promise: () => p,
  };
}

function AWSError(args) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  _.assign(this, args);
}
util.inherits(AWSError, Error);

describe('aws', () => {
  let sinon;

  beforeEach(() => {
    sinon = _sinon.sandbox.create();
  });

  afterEach(() => {
    sinon.restore();
    sinon = null;
  });

  // non-stubbed methods should do nothing
  it('primum non nocere', async() => {
    try {
      await aws.cfn.describeStacks().promise();
      assert.fail('should not have been successful contacting aws');
    } catch (err) {
      assert.strictEqual(err.message, 'Missing credentials in config');
    }
  });

  describe('listAllResources', () => {
    describe('when aws api throws', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'listStackResources')
          .withArgs({ StackName: 'some-stack', NextToken: undefined })
          .returns(w(Promise.reject(new AWSError({
            code: 'ValidationError',
            message: 'some error',
          }))));
      });

      it('should throw a validation error', async() => {
        try {
          await aws.listAllResources({ stackName: 'some-stack' });
        } catch (err) {
          assert.strictEqual(err.code, 'ValidationError');
        }
      });
    });

    describe('when it returns one page of results', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'listStackResources')
          .withArgs({ StackName: 'some-stack', NextToken: undefined })
          .returns(w(Promise.resolve({
            StackResourceSummaries: ['some-resource', 'another-resource'],
          })));
      });

      it('should return those results', async() => {
        const actual = await aws.listAllResources({ stackName: 'some-stack' });
        assert.deepStrictEqual(actual, ['some-resource', 'another-resource']);
      });
    });

    describe('when it returns multiple pages of results', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'listStackResources')
          .withArgs({ StackName: 'some-stack', NextToken: undefined })
          .returns(w(Promise.resolve({
            StackResourceSummaries: ['some-resource', 'another-resource'],
            NextToken: 'some-token',
          })))
          .withArgs({ StackName: 'some-stack', NextToken: 'some-token' })
          .returns(w(Promise.resolve({
            StackResourceSummaries: ['moar-resources'],
          })));
      });

      it('should return those results', async() => {
        const actual = await aws.listAllResources({ stackName: 'some-stack' });
        assert.deepStrictEqual(actual, ['some-resource', 'another-resource', 'moar-resources']);
      });
    });
  });
});
