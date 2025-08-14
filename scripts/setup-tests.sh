#!/bin/bash

# Setup script for BikeManagementScreen tests
echo "🚀 Setting up test environment for BikeManagementScreen..."

# Install test dependencies
echo "📦 Installing test dependencies..."
npm install --save-dev \
  @testing-library/react-native \
  @testing-library/jest-native \
  @types/jest \
  jest \
  react-test-renderer \
  @react-native-async-storage/async-storage

# Setup Jest configuration if not exists
if [ ! -f "jest.config.js" ]; then
  echo "⚙️ Creating Jest configuration..."
  cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/screens/admin/__tests__/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@expo|expo)/)'
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
  testEnvironment: 'jsdom'
};
EOF
fi

# Add test scripts to package.json if not exists
echo "📝 Adding test scripts to package.json..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.scripts) pkg.scripts = {};
pkg.scripts['test'] = 'jest';
pkg.scripts['test:watch'] = 'jest --watch';
pkg.scripts['test:coverage'] = 'jest --coverage';
pkg.scripts['test:bike-management'] = 'jest src/screens/admin/__tests__/BikeManagementScreen';
pkg.scripts['test:bike-management:watch'] = 'jest src/screens/admin/__tests__/BikeManagementScreen --watch';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "✅ Test environment setup complete!"
echo ""
echo "🧪 Available test commands:"
echo "  npm test                           - Run all tests"
echo "  npm run test:watch                 - Run tests in watch mode"
echo "  npm run test:coverage              - Run tests with coverage"
echo "  npm run test:bike-management       - Run BikeManagementScreen tests only"
echo "  npm run test:bike-management:watch - Run BikeManagementScreen tests in watch mode"
echo ""
echo "🚀 To run BikeManagementScreen tests:"
echo "  npm run test:bike-management"
