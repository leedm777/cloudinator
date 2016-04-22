# cfn-dsl

CloudFormation DSL for writing templates without insanity, plus tooling for
managing stacks.

```JavaScript
import { Template } from 'cfn-dsl';

export default Template.build(template => {
  const imageId = template.addParamater({
    Name: 'imageId',
    Description: 'The AMI to launch',
  });
  template.addResource(new Instance({
    ImageId: imageId
  });
})
```
