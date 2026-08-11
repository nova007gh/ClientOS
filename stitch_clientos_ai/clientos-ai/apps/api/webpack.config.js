const path = require('path');

module.exports = (options) => {
  return {
    ...options,
    externals: [],
    resolve: {
      ...options.resolve,
      alias: {
        '@clientos/database': path.resolve(__dirname, '../../packages/database/src'),
        '@clientos/types': path.resolve(__dirname, '../../packages/types/src'),
        '@clientos/validation': path.resolve(__dirname, '../../packages/validation/src'),
      },
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    module: {
      ...options.module,
      rules: [
        {
          test: /\.ts$/,
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, '../../packages/database/src'),
            path.resolve(__dirname, '../../packages/types/src'),
            path.resolve(__dirname, '../../packages/validation/src'),
          ],
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: path.resolve(__dirname, 'tsconfig.json'),
              },
            },
          ],
        },
      ],
    },
  };
};
