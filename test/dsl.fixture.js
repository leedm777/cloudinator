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
