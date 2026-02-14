import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: string;
}

async function testVoiceQueryEndpoint(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('🎤 Testing Voice Query API...\n');

  try {
    const formData = new FormData();
    
    const sampleAudioPath = path.join(__dirname, '../test-data/sample-audio.wav');
    if (fs.existsSync(sampleAudioPath)) {
      formData.append('audio', fs.createReadStream(sampleAudioPath));
    } else {
      const audioBuffer = Buffer.from('RIFF', 'utf-8');
      formData.append('audio', audioBuffer, {
        filename: 'test.wav',
        contentType: 'audio/wav'
      });
    }
    
    formData.append('language', 'hi');

    await axios.post(
      `${API_BASE_URL}/api/query/voice`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: 'Bearer test-token',
        },
      }
    );

    results.push({
      test: 'Voice Query Endpoint',
      passed: false,
      message: 'Endpoint exists but requires valid authentication (expected)',
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      results.push({
        test: 'Voice Query Endpoint - Authentication Required',
        passed: true,
        message: 'Correctly rejects unauthorized requests',
      });
    } else {
      results.push({
        test: 'Voice Query Endpoint',
        passed: false,
        message: 'Unexpected error',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/query/history`, {
      headers: {
        Authorization: 'Bearer test-token',
      },
    });

    results.push({
      test: 'Query History Endpoint',
      passed: false,
      message: 'Endpoint exists but requires valid authentication (expected)',
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      results.push({
        test: 'Query History Endpoint - Authentication Required',
        passed: true,
        message: 'Correctly rejects unauthorized requests',
      });
    } else {
      results.push({
        test: 'Query History Endpoint',
        passed: false,
        message: 'Unexpected error',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  try {
    await axios.patch(
      `${API_BASE_URL}/api/query/test-query-id/save`,
      {},
      {
        headers: {
          Authorization: 'Bearer test-token',
        },
      }
    );

    results.push({
      test: 'Toggle Save Query Endpoint',
      passed: false,
      message: 'Endpoint exists but requires valid authentication (expected)',
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      results.push({
        test: 'Toggle Save Query Endpoint - Authentication Required',
        passed: true,
        message: 'Correctly rejects unauthorized requests',
      });
    } else {
      results.push({
        test: 'Toggle Save Query Endpoint',
        passed: false,
        message: 'Unexpected error',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

async function testServerHealth(): Promise<TestResult> {
  console.log('🏥 Testing server health...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'ok') {
      return {
        test: 'Server Health Check',
        passed: true,
        message: 'Server is running and healthy',
        details: JSON.stringify(response.data, null, 2),
      };
    } else {
      return {
        test: 'Server Health Check',
        passed: false,
        message: 'Server responded but status is not OK',
        details: JSON.stringify(response.data, null, 2),
      };
    }
  } catch (error) {
    return {
      test: 'Server Health Check',
      passed: false,
      message: 'Server is not responding',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   Voice Query API Test Suite');
  console.log('═══════════════════════════════════════\n');
  console.log(`Testing API at: ${API_BASE_URL}\n`);

  const healthResult = await testServerHealth();
  console.log(`${healthResult.passed ? '✅' : '❌'} ${healthResult.test}`);
  console.log(`   ${healthResult.message}`);
  if (healthResult.details) {
    console.log(`   ${healthResult.details}\n`);
  }

  if (!healthResult.passed) {
    console.log('\n❌ Server is not running. Please start the server first.');
    process.exit(1);
  }

  const voiceResults = await testVoiceQueryEndpoint();

  console.log('\n═══════════════════════════════════════');
  console.log('   Test Results');
  console.log('═══════════════════════════════════════\n');

  voiceResults.forEach((result) => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    console.log();
  });

  const totalTests = voiceResults.length;
  const passedTests = voiceResults.filter((r) => r.passed).length;

  console.log('═══════════════════════════════════════');
  console.log(`   Summary: ${passedTests}/${totalTests} tests passed`);
  console.log('═══════════════════════════════════════\n');

  if (passedTests === totalTests) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed.');
    process.exit(1);
  }
}

main();
