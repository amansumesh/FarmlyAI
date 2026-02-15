const axios = require('axios');

async function testOTPFlow() {
  const baseURL = 'http://localhost:4001/api';
  const phoneNumber = '+919876543210';

  try {
    console.log('Step 1: Sending OTP...');
    const sendRes = await axios.post(`${baseURL}/auth/send-otp`, {
      phoneNumber
    });
    
    const otp = sendRes.data.otp;
    console.log('✅ OTP sent. Response:', JSON.stringify(sendRes.data, null, 2));
    console.log(`\nOTP to use: ${otp}\n`);

    // Give the system a moment
    await new Promise(r => setTimeout(r, 500));

    console.log('Step 2: Verifying OTP...');
    const verifyRes = await axios.post(`${baseURL}/auth/verify-otp`, {
      phoneNumber,
      otp
    });

    console.log('✅ OTP verified! Response:');
    console.log(JSON.stringify(verifyRes.data, null, 2));
    
    const token = verifyRes.data.data.accessToken;
    console.log(`\n✅ Got token: ${token.substring(0, 30)}...\n`);

    console.log('Step 3: Testing market API with token...');
    const marketRes = await axios.get(`${baseURL}/market/prices?crop=wheat&limit=2`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Market API response:');
    console.log(JSON.stringify(marketRes.data.data, null, 2).substring(0, 500));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOTPFlow();
