import fetch from 'node-fetch';

const URL = 'http://vstoolkit.amazonwebservices.com/CloudFormationSchema/CloudFormationV1.schema';

export async function getSchema({ url = URL, file }) {
  let content;

  if (file) {
    content = await new Promise(/* TODO: read file */);
  } else {
    content = fetch(url)
      .then(res => res.text());
  }

  return JSON.parse(content);
}
