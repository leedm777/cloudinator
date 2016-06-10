import _ from 'lodash';
import _sinon from 'sinon';
import assert from 'assert';
import util from 'util';

import * as aws from '../src/aws';

/**
 * Wraps a value with a promise, which is wrapped in the AWS wrapper object
 * that their API returns.
 *
 * @param {*} value Value to wrap.
 * @returns {{promise: (function(): Promise.<*>)}}
 */
function awsResolve(value) {
  return {
    promise: () => Promise.resolve(value),
  };
}

/**
 * Wraps an error with a promise, which is wrapped in the AWS wrapper object
 * that their API returns.
 *
 * @param {Error} cause Cause to wrap.
 * @returns {{promise: (function(): Promise)}}
 */
function awsReject(cause) {
  return {
    promise: () => Promise.reject(cause),
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
          .withArgs({ StackName: 'some-stack', NextToken: null })
          .returns(awsReject(new AWSError({
            code: 'ValidationError',
            message: 'some error',
          })));
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
          .withArgs({ StackName: 'some-stack', NextToken: null })
          .returns(awsResolve({ StackResourceSummaries: ['some-resource', 'another-resource'] }));
      });

      it('should return those results', async() => {
        const actual = await aws.listAllResources({ stackName: 'some-stack' });
        assert.deepStrictEqual(actual, ['some-resource', 'another-resource']);
      });
    });

    describe('when it returns multiple pages of results', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'listStackResources')
          .withArgs({ StackName: 'some-stack', NextToken: null })
          .returns(awsResolve({
            StackResourceSummaries: ['some-resource', 'another-resource'],
            NextToken: 'some-token',
          }))
          .withArgs({ StackName: 'some-stack', NextToken: 'some-token' })
          .returns(awsResolve({ StackResourceSummaries: ['moar-resources'] }));
      });

      it('should return those results', async() => {
        const actual = await aws.listAllResources({ stackName: 'some-stack' });
        assert.deepStrictEqual(actual, ['some-resource', 'another-resource', 'moar-resources']);
      });
    });
  });

  describe('describeStack', () => {
    describe('with invalid params', () => {
      it('should throw a TypeError', async() => {
        try {
          await aws.describeStack();
        } catch (err) {
          assert.ok(err instanceof TypeError, 'Should have thrown TypeError');
        }
      });
    });

    describe('when cfn.describeStacks throws an error', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'describeStacks')
          .withArgs({ StackName: 'some-stack' })
          .returns(awsReject(new AWSError({ code: 'SomeError', message: 'some message' })));
      });

      it('should throw that error', async() => {
        try {
          await aws.describeStack({ stackName: 'some-stack', cached: false });
          assert.fail('should have thrown');
        } catch (err) {
          assert.strictEqual(err.message, 'some message');
        }
      });
    });

    describe('when cfn.describeStacks throws a validation error', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'describeStacks')
          .withArgs({ StackName: 'some-stack' })
          .returns(awsReject(new AWSError({ code: 'ValidationError', message: 'some message' })));
      });

      it('should return null', async() => {
        const actual = await aws.describeStack({ stackName: 'some-stack', cached: false });
        assert.strictEqual(actual, null);
      });
    });

    describe('when cfn.describeStacks returns a stack', () => {
      const someStack = { StackId: '123', StackName: 'some-stack' };

      beforeEach(() => {
        sinon.stub(aws.cfn, 'describeStacks')
          .withArgs({ StackName: 'some-stack' })
          .returns(awsResolve({ Stacks: [someStack] }));
      });

      it('should return that stack', async() => {
        const actual = await aws.describeStack({ stackName: 'some-stack', cached: false });
        assert.deepStrictEqual(actual, someStack);
      });
    });

    describe('caching', () => {
      const someStack = { StackId: '123', StackName: 'some-stack' };

      beforeEach(() => {
        sinon.stub(aws.cfn, 'describeStacks')
          .withArgs({ StackName: 'some-stack' })
          .onCall(0)
          .returns(awsResolve({ Stacks: [someStack] }))
          .onCall(1)
          .returns(awsReject(new Error('should not throw')));
      });

      it('should return that stack', async() => {
        const actual1 = await aws.describeStack({ stackName: 'some-stack', cached: true });
        const actual2 = await aws.describeStack({ stackName: 'some-stack', cached: true });
        assert.deepStrictEqual(actual1, someStack);
        assert.deepStrictEqual(actual2, someStack);
        assert.ok(aws.cfn.describeStacks.calledOnce, 'Should have only called describStacks once');
      });
    });
  });

  describe('getLastEventId', () => {
    describe('when cfn.describeStackEvents throws an error', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'describeStackEvents')
          .withArgs({ StackName: 'some-stack' })
          .returns(awsReject(new Error('some error')));
      });

      it('should throw the error', async() => {
        try {
          await aws.getLastEventId({ stackName: 'some-stack' });
          assert.fail('should have thrown');
        } catch (err) {
          assert.strictEqual(err.message, 'some error');
        }
      });
    });
    describe('when cfn.describeStackEvents returns no events', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'describeStackEvents')
          .withArgs({ StackName: 'some-stack' })
          .returns(awsResolve({ StackEvents: [] }));
      });
      it('should return null', async() => {
        const actual = await aws.getLastEventId({ stackName: 'some-stack' });
        assert.strictEqual(actual, undefined);
      });
    });
    describe('when cfn.describeStackEvents returns some events', () => {
      beforeEach(() => {
        sinon.stub(aws.cfn, 'describeStackEvents')
          .withArgs({ StackName: 'some-stack' })
          .returns(awsResolve({
            StackEvents: [
              { EventId: 'some-event' },
              { EventId: 'some-other-event' },
              { EventId: 'moar-events' },
            ],
          }));
      });

      it('should return the first event id', async () => {
        const actual = await aws.getLastEventId({ stackName: 'some-stack' });
        assert.strictEqual(actual, 'some-event');
      });
    });
  });
});
