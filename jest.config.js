module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/src/screens/admin/__tests__/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@expo|expo|react-native-url-polyfill|@supabase|expo-image-picker|expo-file-system|expo-modules-core)/)'
  ],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^react-native-url-polyfill/auto$': '<rootDir>/src/screens/admin/__tests__/mocks/url-polyfill.js'
  }
};
