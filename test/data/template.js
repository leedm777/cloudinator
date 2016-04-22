module.exports = {
  Parameters: {
    Name: 'imageId',
    Description: 'The AMI to launch',
  },
  Resources: {
    Type: 'AWS::EC2::Instance',
    Properties: {
      ImageId: { Ref: 'imageId' },
    },
  },
};
