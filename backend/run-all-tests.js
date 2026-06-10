import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runScript = (scriptPath) => {
  return new Promise((resolve) => {
    console.log(`\n======================================================`);
    console.log(` RUNNING: ${path.basename(scriptPath)}`);
    console.log(`======================================================`);

    const child = spawn('node', [scriptPath], { stdio: 'inherit' });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
};

const main = async () => {
  try {
    // 1. Check DB Connection
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/studentsphere';
    console.log(`Verifying MongoDB connection to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 2. Ensure test user exists
    const email = 'skg9199725658@gmail.com';
    let user = await User.findOne({ email });
    if (!user) {
      console.log(`Test user ${email} not found. Creating test user...`);
      user = new User({
        fullName: 'Razz',
        email: email,
        password: 'Password123!',
        provider: 'local',
        role: 'student'
      });
      await user.save();
      console.log('Test user created.');
    } else {
      console.log(`Test user exists: ${user.fullName} (${user.email})`);
    }
    await mongoose.disconnect();

    // 3. Find all test scripts
    const files = fs.readdirSync(__dirname);
    const testScripts = files.filter(f => f.startsWith('test-') && f.endsWith('.js'));
    
    // Sort them alphabetically to have a deterministic order
    testScripts.sort();

    console.log(`Found ${testScripts.length} test scripts to run.`);

    // 4. Run reset-and-seed first
    console.log('\nResetting and seeding database...');
    const seedSuccess = await runScript(path.join(__dirname, 'reset-and-seed.js'));
    if (!seedSuccess) {
      console.error('Database seeding failed. Aborting tests.');
      process.exit(1);
    }

    // 5. Run each test script sequentially
    const results = [];
    for (const script of testScripts) {
      const success = await runScript(path.join(__dirname, script));
      results.push({ script, success });
    }

    // 6. Print Summary
    console.log(`\n======================================================`);
    console.log(`                     TEST SUMMARY                     `);
    console.log(`======================================================`);
    let allPassed = true;
    for (const res of results) {
      const status = res.success ? 'PASSED ✅' : 'FAILED ❌';
      if (!res.success) allPassed = false;
      console.log(`${res.script.padEnd(35)} : ${status}`);
    }
    console.log(`======================================================`);
    
    if (allPassed) {
      console.log('🎉 All test suites passed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Some test suites failed.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during test execution:', error);
    process.exit(1);
  }
};

main();
