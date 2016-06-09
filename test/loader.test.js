// Copyright (c) 2016, David M. Lee, II

import assert from 'assert';
import path from 'path';

import { loadFile } from '../src/util/loader';
import { UserError } from '../src/util/errors';

describe('loader', () => {
  const expected = {
    Parameters: {
      imageId: {
        Type: 'String',
        Description: 'The AMI to launch',
      },
    },
    Resources: {
      someInstance: {
        Type: 'AWS::EC2::Instance',
        Properties: {
          ImageId: { Ref: 'imageId' },
        },
      },
    },
  };

  describe('.txt files', () => {
    it('should reject with a type error', async () => {
      try {
        await loadFile(path.join(__dirname, 'data', 'not-a-template.txt'));
        assert.fail('should not have loaded');
      } catch (err) {
        assert.ok(err instanceof UserError);
      }
    });
  });

  describe('.json files', () => {
    it('should parse', async () => {
      const actual = await loadFile(path.join(__dirname, 'data', 'template.json'));
      assert.deepStrictEqual(actual, expected);
    });
  });

  describe('.yaml files', () => {
    it('should parse', async () => {
      const actual = await loadFile(path.join(__dirname, 'data', 'template.yml'));
      assert.deepStrictEqual(actual, expected);
    });
  });

  describe('.js files', () => {
    it('should parse', async () => {
      const actual = await loadFile(path.join(__dirname, 'data', 'template.js'));
      assert.deepStrictEqual(actual, expected);
    });
  });
});
