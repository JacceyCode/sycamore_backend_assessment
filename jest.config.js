/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.(test|spec).ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{ts,js}", "!src/**/*.d.ts"],
};
