#!/usr/bin/env node

/**
 * Deployment verification script
 * Checks that all necessary files are present for AWS Amplify deployment
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const requiredFiles = [
  'amplify.yml',
  'public/_redirects',
  'public/manifest.json',
  'public/robots.txt',
  'dist/index.html',
  'package.json'
];

const requiredPackageScripts = [
  'build',
  'dev',
  'preview'
];

console.log('🔍 Verifying deployment readiness...\n');

let allGood = true;

// Check required files
console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  const exists = existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts:');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  requiredPackageScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} npm run ${script}`);
    if (!exists) allGood = false;
  });
} catch (error) {
  console.log('  ❌ Could not read package.json');
  allGood = false;
}

// Check build output
console.log('\n🏗️  Checking build output:');
const buildExists = existsSync('dist');
console.log(`  ${buildExists ? '✅' : '❌'} dist/ directory exists`);
if (!buildExists) allGood = false;

// Check HTTPS in API calls
console.log('\n🔒 Checking HTTPS usage:');
try {
  const apiServiceContent = readFileSync('src/services/api/SleeperApiService.ts', 'utf8');
  const usesHttps = apiServiceContent.includes('https://api.sleeper.app');
  console.log(`  ${usesHttps ? '✅' : '❌'} Sleeper API uses HTTPS`);
  if (!usesHttps) allGood = false;
} catch (error) {
  console.log('  ❌ Could not verify API service HTTPS usage');
  allGood = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 All checks passed! Ready for AWS Amplify deployment.');
  console.log('\nNext steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect repository to AWS Amplify');
  console.log('3. Deploy and test');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}