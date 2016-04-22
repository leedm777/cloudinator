// Copyright (c) 2016, David M. Lee, II

import util from 'util';

// For some reason, ES6 class extend wasn't filling in stack trace :-(
// export class UserError extends Error {
//   constructor(message) {
//     super();
//     this.message = message;
//     this.name = this.constructor.name;
//     Error.captureStackTrace(this, this.constructor);
//   }
// }

export function UserError(message) {
  Error.call(this);
  this.message = message;
  Error.captureStackTrace(this, this.constructor);
}

util.inherits(UserError, Error);
