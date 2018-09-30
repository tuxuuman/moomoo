const path = require('path');

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: './src/moomoo.js',
    
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'moomoo.js',
        library: "MooMoo",
    },
    module: {
        rules: [
          {
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          }
        ]
      }
};
