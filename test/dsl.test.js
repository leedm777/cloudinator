import assert from 'assert';
import path from 'path';
import _ from 'lodash';

import { buildDSL, buildTemplate, obj2kv } from '../src/dsl';
import { getSchema } from '../src/schema';
import * as f from './dsl.fixture';

describe('The dsl', () => {
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
      const template = buildTemplate({ Description: 'I do things' });
      const actual = template.toJSON();
      assert.deepEqual(actual, {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'I do things',
      });
    });

    it('should use given metadata', () => {
      const template = buildTemplate({ Metadata: { meta: 'data' } });
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

    describe('Parameters', () => {
      const dsl = buildDSL(f.paramsSchema);

      it('should add param function to dsl', () => {
        assert.ok(_.isFunction(dsl.parameter), 'Should have param function');
      });

      it('should add a parameter to the template', () => {
        const template = buildTemplate();
        template.add(dsl.parameter('someParam', {
          Type: 'CommaDelimitedList',
          Default: 'default,value',
          Description: 'Some description',
        }));

        const actual = template.toJSON();
        assert.deepEqual(actual, {
          AWSTemplateFormatVersion: '2010-09-09',
          Parameters: {
            someParam: {
              Type: 'CommaDelimitedList',
              Default: 'default,value',
              Description: 'Some description',
            },
          },
        });
      });
    });

    describe('Resources', () => {
      const dsl = buildDSL(f.resourcesSchema);
      it('should add resource object to dsl', () => {
        assert.ok(_.isObject(dsl.resource), 'Should have resource object');
      });

      it('should add a resource to a template', () => {
        const template = buildTemplate();
        template.add(new dsl.resource.EC2.Instance('some-instance', {
          Properties: {
            Type: 't2.micro',
            ImageId: 'ami-12345',
            EbsOptimized: false,
          },
        }));

        const actual = template.toJSON();
        assert.deepEqual(actual, {
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            'some-instance': {
              Type: 'AWS::EC2::Instance',
              Properties: {
                Type: 't2.micro',
                ImageId: 'ami-12345',
                EbsOptimized: false,
              },
            },
          },
        });
      });
    });
  });

  describe('integration testing', () => {
    let dsl;

    before(async () => {
      const schema = await getSchema({
        file: path.resolve(__dirname, '..', 'CloudFormationV1.schema.json'),
      });
      dsl = buildDSL(schema);
    });

    it('should build a complicated template', () => {
      const t = buildTemplate({
        Description: 'Example template',
      });

      const SubnetCount = 3;

      const env = t.add(dsl.parameter('environment', {
        Type: 'String',
        Description: 'Name of this environment',
      }));

      const vpcCidr = t.add(dsl.parameter('vpcCidr', {
        Type: 'String',
        Description: 'CIDR for the overall VPC',
      }));

      const publicSubnetCidrs = t.add(dsl.parameter('publicSubnetCidrs', {
        Type: 'CommaDelimitedList',
        Description: 'CIDRs for public subnets',
      }));

      const availabilityZones = t.add(dsl.parameter('availabilityZones', {
        Type: 'CommaDelimitedList',
        Description: 'Availability zones for the subnets',
      }));

      const vpc = t.add(new dsl.resource.EC2.VPC('vpc', {
        Properties: {
          CidrBlock: vpcCidr,
          EnableDnsHostnames: true,
          Tags: obj2kv({ Name: env }),
        },
      }));

      const gw = t.add(new dsl.resource.EC2.InternetGateway('gw', {
        Properties: {
          Tags: obj2kv({ Name: env }),
        },
      }));

      const gwAttach = t.add(new dsl.resource.EC2.VPCGatewayAttachment('gwAttach',
        {
          Properties: {
            VpcId: vpc,
            InternetGatewayId: gw,
          },
        }));

      const publicRouteTable = t.add(new dsl.resource.EC2.RouteTable('publicRouteTable', {
        Properties: {
          VpcId: vpc,
          Tags: obj2kv({
            Name: 'public',
            Environment: env,
          }),
        },
        DependsOn: gwAttach.Ref,
      }));

      t.add(new dsl.resource.EC2.Route('publicRoute', {
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
          GatewayId: gw,
          RouteTableId: publicRouteTable,
        },
      }));

      const publicSubnets = _.range(0, SubnetCount).map(num => t.add(
        new dsl.resource.EC2.Subnet(`publicSubnet${num}`, {
          Properties: {
            Tags: obj2kv({
              Name: `public-${num}`,
              Environment: env,
            }),
            VpcId: vpc,
            CidrBlock: dsl.fn.cfnSelect(num, publicSubnetCidrs),
            MapPublicIpOnLaunch: true,
            AvailabilityZone: dsl.fn.cfnSelect(num, availabilityZones),
          },
        })));

      _.range(0, SubnetCount).map(num => t.add(
        new dsl.resource.EC2.SubnetRouteTableAssociation(`publicSubnetAssoc${num}`, {
          Properties: {
            SubnetId: publicSubnets[num],
            RouteTableId: publicRouteTable,
          },
        })));

      t.add(dsl.output('publicSubnets', {
        Description: 'Subnets for public resources',
        Value: dsl.fn.cfnJoin(',', publicSubnets),
      }));

      const actual = t.toJSON();
      assert.deepEqual(actual, {
        AWSTemplateFormatVersion: '2010-09-09',
        Outputs: {
          publicSubnets: {
            Description: 'Subnets for public resources',
            Value: {
              'Fn::Join': [
                ',',
                [
                  {
                    Ref: 'publicSubnet0',
                  },
                  {
                    Ref: 'publicSubnet1',
                  },
                  {
                    Ref: 'publicSubnet2',
                  },
                ],
              ],
            },
          },
        },
        Parameters: {
          environment: {
            Type: 'String',
            Description: 'Name of this environment',
          },
          publicSubnetCidrs: {
            Type: 'CommaDelimitedList',
            Description: 'CIDRs for public subnets',
          },
          availabilityZones: {
            Type: 'CommaDelimitedList',
            Description: 'Availability zones for the subnets',
          },
          vpcCidr: {
            Type: 'String',
            Description: 'CIDR for the overall VPC',
          },
        },
        Description: 'Example template',
        Resources: {
          vpc: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              CidrBlock: {
                Ref: 'vpcCidr',
              },
              EnableDnsHostnames: true,
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    Ref: 'environment',
                  },
                },
              ],
            },
          },
          gw: {
            Type: 'AWS::EC2::InternetGateway',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: {
                    Ref: 'environment',
                  },
                },
              ],
            },
          },
          gwAttach: {
            Type: 'AWS::EC2::VPCGatewayAttachment',
            Properties: {
              VpcId: {
                Ref: 'vpc',
              },
              InternetGatewayId: {
                Ref: 'gw',
              },
            },
          },
          publicRouteTable: {
            Type: 'AWS::EC2::RouteTable',
            Properties: {
              VpcId: {
                Ref: 'vpc',
              },
              Tags: [
                {
                  Key: 'Name',
                  Value: 'public',
                },
                {
                  Key: 'Environment',
                  Value: {
                    Ref: 'environment',
                  },
                },
              ],
            },
            DependsOn: 'gwAttach',
          },
          publicSubnet0: {
            Type: 'AWS::EC2::Subnet',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: 'public-0',
                },
                {
                  Key: 'Environment',
                  Value: {
                    Ref: 'environment',
                  },
                },
              ],
              VpcId: {
                Ref: 'vpc',
              },
              CidrBlock: {
                'Fn::Select': [
                  0,
                  {
                    Ref: 'publicSubnetCidrs',
                  },
                ],
              },
              MapPublicIpOnLaunch: true,
              AvailabilityZone: {
                'Fn::Select': [
                  0,
                  {
                    Ref: 'availabilityZones',
                  },
                ],
              },
            },
          },
          publicSubnet1: {
            Type: 'AWS::EC2::Subnet',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: 'public-1',
                },
                {
                  Key: 'Environment',
                  Value: {
                    Ref: 'environment',
                  },
                },
              ],
              VpcId: {
                Ref: 'vpc',
              },
              CidrBlock: {
                'Fn::Select': [
                  1,
                  {
                    Ref: 'publicSubnetCidrs',
                  },
                ],
              },
              MapPublicIpOnLaunch: true,
              AvailabilityZone: {
                'Fn::Select': [
                  1,
                  {
                    Ref: 'availabilityZones',
                  },
                ],
              },
            },
          },
          publicSubnet2: {
            Type: 'AWS::EC2::Subnet',
            Properties: {
              Tags: [
                {
                  Key: 'Name',
                  Value: 'public-2',
                },
                {
                  Key: 'Environment',
                  Value: {
                    Ref: 'environment',
                  },
                },
              ],
              VpcId: {
                Ref: 'vpc',
              },
              CidrBlock: {
                'Fn::Select': [
                  2,
                  {
                    Ref: 'publicSubnetCidrs',
                  },
                ],
              },
              MapPublicIpOnLaunch: true,
              AvailabilityZone: {
                'Fn::Select': [
                  2,
                  {
                    Ref: 'availabilityZones',
                  },
                ],
              },
            },
          },
          publicRoute: {
            Type: 'AWS::EC2::Route',
            Properties: {
              GatewayId: {
                Ref: 'gw',
              },
              DestinationCidrBlock: '0.0.0.0/0',
              RouteTableId: {
                Ref: 'publicRouteTable',
              },
            },
          },
          publicSubnetAssoc0: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
              SubnetId: {
                Ref: 'publicSubnet0',
              },
              RouteTableId: {
                Ref: 'publicRouteTable',
              },
            },
          },
          publicSubnetAssoc1: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
              SubnetId: {
                Ref: 'publicSubnet1',
              },
              RouteTableId: {
                Ref: 'publicRouteTable',
              },
            },
          },
          publicSubnetAssoc2: {
            Type: 'AWS::EC2::SubnetRouteTableAssociation',
            Properties: {
              SubnetId: {
                Ref: 'publicSubnet2',
              },
              RouteTableId: {
                Ref: 'publicRouteTable',
              },
            },
          },
        },
      });
    });
  });
});
