#!/usr/bin/env node

/**
 * Test runner script for BikeManagementScreen
 * 
 * Usage:
 * npm run test:bike-management
 * or
 * node src/screens/admin/__tests__/run-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
  'BikeManagementScreen.test.tsx',
  'BikeManagementScreen.integration.test.tsx',
  'BikeManagementScreen.edge-cases.test.tsx'
];

const testDir = path.join(__dirname);

console.log('🚀 Running BikeManagementScreen Test Suite...\n');

// Run each test file
testFiles.forEach((testFile, index) => {
  console.log(`📋 Running ${testFile} (${index + 1}/${testFiles.length})`);
  console.log('─'.repeat(50));
  
  try {
    const command = `npx jest ${path.join(testDir, testFile)} --verbose --coverage`;
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${testFile} passed\n`);
  } catch (error) {
    console.error(`❌ ${testFile} failed`);
    console.error(error.message);
    process.exit(1);
  }
});

console.log('🎉 All BikeManagementScreen tests passed!');
console.log('\n📊 Test Summary:');
console.log(`• Unit Tests: BikeManagementScreen.test.tsx`);
console.log(`• Integration Tests: BikeManagementScreen.integration.test.tsx`);
console.log(`• Edge Cases: BikeManagementScreen.edge-cases.test.tsx`);
console.log('\n💡 To run individual test files:');
console.log(`npx jest src/screens/admin/__tests__/BikeManagementScreen.test.tsx`);
console.log(`npx jest src/screens/admin/__tests__/BikeManagementScreen.integration.test.tsx`);
console.log(`npx jest src/screens/admin/__tests__/BikeManagementScreen.edge-cases.test.tsx`);
