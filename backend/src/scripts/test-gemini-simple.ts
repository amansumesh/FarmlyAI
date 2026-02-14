import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key (first 10 chars):', apiKey?.substring(0, 10));

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('GoogleGenerativeAI instance created');

    // Try listing models first
    console.log('Listing available models...');
    
    // Try with gemini-pro
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('Model instance created with gemini-pro');

    console.log('Sending request to Gemini...');
    const result = await model.generateContent('Hello, how are you?');
    const response = await result.response;
    const text = response.text();

    console.log('Response received:', text);
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

testGemini();
