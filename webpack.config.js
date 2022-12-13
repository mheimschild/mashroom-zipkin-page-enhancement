const { resolve } = require("path");

module.exports = {
  mode: "production",
  entry: {
    "zipkinPageEnhancement": "/src/zipkinPageEnhancement.ts"
  },
  output: {
    path: resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  resolve: {
    extensions: ['.js', '.ts'],
    fallback: {
      url: false,
      os: false,
    }
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader"
          }
        ]
      }
    ]
  }
}
