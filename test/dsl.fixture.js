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

