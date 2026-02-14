import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

async function testGeminiHTTP() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }

    // First, list available models
    console.log('\n1. Listing available models...');
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    
    const listResponse = await axios.get(listUrl);
    console.log('Available models:');
    listResponse.data.models?.forEach((model: any) => {
      console.log(`  - ${model.name} (${model.displayName})`);
      console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
    });

    // Get the first available model that supports generateContent
    const availableModel = listResponse.data.models?.find((m: any) => 
      m.supportedGenerationMethods?.includes('generateContent')
    );

    if (!availableModel) {
      throw new Error('No model found that supports generateContent');
    }

    console.log(`\n2. Using model: ${availableModel.name}`);

    // Try with the available model
    const url = `https://generativelanguage.googleapis.com/v1/${availableModel.name}:generateContent?key=${apiKey}`;
    
    console.log('Calling URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: 'Say hello!'
        }]
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n3. Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:');
      console.error('  Status:', error.response?.status);
      console.error('  Status Text:', error.response?.statusText);
      console.error('  Data:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error('Error:', error);
    }
  }
}

testGeminiHTTP();
