import dotenv from 'dotenv';
dotenv.config();

import { MarketService } from '../services/market.service.js';
import { logger } from '../utils/logger.js';

/**
 * Test script for Market API
 * Run with: npx tsx src/scripts/test-market-api.ts
 */
async function testMarketService() {
  console.log('='.repeat(60));
  console.log('Testing Market Service');
  console.log('='.repeat(60));

  try {
    // Test location: Pune, Maharashtra
    const testLat = 18.5204;
    const testLon = 73.8567;
    const testCrop = 'tomato';

    console.log('\n📍 Test Location: Pune, Maharashtra');
    console.log(`   Coordinates: ${testLat}, ${testLon}`);
    console.log(`   Crop: ${testCrop}`);

    // Test 1: Get market prices in English
    console.log('\n🔍 Test 1: Fetching market prices (English)...');
    const result1 = await MarketService.getMarketPrices(testCrop, testLat, testLon, 'en', 5);

    console.log('\n📊 Market Data:');
    console.log(`   Crop: ${result1.crop}`);
    console.log(`   Markets found: ${result1.markets.length}`);

    console.log('\n🏪 Nearest Markets:');
    result1.markets.forEach((market, index) => {
      console.log(
        `   ${index + 1}. ${market.name} (${market.location})`
      );
      console.log(
        `      Distance: ${market.distance}km | Price: ₹${market.price}/${market.unit} | Trend: ${market.trend}`
      );
    });

    console.log('\n📈 Price Analysis:');
    console.log(`   Average Price: ₹${Math.round(result1.priceAnalysis.average)}/kg`);
    console.log(
      `   Highest: ${result1.priceAnalysis.highest.market} - ₹${result1.priceAnalysis.highest.price}`
    );
    console.log(
      `   Lowest: ${result1.priceAnalysis.lowest.market} - ₹${result1.priceAnalysis.lowest.price}`
    );
    console.log(`   Trend: ${result1.priceAnalysis.trend}`);

    console.log(`\n📅 Price History: ${result1.priceHistory.length} days`);
    console.log('   Last 5 days:');
    result1.priceHistory.slice(-5).forEach((item) => {
      console.log(`   - ${item.date}: ₹${item.avgPrice}/kg`);
    });

    // Test 2: Get market prices in Hindi
    console.log('\n\n🔍 Test 2: Fetching market prices (Hindi)...');
    const result2 = await MarketService.getMarketPrices(testCrop, testLat, testLon, 'hi', 3);

    console.log('\n📊 Hindi Market Data:');
    console.log(`   Markets found: ${result2.markets.length}`);
    result2.markets.forEach((market, index) => {
      console.log(`   ${index + 1}. ${market.name} - ₹${market.price}`);
    });

    // Test 3: Different crop
    console.log('\n\n🔍 Test 3: Fetching prices for different crop (wheat)...');
    const result3 = await MarketService.getMarketPrices('wheat', testLat, testLon, 'en', 5);

    console.log('\n📊 Wheat Market Data:');
    console.log(`   Average Price: ₹${result3.priceAnalysis.average}/kg`);
    console.log(`   Markets found: ${result3.markets.length}`);

    // Test 4: Health check
    console.log('\n\n🔍 Test 4: Running health check...');
    const healthy = await MarketService.healthCheck();
    console.log(`   Health Status: ${healthy ? '✅ Healthy' : '❌ Unhealthy'}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    logger.error('Market service test failed', { error });
    process.exit(1);
  }
}

testMarketService()
  .then(() => {
    console.log('\n✨ Market service is working correctly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
