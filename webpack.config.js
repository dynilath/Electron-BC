const path = require("path");

module.exports = [
  {
    entry: "./src/main.ts",
    target: "electron-main",
    output: {
      filename: "main.js",
      path: path.resolve(__dirname, "build"),
      libraryTarget: "commonjs2",
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    externals: {
      keytar: "commonjs keytar",
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
  },
  {
    entry: "./src/preload.ts",
    target: "electron-preload",
    output: {
      filename: "preload.js",
      path: path.resolve(__dirname, "build"),
      libraryTarget: "commonjs2",
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
  },
  {
    entry: "./src/render.ts",
    target: "web",
    output: {
      filename: "render.js",
      path: path.resolve(__dirname, "build"),
      libraryTarget: "module",
    },
    resolve: {
      extensions: [".ts", ".js", ".css"],
    },
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    experiments: {
      outputModule: true,
    },
  },
];
