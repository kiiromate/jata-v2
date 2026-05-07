module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/_shared/{ai,capture,telegram}/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
