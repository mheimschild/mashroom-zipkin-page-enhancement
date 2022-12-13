module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: [
          'last 3 major versions',
          'not ie > 0'
        ]
      }
    }],
    '@babel/preset-typescript',
  ],
}
