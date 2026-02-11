const axios = require('axios');

async function testMarketAPI() {
  try {
    // Step 1: Register/Login demo account
    const loginRes = await axios.post('http://localhost:4000/api/auth/register-otp', {
      phoneNumber: '+919876543210'
    });
    console.log('OTP sent');

    // Step 2: Verify OTP (demo mode uses 123456)
    const verifyRes = await axios.post('http://localhost:4000/api/auth/verify-otp', {
      phoneNumber: '+919876543210',
      otp: '123456'
    });
    
    const token = verifyRes.data.data.accessToken;
    console.log('Token obtained:', token.substring(0, 20) + '...');

    // Step 3: Test market prices with Gemini
    const marketRes = await axios.get('http://localhost:4000/api/market/prices?crop=wheat&language=en&limit=3', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n✅ Market Data received from Gemini:');
    console.log(JSON.stringify(marketRes.data.data, null, 2).substring(0, 800));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMarketAPI();
