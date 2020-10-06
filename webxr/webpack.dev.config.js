const path = require("path");
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require("./webpack.common.config");

module.exports = merge(common, {
  node: {
    fs: 'empty'
  },
  mode: "development",
  // no weird "eval" stuff, shows code relatively clear in dist/main.js
  devtool: "none",
  // this is just the entry js that gets bundled
  entry: {
    vr: "./src/index.js",
    ar: "./src/ar-script.js"
  },
  output: {
    // the filename is the name of the bundled file
    filename: "[name].bundle.js",
    // dist is the folder name it gets exported to
    path: path.resolve(__dirname, "dist")
  },
  devServer: {
    https: true,
    host: '0.0.0.0',
    overlay: {
      warnings: false,
      errors: true
    }
  },
  plugins: [new HtmlWebpackPlugin({
    favicon: "./src/images/favicon.png",
    chunks: ['vr'],
    template: "./src/index.html",
    filename: "index.html",
    // Injects file in the head of the html
    inject: 'head'
  }),
  new HtmlWebpackPlugin({
    favicon: "./src/images/favicon.png",
    chunks: ['ar'],
    template: "./src/ar.html",
    filename: "ar.html",
    // Injects file in the head of the html
    inject: 'head'
  })]
});