module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/_shared/ai/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
