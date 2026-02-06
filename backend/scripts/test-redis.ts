import { createClient } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function testRedisConnection() {
  const client = createClient({
    url: REDIS_URL,
  });

  try {
    console.log('Testing Redis connection...');
    console.log(`URL: ${REDIS_URL.replace(/:\/\/.*@/, '://<credentials>@')}`);
    
    await client.connect();
    console.log('✅ Redis connected successfully');
    
    // Test set operation
    console.log('\nTesting set operation...');
    await client.set('test_key', 'test_value', { EX: 60 });
    console.log('✓ Set operation successful');
    
    // Test get operation
    console.log('Testing get operation...');
    const value = await client.get('test_key');
    if (value === 'test_value') {
      console.log('✓ Get operation successful (value matches)');
    } else {
      throw new Error('Retrieved value does not match');
    }
    
    // Test delete operation
    console.log('Testing delete operation...');
    await client.del('test_key');
    console.log('✓ Delete operation successful');
    
    // Verify deletion
    const deletedValue = await client.get('test_key');
    if (deletedValue === null) {
      console.log('✓ Verification successful (key deleted)');
    } else {
      throw new Error('Key was not deleted');
    }
    
    // Test cache with TTL
    console.log('\nTesting cache with TTL...');
    await client.set('ttl_test', 'temporary', { EX: 2 });
    const ttl = await client.ttl('ttl_test');
    console.log(`✓ TTL set successfully (${ttl} seconds remaining)`);
    
    console.log('\n✅ All Redis operations working correctly!');
    
    await client.disconnect();
    console.log('\nConnection closed.');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    await client.disconnect();
    process.exit(1);
  }
}

testRedisConnection();
