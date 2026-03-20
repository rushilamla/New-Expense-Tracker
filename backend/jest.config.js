/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.{ts,js}"],
  roots: ["<rootDir>/src"],
  moduleFileExtensions: ["ts", "js"],
  // ts-node/register is loaded via the test script.
};

