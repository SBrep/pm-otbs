const nextJest = require("next/jest");

// Указываем директорию с Next.js приложением
const createJestConfig = nextJest({
  dir: "./",
});

// Добавляем пользовательскую конфигурацию Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  moduleDirectories: ["node_modules", "<rootDir>"],
  moduleNameMapper: {
    // Для сокращенных импортов из tsconfig, если они есть
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/components/(.*)$": "<rootDir>/app/components/$1",
    "^@/context/(.*)$": "<rootDir>/app/context/$1",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "!app/**/*.d.ts",
    "!**/node_modules/**",
  ],
};

// Экспортируем конфигурацию для Jest
module.exports = createJestConfig(customJestConfig);
