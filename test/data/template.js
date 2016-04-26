module.exports = {
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
