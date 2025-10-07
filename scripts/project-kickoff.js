#!/usr/bin/env node

/**
 * Project Kickoff Script
 *
 * Minimal project initialization that creates package.json with essential info
 * and optionally initializes git. Claude Code handles everything else.
 */

import readline from 'readline';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 Project Kickoff\n');
  console.log('This script will create a package.json to get you started.');
  console.log('Claude Code will handle the rest of the scaffolding.\n');

  // Gather project information
  const projectName = await question('Project name: ');
  if (!projectName) {
    console.error('❌ Project name is required');
    process.exit(1);
  }

  const description = await question('Description: ');
  const author = await question('Author (name <email>): ');
  const version = await question('Version (default: 0.1.0): ') || '0.1.0';
  const license = await question('License (default: MIT): ') || 'MIT';
  const repository = await question('Repository URL (optional): ');

  // Package manager choice
  const useYarn = (await question('Use Yarn 4.9.4? (Y/n): ')).toLowerCase() !== 'n';
  const packageManager = useYarn ? 'yarn@4.9.4' : undefined;

  // Create package.json
  const packageJson = {
    name: projectName,
    version: version,
    description: description || '',
    private: true,
    type: 'module',
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      'type-check': 'tsc --noEmit',
      test: 'vitest',
      'test:watch': 'vitest --watch',
      commit: './commit.sh',
      push: './push.sh'
    },
    keywords: [],
    author: author || '',
    license: license,
    dependencies: {},
    devDependencies: {}
  };

  if (repository) {
    packageJson.repository = {
      type: 'git',
      url: repository
    };
  }

  if (packageManager) {
    packageJson.packageManager = packageManager;
  }

  // Write package.json
  fs.writeFileSync(
    path.join(process.cwd(), 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  );

  console.log('\n✅ Created package.json');

  // Create .nvmrc
  fs.writeFileSync(
    path.join(process.cwd(), '.nvmrc'),
    '24.4.1\n'
  );
  console.log('✅ Created .nvmrc (Node.js 24.4.1)');

  // Initialize git (optional)
  const initGit = (await question('\nInitialize git repository? (Y/n): ')).toLowerCase() !== 'n';

  if (initGit) {
    try {
      execSync('git init', { stdio: 'inherit' });
      console.log('✅ Initialized git repository');
    } catch (error) {
      console.error('❌ Failed to initialize git:', error.message);
    }
  }

  console.log('\n✨ Project kickoff complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Ask Claude Code to scaffold your project following UEV patterns');
  console.log('   2. Claude will create folder structure, install dependencies, and configure everything');
  console.log('   3. Review and customize the generated code\n');

  rl.close();
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
