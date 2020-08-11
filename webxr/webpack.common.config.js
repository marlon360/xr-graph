module.exports = {
  // no weird "eval" stuff, shows code relatively clear in dist/main.js
  devtool: "none",
  // this is just the entry js that gets bundled
  entry: "./src/index.js",
  module: {
    rules: [
      {
        test: /\.html$/,
        // Exports HTML as string, require references to static resources
        use: ["html-loader"]
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(svg|png|jpg|gif|patt)$/,
        use: {
          // The file-loader resolves import/require() on a file into a url and emits the file into the output directory.
          loader: "file-loader",
          options: {
            name: "[name].[hash].[ext]",
            outputPath: "imgs"
          }
        }
      },
      {
        test: /\.glb$/,
        use: {
          // The file-loader resolves import/require() on a file into a url and emits the file into the output directory.
          loader: "file-loader",
          options: {
            name: "[name].[hash].[ext]",
            outputPath: "models"
          }
        }
      }
    ]
  }
}