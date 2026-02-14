import dotenv from 'dotenv';
dotenv.config();

import { MarketService } from '../services/market.service.js';

async function quickTest() {
  try {
    console.log('Testing market service...');
    console.log('Gemini API Key configured:', !!process.env.GEMINI_API_KEY);
    
    const result = await Promise.race([
      MarketService.getMarketPrices('tomato', 18.5204, 73.8567, 'en', 5),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 30 seconds')), 30000)
      )
    ]);
    
    console.log('✅ Success!');
    console.log('Markets:', (result as any).markets?.length);
    console.log('Average price:', (result as any).priceAnalysis?.average);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

quickTest();
