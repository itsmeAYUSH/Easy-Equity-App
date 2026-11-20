module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated 4 ships its Babel plugin in react-native-worklets; keep it last.
    plugins: ["react-native-worklets/plugin"],
  }
}
