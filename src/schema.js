import fetch from 'node-fetch';
import fs from 'fs';

const URL = 'http://vstoolkit.amazonwebservices.com/CloudFormationSchema/CloudFormationV1.schema';

export async function getSchema({ url = URL, file }) {
  let content;

  if (file) {
    content = new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  } else {
    content = fetch(url)
      .then(res => res.text());
  }

  return JSON.parse(await content);
}
