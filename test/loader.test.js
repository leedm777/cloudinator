// Copyright (c) 2016, David M. Lee, II

import assert from 'assert';
import path from 'path';

import { loadFile } from '../src/loader';
import { UserError } from '../src/errors';

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
    it('should throw a type error', () => {
      assert.throws(() => {
        loadFile(path.join(__dirname, 'data', 'not-a-template.txt'));
      }, UserError);
    });
  });

  describe('.json files', () => {
    it('should parse', () => {
      const actual = loadFile(path.join(__dirname, 'data', 'template.json'));
      assert.deepStrictEqual(actual, expected);
    });
  });

  describe('.yaml files', () => {
    it('should parse', () => {
      const actual = loadFile(path.join(__dirname, 'data', 'template.yml'));
      assert.deepStrictEqual(actual, expected);
    });
  });

  describe('.js files', () => {
    it('should parse', () => {
      const actual = loadFile(path.join(__dirname, 'data', 'template.js'));
      assert.deepStrictEqual(actual, expected);
    });
  });
});
