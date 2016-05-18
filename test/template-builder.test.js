import assert from 'assert';
import path from 'path';
import _ from 'lodash';

import { TemplateBuilder } from '../src/template-builder';
import { getSchema } from '../src/schema';
import * as f from './dsl.fixture';

describe('The dsl', () => {
  describe('pseudo-parameters', () => {
    const builder = new TemplateBuilder({ schema: f.pseudoParamsSchema });

    it('should have pseudoParameters', () => {
      assert.ok(builder.pseudoParameters);
      assert.deepEqual(_.keys(builder.pseudoParameters), ['awsRegion', 'awsStackId']);
    });

    it('should render properly', () => {
      assert.deepEqual(_.get(builder, 'pseudoParameters.awsRegion'), { Ref: 'AWS::Region' });
      assert.deepEqual(_.get(builder, 'pseudoParameters.awsStackId'), { Ref: 'AWS::StackId' });
    });
  });

  describe('functions', () => {
    const builder = new TemplateBuilder({ schema: f.functionSchema });
    const expectedFunctions = ['fnObjectParam', 'fnArrayParam', 'fnStringParam'];

    it('should have functions', () => {
      assert.ok(_(expectedFunctions).difference(_.keys(builder)).isEmpty(),
        `Expected ${_.keys(builder)} to include ${expectedFunctions}`);
    });

    _.forEach(expectedFunctions, funcName => {
      describe(funcName, () => {
        let func;
        beforeEach(() => {
          func = builder[funcName];
        });

        it('should be executable', () => {
          assert.ok(_.isFunction(func), `${funcName} should be a function`);
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
    let schema;
    let builder;
    before(async() => {
      schema = await getSchema({
        file: path.resolve(__dirname, '..', 'CloudFormationV1.schema.json'),
      });
    });

    beforeEach(() => {
      builder = new TemplateBuilder({ schema });
    });

    it('should have version number', () => {
      assert.deepEqual(builder.template, { AWSTemplateFormatVersion: '2010-09-09' });
    });

    it('should use given description', () => {
      builder.set({ Description: 'I do things' });
      assert.deepEqual(builder.template, {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'I do things',
      });
    });

    it('should use given metadata', () => {
      builder.set({ Metadata: { meta: 'data' } });
      assert.deepEqual(builder.template, {
        AWSTemplateFormatVersion: '2010-09-09',
        Metadata: { meta: 'data' },
      });
    });

    describe('Parameters', () => {
      it('should have addParameters function', () => {
        assert.ok(_.isFunction(builder.addParameters), 'Should have addParameters function');
      });

      it('should add a parameter to the template', () => {
        builder.addParameters({
          someParam: {
            Type: 'CommaDelimitedList',
            Default: 'default,value',
            Description: 'Some description',
          },
        });

        assert.deepEqual(builder.template, {
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

      it('should return a ref when adding a param', () => {
        const { someParam } = builder.addParameters({
          someParam: {
            Type: 'CommaDelimitedList',
            Default: 'default,value',
            Description: 'Some description',
          },
        });

        assert.deepEqual(someParam, { Ref: 'someParam' });
      });
    });

    describe('Mappings', () => {
      it('should add mapping function to dsl', () => {
        assert.ok(_.isFunction(builder.addMappings), 'Should have mapping function');
      });

      it('should add a mapping to the template', () => {
        builder.addMappings({ someMapping: { mapping: 'data' } });

        assert.deepEqual(builder.template, {
          AWSTemplateFormatVersion: '2010-09-09',
          Mappings: {
            someMapping: { mapping: 'data' },
          },
        });
      });

      it('should add multiple mapping to the template', () => {
        builder.addMappings({
          someMapping: { mapping: 'data' },
          someOtherMapping: { moar: 'data' },
        });

        assert.deepEqual(builder.template, {
          AWSTemplateFormatVersion: '2010-09-09',
          Mappings: {
            someMapping: { mapping: 'data' },
            someOtherMapping: { moar: 'data' },
          },
        });
      });

      it('should return refs for mappings', () => {
        const { someMapping, someOtherMapping } =
          builder.addMappings({
            someMapping: { mapping: 'data' },
            someOtherMapping: { moar: 'data' },
          });

        assert.deepEqual(someMapping, { Ref: 'someMapping' });
        assert.deepEqual(someOtherMapping, { Ref: 'someOtherMapping' });
      });
    });

    describe('Resources', () => {
      it('should add resource object to dsl', () => {
        assert.ok(_.isObject(builder.addResources), 'Should have resource function');
      });

      it('should add a resource to a template', () => {
        builder.addResources({
          someInstance: {
            Type: 'AWS::EC2::Instance',
            Properties: {
              Type: 't2.micro',
              ImageId: 'ami-12345',
              EbsOptimized: false,
            },
          },
        });

        assert.deepEqual(builder.template, {
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            someInstance: {
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

    describe('integration testing', () => {
      it('should build a complicated template', () => {
        const { obj2kv } = TemplateBuilder;
        builder.set({ Description: 'Example template' });

        const SubnetCount = 3;

        const {
          environment,
          vpcCidr,
          publicSubnetCidrs,
          availabilityZones,
        } = builder.addParameters({
          environment: {
            Type: 'String',
            Description: 'Name of this environment',
          },
          vpcCidr: {
            Type: 'String',
            Description: 'CIDR for the overall VPC',
          },
          publicSubnetCidrs: {
            Type: 'CommaDelimitedList',
            Description: 'CIDRs for public subnets',
          },
          availabilityZones: {
            Type: 'CommaDelimitedList',
            Description: 'Availability zones for the subnets',
          },
        });

        const { vpc, gw } = builder.addResources({
          vpc: {
            Type: 'AWS::EC2::VPC',
            Properties: {
              CidrBlock: vpcCidr,
              EnableDnsHostnames: true,
              Tags: obj2kv({ Name: environment }),
            },
          },
          gw: {
            Type: 'AWS::EC2::InternetGateway',
            Properties: { Tags: obj2kv({ Name: environment }) },
          },
        });

        const { gwAttach } = builder.addResources({
          gwAttach: {
            Type: 'AWS::EC2::VPCGatewayAttachment',
            Properties: {
              VpcId: vpc,
              InternetGatewayId: gw,
            },
          },
        });

        const { publicRouteTable } = builder.addResources({
          publicRouteTable: {
            Type: 'AWS::EC2::RouteTable',
            Properties: {
              VpcId: vpc,
              Tags: obj2kv({
                Name: 'public',
                Environment: environment,
              }),
            },
            DependsOn: gwAttach.Ref,
          },
        });

        builder.addResources({
          publicRoute: {
            Type: 'AWS::EC2::Route',
            Properties: {
              DestinationCidrBlock: '0.0.0.0/0',
              GatewayId: gw,
              RouteTableId: publicRouteTable,
            },
          },
        });

        const publicSubnets = _.range(0, SubnetCount).map(num => {
          const publicSubnetName = `publicSubnet${num}`;
          const { [publicSubnetName]: publicSubnet } = builder.addResources({
            [publicSubnetName]: {
              Type: 'AWS::EC2::Subnet',
              Properties: {
                Tags: obj2kv({
                  Name: `public-${num}`,
                  Environment: environment,
                }),
                VpcId: vpc,
                CidrBlock: builder.fnSelect(num, publicSubnetCidrs),
                MapPublicIpOnLaunch: true,
                AvailabilityZone: builder.fnSelect(num, availabilityZones),
              },
            },
          });

          const publicSubnetAssocName = `publicSubnetAssoc${num}`;
          builder.addResources({
            [publicSubnetAssocName]: {
              Type: 'AWS::EC2::SubnetRouteTableAssociation',
              Properties: {
                SubnetId: publicSubnet,
                RouteTableId: publicRouteTable,
              },
            },
          });

          return publicSubnet;
        });

        builder.addOutputs({
          publicSubnets: {
            Description: 'Subnets for public resources',
            Value: builder.fnJoin(',', publicSubnets),
          },
        });

        assert.deepEqual(builder.template, {
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
});
