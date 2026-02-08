import mongoose from 'mongoose';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

interface ServiceStatus {
  name: string;
  status: 'OK' | 'MISSING' | 'ERROR';
  message: string;
}

async function testAllServices(): Promise<void> {
  const results: ServiceStatus[] = [];

  console.log('\n🔍 Testing All API Services...\n');
  console.log('='.repeat(60));

  // Test MongoDB
  try {
    if (!process.env.MONGODB_URI) {
      results.push({ name: 'MongoDB', status: 'MISSING', message: 'MONGODB_URI not set' });
    } else {
      await mongoose.connect(process.env.MONGODB_URI);
      results.push({ name: 'MongoDB', status: 'OK', message: 'Connected successfully' });
      await mongoose.disconnect();
    }
  } catch (error: any) {
    results.push({ name: 'MongoDB', status: 'ERROR', message: error.message });
  }

  // Test Redis
  try {
    if (!process.env.REDIS_URL) {
      results.push({ name: 'Redis', status: 'MISSING', message: 'REDIS_URL not set' });
    } else {
      const redis = createClient({ url: process.env.REDIS_URL });
      await redis.connect();
      await redis.ping();
      results.push({ name: 'Redis', status: 'OK', message: 'Connected successfully' });
      await redis.disconnect();
    }
  } catch (error: any) {
    results.push({ name: 'Redis', status: 'ERROR', message: error.message });
  }

  // Test Twilio
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.includes('your-')) {
    results.push({ name: 'Twilio', status: 'MISSING', message: 'API keys not configured' });
  } else {
    results.push({ name: 'Twilio', status: 'OK', message: 'API keys found (not tested)' });
  }

  // Test Google Cloud
  if (!process.env.GOOGLE_CLOUD_CREDENTIALS || process.env.GOOGLE_CLOUD_CREDENTIALS.includes('your-')) {
    results.push({ name: 'Google Cloud', status: 'MISSING', message: 'Credentials not configured' });
  } else {
    const fs = await import('fs');
    if (fs.existsSync(process.env.GOOGLE_CLOUD_CREDENTIALS)) {
      results.push({ name: 'Google Cloud', status: 'OK', message: 'Credentials file found' });
    } else {
      results.push({ name: 'Google Cloud', status: 'ERROR', message: 'Credentials file not found' });
    }
  }

  // Test OpenWeatherMap
  if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY.includes('your-')) {
    results.push({ name: 'OpenWeatherMap', status: 'MISSING', message: 'API key not configured' });
  } else {
    results.push({ name: 'OpenWeatherMap', status: 'OK', message: 'API key found (not tested)' });
  }

  // Test Vercel Blob
  if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN.includes('your-')) {
    results.push({ name: 'Vercel Blob', status: 'MISSING', message: 'Token not configured' });
  } else {
    results.push({ name: 'Vercel Blob', status: 'OK', message: 'Token found (not tested)' });
  }

  // Print Results
  console.log('\n📊 Service Status Report:\n');
  
  let allOk = true;
  for (const result of results) {
    const icon = result.status === 'OK' ? '✅' : result.status === 'MISSING' ? '⚠️' : '❌';
    const color = result.status === 'OK' ? '\x1b[32m' : result.status === 'MISSING' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${icon} ${color}${result.name.padEnd(20)}${reset} ${result.status.padEnd(10)} ${result.message}`);
    
    if (result.status !== 'OK') allOk = false;
  }

  console.log('\n' + '='.repeat(60));
  
  if (allOk) {
    console.log('✅ All services are configured and working!\n');
  } else {
    console.log('⚠️  Some services need configuration. Check API_KEYS_SETUP.md\n');
  }

  process.exit(allOk ? 0 : 1);
}

testAllServices().catch(console.error);
