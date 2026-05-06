module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/_shared/{ai,capture}/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
