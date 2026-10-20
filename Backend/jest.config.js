module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  setupFiles: ["<rootDir>/tests/setup.js"],
    globalSetup: "./tests/globalSetup.js",

};