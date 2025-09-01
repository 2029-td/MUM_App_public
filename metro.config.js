// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname); // __dirname を必ず渡す

// ====== ▼ ここからカスタマイズ ▼ ======
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
  svgTransformerOptions: {
    throwIfNamespace: false,
  },
};

// assetExts から svg を除外
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg'
);

// sourceExts に svg を追加
if (!config.resolver.sourceExts.includes('svg')) {
  config.resolver.sourceExts.push('svg');
}

// CSV を読み込めるように assetExts に追加
if (!config.resolver.assetExts.includes('csv')) {
  config.resolver.assetExts.push('csv');
}
// ====== ▲ ここまでカスタマイズ ▲ ======

module.exports = config;
