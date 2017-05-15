# cloudinator

CloudFormation tooling and DSL for writing templates without insanity.

Just an idea; no clue how workable this actually might be.

```JavaScript
import { Template } from 'cloudinator';

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
