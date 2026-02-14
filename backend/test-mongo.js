import dns from 'dns';
import mongoose from 'mongoose';

dns.setDefaultResultOrder('ipv4first');

const uri = 'mongodb://Raviraghul:Itachi2005@ac-fp43l65-shard-00-00.1fa5kqd.mongodb.net:27017/farmlyai?ssl=true&authSource=admin&retryWrites=true&w=majority';

console.log('Testing MongoDB connection...');
console.log('URI:', uri.replace(/:[^:@]+@/, ':****@'));
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);

try {
  console.log('\nAttempting connection...');
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  });
  console.log('✓ MongoDB connected successfully!');
  await mongoose.connection.db.admin().ping();
  console.log('✓ Ping successful!');
  await mongoose.disconnect();
  console.log('✓ Disconnected');
  process.exit(0);
} catch (error) {
  console.error('\n✗ Connection failed!');
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  console.error('Error syscall:', error.syscall);
  console.error('\nFull error:', error);
  process.exit(1);
}
