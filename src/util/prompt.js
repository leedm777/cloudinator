import readline from 'readline';

export function prompt(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(message, answer => {
      resolve(answer);
      rl.close();
    });
  });
}
