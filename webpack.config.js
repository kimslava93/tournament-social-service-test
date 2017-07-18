const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  entry: ['./public/javascript/index', './public/stylesheets/styles.scss'],
  output: {
    filename: './public/dist/result.js',
    library: 'main',
  },
  watch: NODE_ENV === 'development',
  watchOptions: {
    aggregateTimeout: 100,
  },
  devtool: NODE_ENV === 'development' ? 'source-map' : false,
  plugins: [
    new webpack.NodeEnvironmentPlugin({
      NODE_ENV: JSON.stringify(NODE_ENV),
    }),
    new ExtractTextPlugin({ // define where to save the file
      filename: './public/dist/bundle.css',
      allChunks: true,
    }),
  ],
  module: {
    loaders: [
      {
        test: '/.js$/',
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015'],
        },
      },
    ],
    rules: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          loader: 'css-loader?importLoaders=1',
        }),
      },
      { // sass / scss loader for webpack
        test: /\.(sass|scss)$/,
        loader: ExtractTextPlugin.extract(['css-loader', 'sass-loader']),
      },
    ],
  },
};
if (NODE_ENV === 'production') {
  module.exports.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        drop_console: true,
        unsafe: true,
      },
    }));
}
