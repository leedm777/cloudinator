import assert from 'assert';
import _sinon from 'sinon';

import * as uut from '../../src/util/promises';
import { log } from '../../src/util/log';

describe('Promise utilities', () => {
  let sinon;

  beforeEach(() => {
    sinon = _sinon.sandbox.create();
  });

  afterEach(() => {
    sinon.restore();
    sinon = null;
  });

  describe('allSettled', () => {
    describe('empty array', () => {
      it('should return an empty array', async() => {
        const actual = await uut.allSettled([]);
        assert.deepStrictEqual(actual, []);
      });
    });
    describe('array of resolved promises', () => {
      it('should resolve to values', async() => {
        const actual = await uut.allSettled(
          [Promise.resolve('v1'), Promise.resolve('v2')]);
        assert.deepStrictEqual(actual, [{ value: 'v1' }, { value: 'v2' }]);
      });
    });
    describe('array of rejected promises', () => {
      it('should resolve to causes', async() => {
        const actual = await uut.allSettled(
          [Promise.reject('v1'), Promise.reject('v2')]);
        assert.deepStrictEqual(actual, [{ cause: 'v1' }, { cause: 'v2' }]);
      });
    });
  });

  describe('logFailures', () => {
    beforeEach(() => {
      sinon.stub(log, 'error');
    });

    describe('logging empty array', () => {
      it('should return empty array', async () => {
        const actual = await uut.logFailures([], 'should not happen');
        assert.deepStrictEqual(actual, []);
      });

      it('should not call the logger', async () => {
        await uut.logFailures([], 'should not happen');
        assert.strictEqual(log.error.called, false, 'should not have logged');
      });
    });

    describe('logging successful objects', () => {
      it('should return the values', async () => {
        const actual = await uut.logFailures(
          [{ value: 'v1' }, { value: 'v2' }], 'should not happen');
        assert.deepStrictEqual(actual, ['v1', 'v2']);
      });

      it('should not call the logger', async () => {
        await uut.logFailures(
          [{ value: 'v1' }, { value: 'v2' }], 'should not happen');
        assert.strictEqual(log.error.called, false, 'should not have logged');
      });
    });

    describe('logging rejected objects', () => {
      it('should reject with the first error', async () => {
        try {
          await uut.logFailures(
            [{ cause: 'v1' }, { cause: 'v2' }], 'some message');
          assert.fail('should have thrown');
        } catch (err) {
          assert.strictEqual(err, 'v1', 'Should have thrown first error');
        }
      });

      it('should not call the logger', async () => {
        await uut.logFailures(
          [{ value: 'v1' }, { value: 'v2' }], 'should not happen');
        assert.strictEqual(log.error.called, false, 'should not have logged');
      });
    });

    describe('logging resolved promise', () => {
      it('should work', async() => {
        const actual = await uut.logFailures(
          Promise.resolve([{ value: 'v' }]), 'should not happen');
        assert.deepStrictEqual(actual, ['v']);
      });
    });

    describe('logging rejected promise', () => {
      it('should work', async () => {
        try {
          await uut.logFailures(Promise.reject(new Error('some error')), 'should not happen');
          assert.fail('Should have thrown');
        } catch (err) {
          assert.strictEqual(err.message, 'some error');
        }
      });
    });
  });
});
