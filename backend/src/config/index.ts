import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/farmly_ai',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || '', 
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  },
  
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    credentials: process.env.GOOGLE_CLOUD_CREDENTIALS || '',
  },
  
  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY || '',
  },
  
  agmarknet: {
    apiKey: process.env.AGMARKNET_API_KEY || '',
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    modelId: 'gemini-2.5-flash',
  },
  
  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  },
  
  blobStorage: {
    token: process.env.BLOB_READ_WRITE_TOKEN || '',
  },
  
  demo: {
    enabled: process.env.DEMO_MODE === 'true',
    accounts: [
      '+919876543210', // Hindi - Maharashtra
      '+919876543211', // Tamil - Tamil Nadu
      '+919876543212', // Malayalam - Kerala
      '+919876543213', // Telugu - Telangana
      '+919876543214', // Kannada - Karnataka
    ],
    otp: '123456', // Fixed OTP for demo accounts
  },
};

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
  const missingKeys = [];
  if (!config.jwt.secret) missingKeys.push('JWT_SECRET');
  if (!config.jwt.refreshSecret) missingKeys.push('JWT_REFRESH_SECRET');
  
  if (missingKeys.length > 0) {
    console.error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }
}
