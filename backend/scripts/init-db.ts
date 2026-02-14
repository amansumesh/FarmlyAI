import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmly_ai';

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ MongoDB connected successfully');

    const db = mongoose.connection.db;

    console.log('\nInitializing collections and indexes...\n');

    // Users Collection
    console.log('Creating users collection...');
    try {
      await db.createCollection('users');
      console.log('✓ Users collection created');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'codeName' in error && error.codeName === 'NamespaceExists') {
        console.log('✓ Users collection already exists');
      } else {
        throw error;
      }
    }

    // Create geospatial index on farm location
    await db.collection('users').createIndex(
      { 'farmProfile.location': '2dsphere' },
      { name: 'farmProfile_location_2dsphere' }
    );
    console.log('✓ Created 2dsphere index on farmProfile.location');

    // Create index on phone number (unique)
    await db.collection('users').createIndex(
      { phoneNumber: 1 },
      { unique: true, name: 'phoneNumber_1' }
    );
    console.log('✓ Created unique index on phoneNumber');

    // Queries Collection
    console.log('\nCreating queries collection...');
    try {
      await db.createCollection('queries');
      console.log('✓ Queries collection created');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'codeName' in error && error.codeName === 'NamespaceExists') {
        console.log('✓ Queries collection already exists');
      } else {
        throw error;
      }
    }

    // Create index on userId for queries
    await db.collection('queries').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_1_createdAt_-1' }
    );
    console.log('✓ Created index on userId and createdAt');

    // Disease Detections Collection
    console.log('\nCreating diseasedetections collection...');
    try {
      await db.createCollection('diseasedetections');
      console.log('✓ Disease detections collection created');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'codeName' in error && error.codeName === 'NamespaceExists') {
        console.log('✓ Disease detections collection already exists');
      } else {
        throw error;
      }
    }

    // Create index on userId for disease detections
    await db.collection('diseasedetections').createIndex(
      { userId: 1, detectedAt: -1 },
      { name: 'userId_1_detectedAt_-1' }
    );
    console.log('✓ Created index on userId and detectedAt');

    // Schemes Collection
    console.log('\nCreating schemes collection...');
    try {
      await db.createCollection('schemes');
      console.log('✓ Schemes collection created');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'codeName' in error && error.codeName === 'NamespaceExists') {
        console.log('✓ Schemes collection already exists');
      } else {
        throw error;
      }
    }

    // Create index on scheme type and state
    await db.collection('schemes').createIndex(
      { type: 1, state: 1 },
      { name: 'type_1_state_1' }
    );
    console.log('✓ Created index on type and state');

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\nCollections created:');
    console.log('  - users (with geospatial index on location)');
    console.log('  - queries');
    console.log('  - diseasedetections');
    console.log('  - schemes');

    await mongoose.connection.close();
    console.log('\nMongoDB connection closed.');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
