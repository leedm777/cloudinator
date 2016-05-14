/* eslint-disable */

export const pseudoParamsSchema = {
  "pseudo-parameters": {
    "AWS::Region": {
      "type": "String",
      "description": "Returns a string representing the AWS Region in which the encompassing resource is being created."
    },
    "AWS::StackId": {
      "type": "String",
      "description": "Returns the ID of the stack."
    },
  },
};

export const functionSchema = {
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
};

export const mappingsSchema = {
  "root-schema-object": {
    "Mappings": {
      "type": "Named-Array",
      "required": false,
      "description": "Mappings match a key to a corresponding set of named values. For example, if you want to set values based on a region, you can create a mapping that uses the region name as a key and contains the values you want to specify for each specific region.",
      "default-child-schema": {
        "type": "Json",
        "required": true
      }
    }
  }
};

export const paramsSchema = {
  "root-schema-object": {
    "Parameters": {
      "type": "Named-Array",
      "required": false,
      "description": "The optional Parameters section enables you to pass values into your template at stack creation time. Parameters allow you to create templates that can be customized for each stack deployment. When a user creates a stack from a template containing parameters, the user can specify values for those parameters. Within the template, you can use the \"Ref\" intrinsic function to specify those parameter values in properties values for resources.",
      "default-child-schema": {
        "type": "Object",
        "required": false,
        "properties": {
          "Type": {
            "type": "String",
            "required": true,
            "description": "The type of parameter to create.",
            "allowed-values": [
              "String",
              "Number",
              "CommaDelimitedList",
              "AWS::EC2::AvailabilityZone::Name",
              "List<AWS::EC2::AvailabilityZone::Name>",
              "AWS::EC2::Instance::Id",
              "List<AWS::EC2::Instance::Id>",
              "AWS::EC2::Image::Id",
              "List<AWS::EC2::Image::Id>",
              "AWS::EC2::KeyPair::KeyName",
              "AWS::EC2::SecurityGroup::Id",
              "List<AWS::EC2::SecurityGroup::Id>",
              "AWS::EC2::SecurityGroup::GroupName",
              "List<AWS::EC2::SecurityGroup::GroupName>",
              "AWS::EC2::Subnet::Id",
              "List<AWS::EC2::Subnet::Id>",
              "AWS::EC2::Volume::Id",
              "List<AWS::EC2::Volume::Id>",
              "AWS::EC2::VPC::Id",
              "List<AWS::EC2::VPC::Id>",
              "AWS::Route53::HostedZone::Id",
              "List<AWS::Route53::HostedZone::Id>"
            ]
          },
          "Default": {
            "type": "String",
            "required": false,
            "description": "A value of the appropriate type for the template to use if no value is specified at stack creation."
          },
          "NoEcho": {
            "type": "String",
            "required": false,
            "description": "If TRUE, the value of the parameter is masked with asterisks (*****) with cfn-describe-stacks."
          },
          "AllowedValues": {
            "type": "Array",
            "array-type": "String",
            "required": false,
            "description": "An array containing the list of values allowed for the parameter."
          },
          "AllowedPattern": {
            "type": "String",
            "required": false,
            "description": " A regular expression that represents the patterns allowed in the parameter's string value."
          },
          "MaxLength": {
            "type": "String",
            "required": false,
            "description": "A integer value that determines the maximum number of characters in the parameter's string value."
          },
          "MinLength": {
            "type": "String",
            "required": false,
            "description": "A integer value that determines the minimum number of characters in the parameter's string value."
          },
          "MaxValue": {
            "type": "Number",
            "required": false,
            "description": "A numeric value that determines the largest numeric value allowed for the parameter."
          },
          "MinValue": {
            "type": "Number",
            "required": false,
            "description": "A numeric value that determines the smallest numeric value allowed for the parameter."
          },
          "Description": {
            "type": "String",
            "required": false,
            "description": "A String type up to 4000 characters describing the parameter."
          },
          "ConstraintDescription": {
            "type": "String",
            "required": false,
            "description": "A String type that describes the constraint requirements when the user specifies a parameter value that does not match the constraints defined for the parameter."
          }
        }
      }
    }
  }
};

export const resourcesSchema = {
  "root-schema-object": {
    "Resources": {"type": "Named-Array","schema-lookup-property": "Type","required": true,"description": "The required Resources section describes the member resources in your AWS CloudFormation template.","child-schemas": {
      "AWS::EC2::Instance": {
        "type": "Object",
        "required": false,
        "description": "The AWS::EC2::Instance type creates an Amazon EC2 instance.",
        "return-values": [
          {
            "name": "AvailabilityZone",
            "description": "The availability zone where the specified instance is launched. For example: us-east-1b."
          },
          {
            "name": "PrivateDnsName",
            "description": "The private DNS name of the specified instance. For example: ip-10-24-34-0.ec2.internal"
          },
          {
            "name": "PublicDnsName",
            "description": "The public DNS name of the specified instance. For example: ec2-107-20-50-45.compute-1.amazonaws.com"
          },
          {
            "name": "PrivateIp",
            "description": "The private IP address of the specified instance. For example: 10.24.34.0"
          },
          {
            "name": "PublicIp",
            "description": "The public IP address of the specified instance. For example: 192.0.2.0"
          }
        ],
        "properties": {
          "Type": {
            "type": "String",
            "required": true,
            "description": "The AWS::EC2::Instance type creates an Amazon EC2 instance."
          },
          "CreationPolicy": {
            "type": "Object",
            "required": false,
            "description": "The CreationPolicy prevents the resource's status from reaching create complete until AWS CloudFormation receives a specified number of success signals or the timeout period is exceeded.",
            "properties": {
              "ResourceSignal": {
                "type": "Object",
                "required": true,
                "description": "Signal configuration.",
                "properties": {
                  "Count": {
                    "type": "Number",
                    "required": false,
                    "description": "The number of success signals AWS CloudFormation must receive before it sets the resource status as CREATE_COMPLETE."
                  },
                  "Timeout": {
                    "type": "String",
                    "required": false,
                    "description": "The length of time that AWS CloudFormation waits for the number of signals that was specified in the Count property. The value must be in ISO8601 duration format, in the form: PT#H#M#S, where each # is the number of hours, minutes, and seconds, respectively. Default: PT5M (5 minutes)"
                  }
                }
              }
            }
          },
          "Properties": {
            "type": "Object",
            "required": true,
            "properties": {
              "AvailabilityZone": {
                "type": "String",
                "required": false,
                "description": "Specifies the name of the availability zone in which the instance is located. If not specified, the default availability zone for the region will be used.",
                "allowed-values": [
                  "us-east-1a",
                  "us-east-1b",
                  "us-east-1c",
                  "us-east-1d",
                  "us-east-1e",
                  "us-west-1a",
                  "us-west-1b",
                  "us-west-1c",
                  "us-west-2a",
                  "us-west-2b",
                  "us-west-2c",
                  "eu-west-1a",
                  "eu-west-1b",
                  "eu-west-1c",
                  "ap-northeast-1a",
                  "ap-northeast-1b",
                  "ap-northeast-1c",
                  "ap-southeast-1a",
                  "ap-southeast-1b",
                  "ap-southeast-2a",
                  "ap-southeast-2b",
                  "sa-east-1a",
                  "sa-east-1b"
                ]
              },
              "BlockDeviceMappings": {
                "array-type": "Object",
                "type": "Array",
                "required": false,
                "description": "Defines a set of Amazon EC2 Elastic Block Store (EBS) block device mappings.",
                "properties": {
                  "DeviceName": {
                    "type": "String",
                    "required": true,
                    "description": "The name of the device within Amazon EC2."
                  },
                  "Ebs": {
                    "type": "Object",
                    "required": false,
                    "description": "The EC2 EBS Block Device. You can specify either VirtualName or Ebs, but not both.",
                    "properties": {
                      "DeleteOnTermination": {
                        "type": "Boolean",
                        "required": false,
                        "description": "Determines whether to delete the volume on instance termination. The default value is \"true\"."
                      },
                      "Iops": {
                        "type": "String",
                        "required": false,
                        "description": "The number of I/O operations per second (IOPS) that the volume supports. This can be an integer from 100 to 2000. Required when the volume type is \"io1\"; not used with standard volumes."
                      },
                      "SnapshotId": {
                        "type": "String",
                        "required": false,
                        "description": "The snapshot ID of the volume to use to create a block device. If you specify both SnapshotId and VolumeSize, VolumeSize must be equal or greater than the size of the snapshot."
                      },
                      "VolumeSize": {
                        "type": "String",
                        "required": false,
                        "description": "The volume size, in gibibytes (GiB). This can be a number from 1 to 1024. If the volume type is \"io1\", the minimum value is 10. If you specify both SnapshotId and VolumeSize, VolumeSize must be equal or greater than the size of the snapshot."
                      },
                      "VolumeType": {
                        "type": "String",
                        "required": false,
                        "allowed-values": [
                          "*",
                          "standard",
                          "io1",
                          "gp2"
                        ],
                        "description": "The volume size, in gibibytes (GiB). This can be a number from 1 to 1024. If the volume type is \"io1\", the minimum value is 10."
                      }
                    }
                  },
                  "NoDevice": {
                    "type": "Object",
                    "required": false,
                    "description": "This is set to empty map (\"{}\") that be used to unmap a defined device.",
                    "properties": {}
                  },
                  "VirtualName": {
                    "type": "String",
                    "required": true,
                    "description": "The name of the virtual device. The name must be in the form ephemeralX where X is a number starting from zero (0); for example, ephemeral0. You can specify either VirtualName or Ebs, but not both."
                  }
                }
              },
              "DisableApiTermination": {
                "type": "Boolean",
                "required": false,
                "description": "Specifies whether the instance can be terminated through the API (specify \"true\"), or not (specify \"false\")."
              },
              "EbsOptimized": {
                "type": "Boolean",
                "required": false,
                "description": "This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal EBS I/O performance."
              },
              "IamInstanceProfile": {
                "type": "String",
                "resource-ref-type": "AWS::IAM::InstanceProfile",
                "required": false,
                "description": "A reference to an AWS::IAM::InstanceProfile type"
              },
              "ImageId": {
                "type": "String",
                "required": true,
                "description": "Provides the unique ID of the Amazon Machine Image (AMI) that was assigned during registration."
              },
              "InstanceInitiatedShutdownBehavior": {
                "type": "String",
                "required": false,
                "description": "Indicates whether an instance stops or terminates when you shut down the instance from the instance's operating system shutdown command."
              },
              "InstanceType": {
                "type": "String",
                "required": true,
                "description": "The instance type. For example, \"m1.small\".",
                "allowed-values": [
                  "*",
                  "t1.micro",
                  "t2.nano",
                  "t2.micro",
                  "t2.small",
                  "t2.medium",
                  "t2.large",
                  "m1.small",
                  "m1.medium",
                  "m1.large",
                  "m1.xlarge",
                  "m2.xlarge",
                  "m2.2xlarge",
                  "m2.4xlarge",
                  "m3.medium",
                  "m3.large",
                  "m3.xlarge",
                  "m3.2xlarge",
                  "m4.large",
                  "m4.xlarge",
                  "m4.2xlarge",
                  "m4.4xlarge",
                  "m4.10xlarge",
                  "c1.medium",
                  "c1.xlarge",
                  "cr1.8xlarge",
                  "c3.large",
                  "c3.xlarge",
                  "c3.2xlarge",
                  "c3.4xlarge",
                  "c3.8xlarge",
                  "c4.large",
                  "c4.xlarge",
                  "c4.2xlarge",
                  "c4.4xlarge",
                  "c4.8xlarge",
                  "cc1.4xlarge",
                  "cc2.8xlarge",
                  "cg1.4xlarge",
                  "d2.xlarge",
                  "d2.2xlarge",
                  "d2.4xlarge",
                  "d2.8xlarge",
                  "g2.2xlarge",
                  "g2.8xlarge",
                  "hi1.4xlarge",
                  "hs1.8xlarge",
                  "i2.xlarge",
                  "i2.2xlarge",
                  "i2.4xlarge",
                  "i2.8xlarge",
                  "r3.large",
                  "r3.xlarge",
                  "r3.2xlarge",
                  "r3.4xlarge",
                  "r3.8xlarge"
                ]
              },
              "KernelId": {
                "type": "String",
                "required": false,
                "description": "The kernel ID"
              },
              "KeyName": {
                "type": "String",
                "required": false,
                "description": "Provides the name of the EC2 key pair."
              },
              "Monitoring": {
                "type": "Boolean",
                "required": false,
                "description": "Specifies whether monitoring is enabled for the instance."
              },
              "NetworkInterfaces": {
                "type": "Array",
                "array-type": "Object",
                "properties": {
                  "AssociatePublicIpAddress": {
                    "type": "Boolean",
                    "required": false,
                    "description": "Indicates whether the network interface receives a public IP address. You can associate a public IP address with a network interface only if it has a device index of eth0."
                  },
                  "DeleteOnTermination": {
                    "type": "Boolean",
                    "required": false,
                    "description": "Determines whether to delete the network interface on instance termination."
                  },
                  "Description": {
                    "type": "String",
                    "required": false,
                    "description": "The description of this network interface."
                  },
                  "DeviceIndex": {
                    "type": "String",
                    "required": true,
                    "description": "The order in which the network interface should be attached."
                  },
                  "GroupSet": {
                    "type": "Array",
                    "array-type": "String",
                    "required": false,
                    "resource-ref-type": "AWS::EC2::SecurityGroup",
                    "description": "A list of security group IDs associated with this network interface."
                  },
                  "NetworkInterfaceId": {
                    "type": "String",
                    "resource-ref-type": "AWS::EC2::NetworkInterface",
                    "required": true,
                    "description": "The ID of the network interface to attach."
                  },
                  "PrivateIpAddress": {
                    "type": "String",
                    "required": false,
                    "description": "Assigns a single private IP address to the network interface, which is used as the primary private IP address. If you want to specify multiple private IP address, use the PrivateIpAddresses property."
                  },
                  "PrivateIpAddresses": {
                    "type": "Array",
                    "array-type": "Object",
                    "required": false,
                    "description": "Assigns a single private IP address to the network interface, which is used as the primary private IP address. If you want to specify multiple private IP address, use the PrivateIpAddresses property.",
                    "properties": {
                      "PrivateIpAddress": {
                        "type": "String",
                        "required": true,
                        "description": "The private IP address of the network interface."
                      },
                      "Primary": {
                        "type": "Boolean",
                        "required": true,
                        "description": "Sets the private IP address as the primary private address. You can set only one primary private IP address."
                      }
                    }
                  },
                  "SecondaryPrivateIpAddressCount": {
                    "type": "Number",
                    "required": false,
                    "description": "The number of secondary private IP addresses that Amazon EC2 auto assigns to the network interface. Amazon EC2 uses the value of the PrivateIpAddress property as the primary private IP address."
                  },
                  "SubnetId": {
                    "type": "String",
                    "required": false,
                    "resource-ref-type": "AWS::EC2::Subnet",
                    "description": "The ID of the subnet to associate with the network interface."
                  }
                },
                "required": false,
                "description": "A list of network interfaces to associate with this instance."
              },
              "PlacementGroupName": {
                "type": "String",
                "required": false,
                "description": "The name of an existing placement group that you want to launch the instance into (for cluster instances)."
              },
              "PrivateIpAddress": {
                "type": "String",
                "required": false,
                "description": "If you're using an Amazon Virtual Private Cloud (VPC), you can optionally use this parameter to assign the instance a specific available IP address from the subnet (e.g., 10.0.0.25). By default, Amazon VPC selects an IP address from the subnet for the instance."
              },
              "RamdiskId": {
                "type": "String",
                "required": false,
                "description": "The ID of the RAM disk to select. Some kernels require additional drivers at launch. Check the kernel requirements for information about whether you need to specify a RAM disk. To find kernel requirements, refer to the AWS Resource Center and search for the kernel ID."
              },
              "SecurityGroupIds": {
                "type": "Array",
                "array-type": "String",
                "resource-ref-type": "AWS::EC2::SecurityGroup",
                "required": false,
                "description": "A list that contains the security group IDs for VPC security groups to assign to the Amazon EC2 instance."
              },
              "SecurityGroups": {
                "array-type": "String",
                "type": "Array",
                "resource-ref-type": "AWS::EC2::SecurityGroup",
                "required": false,
                "description": "Valid only for EC2 security groups. A list that contains the EC2 security groups to assign to the Amazon EC2 instance. The list can contain both the name of existing EC2 security groups or references to AWS::EC2::SecurityGroup resources created in the template."
              },
              "SourceDestCheck": {
                "type": "Boolean",
                "required": false,
                "description": "Controls whether source/destination checking is enabled on the instance. Also determines if an instance in a VPC will perform network address translation (NAT)."
              },
              "SsmAssociations": {
                "type": "Object",
                "required": false,
                "description": "The Amazon EC2 Simple Systems Manager (SSM) document and parameter values to associate with this instance.",
                "properties": {
                  "AssociationParameters": {
                    "type": "Array",
                    "array-type": "Object",
                    "required": false,
                    "description": "The input parameter values to use with the associated SSM document.",
                    "properties": {
                      "Key": {
                        "type": "String",
                        "required": true,
                        "description": "The name of an input parameter that is in the associated SSM document."
                      },
                      "Value": {
                        "type": "Array",
                        "array-type": "String",
                        "required": true,
                        "description": "The value of an input parameter."
                      }
                    }
                  },
                  "DocumentName": {
                    "type": "String",
                    "required": false,
                    "resource-ref-type": "AWS::SSM::Document",
                    "description": "The name of an SSM document to associate with the instance."
                  }
                }
              },
              "SubnetId": {
                "type": "String",
                "required": false,
                "resource-ref-type": "AWS::EC2::Subnet",
                "description": "If you're using Amazon Virtual Private Cloud, this specifies the ID of the subnet that you want to launch the instance into."
              },
              "Tenancy": {
                "type": "String",
                "required": false,
                "description": "The tenancy of the instance that you want to launch. This value can be either \"default\" or \"dedicated\". An instance that has a tenancy value of \"dedicated\" runs on single-tenant hardware and can be launched only into a VPC."
              },
              "UserData": {
                "type": "String",
                "required": false,
                "description": "Base64-encoded MIME user data that is made available to the instances."
              },
              "Volumes": {
                "type": "Array",
                "array-type": "Object",
                "required": false,
                "description": "The EBS volumes to attach to the instance.",
                "properties": {
                  "Device": {
                    "type": "String",
                    "required": true,
                    "description": "How the device is exposed to the instance (such as /dev/sdh, or xvdh)."
                  },
                  "VolumeId": {
                    "type": "String",
                    "resource-ref-type": "AWS::EC2::Volume",
                    "required": true,
                    "description": "The ID of the Amazon EBS volume. The volume and instance must be within the same Availability Zone and the instance must be running."
                  }
                }
              },
              "Tags": {
                "type": "Array",
                "array-type": "Object",
                "required": false,
                "description": "The tags that you want to attach.",
                "properties": {
                  "Key": {
                    "type": "String",
                    "required": true,
                    "description": "The key term for this item."
                  },
                  "Value": {
                    "type": "String",
                    "required": true,
                    "resource-ref-type": "*",
                    "description": "A value associated with the key term."
                  }
                }
              }
            }
          },
          "Condition": {
            "type": "ConditionDeclaration",
            "required": false,
            "description": "Associated condition that if true will allow the resource to be created."
          },
          "DependsOn": {
            "type": "Resource",
            "required": false,
            "description": "The DependsOn attribute enables you to specify that the creation of a specific resource follows another."
          },
          "DeletionPolicy": {
            "type": "String",
            "required": false,
            "allowed-values": [
              "Delete",
              "Retain"
            ],
            "disable-refs": true,
            "description": "The DeletionPolicy attribute enables you to specify how AWS CloudFormation handles the resource deletion."
          },
          "Metadata": {
            "type": "Json",
            "required": false,
            "description": "The Metadata attribute enables you to associate structured data with a resource."
          }
        }
      }
      ,
      "AWS::RDS::DBInstance": {
        "type": "Object",
        "required": false,
        "description": "The AWS::RDS::DBInstance type creates an Amazon RDS database instance.",
        "return-values": [
          {
            "name": "Endpoint.Address",
            "description": "The connection endpoint for the database. For example: mystack-mydb-1apw1j4phylrk.cg034hpkmmjt.us-east-1.rds.amazonaws.com."
          },
          {
            "name": "Endpoint.Port",
            "description": "The port number on which the database accepts connections. For example: 3306"
          }
        ],
        "properties": {
          "Type": {
            "type": "String",
            "required": true,
            "description": "The AWS::RDS::DBInstance type creates an Amazon RDS database instance."
          },
          "DependsOn": {
            "type": "Resource",
            "required": false,
            "description": "The DependsOn attribute enables you to specify that the creation of a specific resource follows another."
          },
          "DeletionPolicy": {
            "type": "String",
            "required": false,
            "allowed-values": [
              "Delete",
              "Retain",
              "Snapshot"
            ],
            "disable-refs": true,
            "description": "The DeletionPolicy attribute enables you to specify how AWS CloudFormation handles the resource deletion."
          },
          "Metadata": {
            "type": "Json",
            "required": false,
            "description": "The Metadata attribute enables you to associate structured data with a resource."
          },
          "Condition": {
            "type": "ConditionDeclaration",
            "required": false,
            "description": "Associated condition that if true will allow the resource to be created."
          },
          "Properties": {
            "type": "Object",
            "required": true,
            "properties": {
              "AllocatedStorage": {
                "type": "String",
                "required": true,
                "description": "The allocated storage size specified in gigabytes (GB). If any value is used in the Iops parameter, AllocatedStorage must be at least 100 GB, which corresponds to the minimum Iops value of 1000. If Iops is increased (in 1000 IOPS increments), then AllocatedStorage must also be increased (in 100 GB increments) correspondingly."
              },
              "AllowMajorVersionUpgrade": {
                "type": "Boolean",
                "required": false,
                "description": "Indicates whether major version upgrades are allowed. Changing this parameter does not result in an outage, and the change is applied asynchronously as soon as possible."
              },
              "AutoMinorVersionUpgrade": {
                "type": "Boolean",
                "required": false,
                "description": "Indicates that minor engine upgrades will be applied automatically to the DB instance during the maintenance window. The default value is true."
              },
              "AvailabilityZone": {
                "type": "String",
                "required": false,
                "description": "The name of the Availability Zone where the DB instance is. You cannot set the AvailabilityZone parameter if the MultiAZ parameter is set to true.",
                "allowed-values": [
                  "us-east-1a",
                  "us-east-1b",
                  "us-east-1c",
                  "us-east-1d",
                  "us-east-1e",
                  "us-west-1a",
                  "us-west-1b",
                  "us-west-1c",
                  "us-west-2a",
                  "us-west-2b",
                  "us-west-2c",
                  "eu-west-1a",
                  "eu-west-1b",
                  "eu-west-1c",
                  "ap-northeast-1a",
                  "ap-northeast-1b",
                  "ap-northeast-1c",
                  "ap-southeast-1a",
                  "ap-southeast-1b",
                  "ap-southeast-2a",
                  "ap-southeast-2b",
                  "sa-east-1a",
                  "sa-east-1b"
                ]
              },
              "BackupRetentionPeriod": {
                "type": "String",
                "required": false,
                "description": "The number of days for which automatic DB snapshots are retained."
              },
              "CharacterSetName": {
                "type": "String",
                "required": false,
                "description": "For supported engines, specifies the character set to associate with the database instance."
              },
              "DBClusterIdentifier": {
                "type": "String",
                "required": false,
                "resource-ref-type": "AWS::RDS::DBCluster",
                "description": "The identifier of an existing DB cluster that this instance will be associated with."
              },
              "DBInstanceClass": {
                "type": "String",
                "required": true,
                "allowed-values": [
                  "*",
                  "db.t1.micro",
                  "db.m1.small",
                  "db.m1.medium",
                  "db.m1.large",
                  "db.m1.xlarge",
                  "db.m2.xlarge",
                  "db.m2.2xlarge",
                  "db.m2.4xlarge",
                  "db.m3.medium",
                  "db.m3.large",
                  "db.m3.xlarge",
                  "db.m3.2xlarge",
                  "db.m4.large",
                  "db.m4.xlarge",
                  "db.m4.2xlarge",
                  "db.m4.4xlarge",
                  "db.m4.10xlarge",
                  "db.r3.large",
                  "db.r3.xlarge",
                  "db.r3.2xlarge",
                  "db.r3.4xlarge",
                  "db.r3.8xlarge",
                  "db.t2.micro",
                  "db.t2.small",
                  "db.t2.medium",
                  "db.t2.large"
                ],
                "description": "The name of the compute and memory capacity class of the DB instance."
              },
              "DBInstanceIdentifier": {
                "type": "String",
                "required": false,
                "description": "A name for the DB instance. If you don't specify a name, AWS CloudFormation generates a unique physical ID and uses that ID for the DB instance."
              },
              "DBName": {
                "type": "String",
                "required": false,
                "description": "The name of the initial database of this instance that was provided at create time, if one was specified when the DB instance was created. This same name is returned for the life of the DB instance."
              },
              "DBParameterGroupName": {
                "type": "String",
                "resource-ref-type": "AWS::RDS::DBParameterGroup",
                "required": false,
                "description": "The name of an existing DB parameter group or a reference to an AWS::RDS::DBParameterGroup resource created in the template."
              },
              "DBSecurityGroups": {
                "type": "Array",
                "array-type": "String",
                "resource-ref-type": "AWS::RDS::DBSecurityGroup",
                "required": false,
                "description": "A list containing the DB security groups to assign to the Amazon RDS instance. The list can contain both the name of existing DB security groups or references to AWS::RDS::DBSecurityGroup resources created in the template."
              },
              "DBSnapshotIdentifier": {
                "type": "String",
                "required": false,
                "description": "The identifier for the DB snapshot to restore from."
              },
              "DBSubnetGroupName": {
                "type": "String",
                "resource-ref-type": "AWS::RDS::DBSubnetGroup",
                "required": false,
                "description": "A DB Subnet Group to associate with this DB instance."
              },
              "Engine": {
                "type": "String",
                "required": true,
                "description": "The name of the database engine to be used for this DB instance.",
                "allowed-values": [
                  "*",
                  "MySQL",
                  "mariadb",
                  "oracle-se1",
                  "oracle-se",
                  "oracle-ee",
                  "sqlserver-ee",
                  "sqlserver-se",
                  "sqlserver-ex",
                  "sqlserver-web",
                  "postgres",
                  "aurora"
                ]
              },
              "EngineVersion": {
                "type": "String",
                "required": false,
                "description": "The version number of the database engine to use."
              },
              "Iops": {
                "type": "String",
                "required": false,
                "description": "The number of I/O operations per second (IOPS) that the database should provision. This can be any value from 1000�10,000, in 1000 IOPS increments."
              },
              "KmsKeyId": {
                "type": "String",
                "required": false,
                "description": "The Amazon Resource Name (ARN) of the AWS Key Management Service master key that is used to encrypt the database instance."
              },
              "LicenseModel": {
                "type": "String",
                "required": false,
                "description": "The license model information for this DB instance."
              },
              "MasterUsername": {
                "type": "String",
                "required": true,
                "description": "The master username for the DB instance."
              },
              "MasterUserPassword": {
                "type": "String",
                "required": true,
                "description": "The master password for the DB instance."
              },
              "MultiAZ": {
                "type": "Boolean",
                "required": false,
                "description": "Specifies if the DB instance is a multiple availability-zone deployment. You cannot set the AvailabilityZone parameter if the MultiAZ parameter is set to true."
              },
              "OptionGroupName": {
                "type": "String",
                "required": false,
                "resource-ref-type": "AWS::RDS::OptionGroup",
                "description": "An option group that this database instance is associated with."
              },
              "Port": {
                "type": "String",
                "required": false,
                "description": "The port for the instance."
              },
              "PreferredBackupWindow": {
                "type": "String",
                "required": false,
                "description": "The daily time range during which automated backups are created if automated backups are enabled, as determined by the BackupRetentionPeriod."
              },
              "PreferredMaintenanceWindow": {
                "type": "String",
                "required": false,
                "description": "The weekly time range (in UTC) during which system maintenance can occur."
              },
              "PubliclyAccessible": {
                "type": "Boolean",
                "required": false,
                "description": "Indicates whether the database instance is an Internet-facing instance. If you specify true, an instance is created with a publicly resolvable DNS name, which resolves to a public IP address. If you specify false, an internal instance is created with a DNS name that resolves to a private IP address."
              },
              "SourceDBInstanceIdentifier": {
                "type": "String",
                "required": false,
                "resource-ref-type": "AWS::RDS::DBInstance",
                "description": "If you want to create a read replica DB instance, specify the ID of the source DB instance."
              },
              "StorageEncrypted": {
                "type": "Boolean",
                "required": false,
                "description": "Indicates whether the database instance is encrypted."
              },
              "StorageType": {
                "type": "String",
                "required": false,
                "allowed-values": [
                  "standard",
                  "gp2",
                  "io1",
                  "*"
                ],
                "description": "The storage type associated with this database instance."
              },
              "VPCSecurityGroups": {
                "type": "Array",
                "array-type": "String",
                "resource-ref-type": "AWS::EC2::SecurityGroup",
                "required": false,
                "description": "A list of the VPC security groups to assign to the Amazon RDS instance."
              },
              "Tags": {
                "type": "Array",
                "array-type": "Object",
                "required": false,
                "description": "The tags that you want to attach.",
                "properties": {
                  "Key": {
                    "type": "String",
                    "required": true,
                    "description": "The key term for this item."
                  },
                  "Value": {
                    "type": "String",
                    "required": true,
                    "resource-ref-type": "*",
                    "description": "A value associated with the key term."
                  }
                }
              }
            }
          }
        }
      }
      ,
      "AWS::RDS::DBParameterGroup": {
        "type": "Object",
        "required": false,
        "description": "Creates a custom parameter group for an RDS database family.",
        "properties": {
          "Type": {
            "type": "String",
            "required": true,
            "description": "Creates a custom parameter group for an RDS database family."
          },
          "Properties": {
            "type": "Object",
            "required": true,
            "properties": {
              "Description": {
                "type": "String",
                "required": true,
                "description": "A friendly description of the RDS parameter group. For example, \"My Parameter Group\"."
              },
              "Family": {
                "type": "String",
                "required": true,
                "description": "The database family of this RDS parameter group. For example, \"MySQL5.1\"."
              },
              "Parameters": {
                "type": "Json",
                "required": true,
                "description": "The parameters to set for this RDS parameter group."
              },
              "Tags": {
                "type": "Array",
                "array-type": "Object",
                "required": false,
                "description": "The tags that you want to attach.",
                "properties": {
                  "Key": {
                    "type": "String",
                    "required": true,
                    "description": "The key term for this item."
                  },
                  "Value": {
                    "type": "String",
                    "required": true,
                    "resource-ref-type": "*",
                    "description": "A value associated with the key term."
                  }
                }
              }
            }
          },
          "Condition": {
            "type": "ConditionDeclaration",
            "required": false,
            "description": "Associated condition that if true will allow the resource to be created."
          },
          "DependsOn": {
            "type": "Resource",
            "required": false,
            "description": "The DependsOn attribute enables you to specify that the creation of a specific resource follows another."
          },
          "DeletionPolicy": {
            "type": "String",
            "required": false,
            "allowed-values": [
              "Delete",
              "Retain"
            ],
            "disable-refs": true,
            "description": "The DeletionPolicy attribute enables you to specify how AWS CloudFormation handles the resource deletion."
          },
          "Metadata": {
            "type": "Json",
            "required": false,
            "description": "The Metadata attribute enables you to associate structured data with a resource."
          }
        }
      }
      }
    }
  }
};
