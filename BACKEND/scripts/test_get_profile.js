// Simple test script to call executeTool('get_student_profile', ...) and print the result.
// Usage: node test_get_profile.js <accountId>
// It will read MONGO_URI from environment or default to 'mongodb://localhost:27017/uap'

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// require the tool service (relative to BACKEND/scripts)
const { executeTool } = require(path.join(__dirname, '..', 'src', 'services', 'aiToolService'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/uap';
const accountId = process.argv[2];

if (!accountId) {
  console.error('Usage: node test_get_profile.js <accountId>');
  process.exit(1);
}

async function main() {
  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    console.log('Calling get_student_profile for accountId:', accountId);
    const res = await executeTool('get_student_profile', {}, accountId);
    console.log('Result:');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error when calling tool:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
