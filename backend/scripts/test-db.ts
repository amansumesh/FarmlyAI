import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmly_ai';

async function testMongoDBConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log(`URI: ${MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\nExisting collections:');
    if (collections.length === 0) {
      console.log('  No collections found. Run "pnpm run init:db" to create them.');
    } else {
      collections.forEach((collection) => {
        console.log(`  - ${collection.name}`);
      });
    }
    
    // Test write/read operation
    console.log('\nTesting write/read operation...');
    const testCollection = db.collection('_test');
    const testDoc = { test: true, timestamp: new Date() };
    
    await testCollection.insertOne(testDoc);
    console.log('✓ Write operation successful');
    
    const retrieved = await testCollection.findOne({ test: true });
    console.log('✓ Read operation successful', retrieved ? '(Document found)' : '');
    
    await testCollection.deleteOne({ test: true });
    console.log('✓ Delete operation successful');
    
    console.log('\n✅ All MongoDB operations working correctly!');
    
    await mongoose.connection.close();
    console.log('\nConnection closed.');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

testMongoDBConnection();
