'use strict';

module.exports = (options) => ({
  ...options,
  entry: {
    main: './src/main.ts',
    lambda: './src/lambda.ts',
  },
  output: {
    ...options.output,
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
});
