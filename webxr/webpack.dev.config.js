const path = require("path");
const merge = require("webpack-merge");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require("./webpack.common.config");

module.exports = merge(common, {
  mode: "development",
  // no weird "eval" stuff, shows code relatively clear in dist/main.js
  devtool: "none",
  // this is just the entry js that gets bundled
  entry: "./src/index.js",
  output: {
    // the filename is the name of the bundled file
    filename: "main.bundle.js",
    // dist is the folder name it gets exported to
    path: path.resolve(__dirname, "dist")
  },
  devServer: {
    https: true,
    overlay: {
      warnings: false,
      errors: true
    }
  },
  plugins: [new HtmlWebpackPlugin({
    template: "./src/index.html",
    // Injects file in the head of the html
    inject: 'head'
  })]
});