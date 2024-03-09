"use strict"
const webpack = require("webpack")
const path = require("path")
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin")

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: { directory: path.join(__dirname) },
    compress: true,
    port: 8000,
  },
  entry: "./examples/examples.ts",
  output: { filename: "./index.js", globalObject: "this" },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.(glsl)$/,
        loader: "raw-loader",
      },
    ],
  },
  resolve: {
    modules: ["node_modules"],
    extensions: [".ts", ".tsx", ".js"],
    fallback: {
      zlib: require.resolve("browserify-zlib"),
      stream: require.resolve("stream-browserify"),
      assert: require.resolve("assert-browserify"),
      buffer: require.resolve("buffer"),
    },
  },
  performance: {
    hints: false,
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),

    // We import some NodeJS-oriented code that expects certain global variables
    // to be present, so we use this plugin to provide those from libraries.
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
}
