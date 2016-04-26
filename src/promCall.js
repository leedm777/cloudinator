export function promCall(fn, self, ...args) {
  return new Promise((resolve, reject) => {
    args.push((e, v) => {
      if (e) {
        reject(e);
        return;
      }
      resolve(v);
    });
    fn.apply(self, args);
  });
}
