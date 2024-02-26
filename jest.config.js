/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  transform: {
    "^.+\\.ts?$": "ts-jest",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/fileTransformer.js",
    "\\.(svg)$": "<rootDir>/svgTransformer.js",
  },
  testRegex: ".*\.test\.ts$",
  moduleFileExtensions: ["ts", "js"],
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  moduleNameMapper: {
    "\\.(ttf)$": "<rootDir>/__mocks__/font.ttf"
  }
};
