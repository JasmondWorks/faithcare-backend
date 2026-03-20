'use strict';
// Shim: Vercel detects files in api/ as serverless functions.
// The NestJS app is compiled to dist/lambda.js by the buildCommand.
module.exports = require('../dist/lambda').default;
