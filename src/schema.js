import fetch from 'node-fetch';
import fs from 'fs';

const URL = 'http://vstoolkit.amazonwebservices.com/CloudFormationSchema/CloudFormationV1.schema';

export async function getSchema({ url = URL, file } = {}) {
  let content;

  if (file) {
    content = await new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  } else {
    content = await fetch(url)
      .then(res => res.text());
  }

  return JSON.parse(content);
}
