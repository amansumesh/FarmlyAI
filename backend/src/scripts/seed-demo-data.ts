import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../utils/db.js';
import { User } from '../models/user.model.js';
import { Query } from '../models/query.model.js';
import { DiseaseDetection } from '../models/disease.model.js';
import { logger } from '../utils/logger.js';

const demoUsers = [
  {
    phoneNumber: '+919876543210',
    phoneVerified: true,
    language: 'hi' as const,
    farmProfile: {
      location: {
        type: 'Point' as const,
        coordinates: [73.8567, 18.5204], // Pune, Maharashtra
        address: 'Village Shirur, Pune District',
        state: 'Maharashtra',
        district: 'Pune',
      },
      crops: ['tomato', 'onion', 'chili'],
      landSize: 3,
      soilType: 'red' as const,
    },
    onboardingCompleted: true,
    lastLoginAt: new Date(),
  },
  {
    phoneNumber: '+919876543211',
    phoneVerified: true,
    language: 'ta' as const,
    farmProfile: {
      location: {
        type: 'Point' as const,
        coordinates: [78.6569, 10.7905], // Trichy, Tamil Nadu
        address: 'Lalgudi Taluk, Tiruchirappalli District',
        state: 'Tamil Nadu',
        district: 'Tiruchirappalli',
      },
      crops: ['rice', 'sugarcane', 'banana'],
      landSize: 5,
      soilType: 'black' as const,
    },
    onboardingCompleted: true,
    lastLoginAt: new Date(),
  },
  {
    phoneNumber: '+919876543212',
    phoneVerified: true,
    language: 'ml' as const,
    farmProfile: {
      location: {
        type: 'Point' as const,
        coordinates: [76.2711, 9.9312], // Kochi, Kerala
        address: 'Alappuzha District',
        state: 'Kerala',
        district: 'Alappuzha',
      },
      crops: ['coconut', 'rice', 'banana'],
      landSize: 2,
      soilType: 'laterite' as const,
    },
    onboardingCompleted: true,
    lastLoginAt: new Date(),
  },
  {
    phoneNumber: '+919876543213',
    phoneVerified: true,
    language: 'te' as const,
    farmProfile: {
      location: {
        type: 'Point' as const,
        coordinates: [78.4867, 17.3850], // Hyderabad, Telangana
        address: 'Medak District',
        state: 'Telangana',
        district: 'Medak',
      },
      crops: ['cotton', 'maize', 'soybean'],
      landSize: 7,
      soilType: 'clay' as const,
    },
    onboardingCompleted: true,
    lastLoginAt: new Date(),
  },
  {
    phoneNumber: '+919876543214',
    phoneVerified: true,
    language: 'kn' as const,
    farmProfile: {
      location: {
        type: 'Point' as const,
        coordinates: [77.5946, 12.9716], // Bangalore, Karnataka
        address: 'Chikkaballapur District',
        state: 'Karnataka',
        district: 'Chikkaballapur',
      },
      crops: ['groundnut', 'tomato', 'maize'],
      landSize: 4,
      soilType: 'loamy' as const,
    },
    onboardingCompleted: true,
    lastLoginAt: new Date(),
  },
];

const sampleQueries = {
  hi: [
    {
      type: 'voice' as const,
      input: {
        text: 'टमाटर की कीमत क्या है?',
        language: 'hi',
      },
      response: {
        text: 'आज पुणे मंडी में टमाटर की कीमत ₹25 प्रति किलो है। पिछले सप्ताह की तुलना में 12% की वृद्धि हुई है। अगले 3 दिनों में कीमत और बढ़ने की संभावना है।',
      },
      intent: 'price_query',
      processingTimeMs: 2400,
      saved: true,
    },
    {
      type: 'voice' as const,
      input: {
        text: 'मेरे खेत में पानी कब देना चाहिए?',
        language: 'hi',
      },
      response: {
        text: 'आज शाम को सिंचाई करें। अगले 3 दिनों तक मौसम शुष्क रहने की संभावना है। टमाटर के लिए हर 5-7 दिन में सिंचाई जरूरी है।',
      },
      intent: 'irrigation_advice',
      processingTimeMs: 1800,
      saved: false,
    },
    {
      type: 'voice' as const,
      input: {
        text: 'पीएम किसान योजना के बारे में बताइए',
        language: 'hi',
      },
      response: {
        text: 'पीएम किसान योजना में सभी किसानों को प्रति वर्ष ₹6,000 तीन किस्तों में मिलते हैं। आप इस योजना के लिए पात्र हैं। आवेदन के लिए Schemes सेक्शन देखें।',
      },
      intent: 'scheme_query',
      processingTimeMs: 2200,
      saved: true,
    },
  ],
  ta: [
    {
      type: 'voice' as const,
      input: {
        text: 'அரிசி விலை என்ன?',
        language: 'ta',
      },
      response: {
        text: 'இன்று திருச்சி மண்டியில் அரிசி விலை ₹35 ஒரு கிலோவிற்கு. கடந்த வாரத்துடன் ஒப்பிடும்போது 5% அதிகரித்துள்ளது.',
      },
      intent: 'price_query',
      processingTimeMs: 2300,
      saved: true,
    },
    {
      type: 'voice' as const,
      input: {
        text: 'கரும்பு பயிருக்கு உரம் எப்போது இட வேண்டும்?',
        language: 'ta',
      },
      response: {
        text: 'கரும்பு நடவு செய்த 30-45 நாட்களுக்குப் பிறகு முதல் உரமிடுதல் செய்யவும். யூரியா 100 கிலோ மற்றும் டிஏபி 50 கிலோ ஏக்கருக்கு பரிந்துரைக்கப்படுகிறது.',
      },
      intent: 'fertilizer_advice',
      processingTimeMs: 1950,
      saved: false,
    },
  ],
  ml: [
    {
      type: 'voice' as const,
      input: {
        text: 'തെങ്ങിന് എന്ത് രോഗം വരാം?',
        language: 'ml',
      },
      response: {
        text: 'തെങ്ങിന് പ്രധാനമായി റൂട്ട് വിൽട്ട് രോഗം, ബഡ് റോട്ട്, ഗ്രേ ലീഫ് സ്പോട്ട് എന്നിവ വരാം. ഇലകളിൽ മഞ്ഞനിറം കാണുന്നുണ്ടോ? ഫോട്ടോ എടുത്ത് അപ്‌ലോഡ് ചെയ്യുക.',
      },
      intent: 'disease_query',
      processingTimeMs: 2100,
      saved: true,
    },
  ],
  te: [
    {
      type: 'voice' as const,
      input: {
        text: 'పత్తికి తెగుళ్ళు ఎలా నివారించాలి?',
        language: 'te',
      },
      response: {
        text: 'పత్తి పంటలో బాల్‌వార్మ్ మరియు వైట్‌ఫ్లై ప్రధాన తెగుళ్లు. నీమ్ ఆయిల్ స్ప్రే చేయండి లేదా ఫెరోమోన్ ట్రాప్‌లు వాడండి. రసాయన మందులు చివరి ఎంపికగా ఉపయోగించండి.',
      },
      intent: 'pest_prevention',
      processingTimeMs: 2050,
      saved: true,
    },
    {
      type: 'voice' as const,
      input: {
        text: 'మొక్కజొన్న ధర ఎలా ఉంది?',
        language: 'te',
      },
      response: {
        text: 'ఈరోజు హైదరాబాద్ మార్కెట్‌లో మొక్కజొన్న ధర ₹18 కిలో. మంచి ధర కావడంతో ఇప్పుడు అమ్మడం లాభదాయకం.',
      },
      intent: 'price_query',
      processingTimeMs: 1850,
      saved: false,
    },
  ],
  kn: [
    {
      type: 'voice' as const,
      input: {
        text: 'ಕಡಲೆಕಾಯಿ ಬೆಲೆ ಏನು?',
        language: 'kn',
      },
      response: {
        text: 'ಇಂದು ಬೆಂಗಳೂರು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಕಡಲೆಕಾಯಿ ಬೆಲೆ ₹55 ಪ್ರತಿ ಕಿಲೋ. ಕಳೆದ ವಾರಕ್ಕಿಂತ 8% ಹೆಚ್ಚಿದೆ.',
      },
      intent: 'price_query',
      processingTimeMs: 2150,
      saved: true,
    },
  ],
};

const sampleDiseaseDetections = [
  {
    disease: 'Tomato Late Blight',
    diseaseLocal: {
      hi: 'टमाटर की अंतिम झुलसा',
      ta: 'தக்காளி லேட் ப்ளைட்',
      ml: 'തക്കാളി ലേറ്റ് ബ്ലൈറ്റ്',
      te: 'టమాటో లేట్ బ్లైట్',
      kn: 'ಟೊಮೇಟೊ ಲೇಟ್ ಬ್ಲೈಟ್',
    },
    crop: 'Tomato',
    confidence: 0.96,
    severity: 'high' as const,
    recommendations: {
      organic: [
        'Remove infected leaves immediately',
        'Spray neem oil solution (5ml per liter)',
        'Apply copper-based fungicide',
        'Improve air circulation',
      ],
      chemical: [
        'Mancozeb 75% WP @ 2g/liter water',
        'Chlorothalonil 500g/liter @ 2ml/liter',
        'Spray every 7-10 days',
      ],
      preventive: [
        'Avoid overhead irrigation',
        'Use resistant varieties',
        'Maintain proper plant spacing',
        'Remove plant debris',
      ],
    },
  },
  {
    disease: 'Cotton Leaf Curl Virus',
    diseaseLocal: {
      hi: 'कपास पत्ती मोड़ वायरस',
      ta: 'பருத்தி இலை சுருள் வைரஸ்',
      ml: 'പരുത്തി ഇല ചുരുൾ വൈറസ്',
      te: 'పత్తి ఆకు కర్ల్ వైరస్',
      kn: 'ಹತ್ತಿ ಎಲೆ ಕರ್ಲ್ ವೈರಸ್',
    },
    crop: 'Cotton',
    confidence: 0.93,
    severity: 'critical' as const,
    recommendations: {
      organic: [
        'Remove infected plants',
        'Use yellow sticky traps for whiteflies',
        'Spray neem extract regularly',
      ],
      chemical: [
        'Imidacloprid 17.8% SL @ 0.5ml/liter',
        'Thiamethoxam 25% WG @ 0.2g/liter',
      ],
      preventive: [
        'Use virus-resistant varieties',
        'Control whitefly population',
        'Avoid planting near infected fields',
      ],
    },
  },
  {
    disease: 'Rice Blast',
    diseaseLocal: {
      hi: 'धान का ब्लास्ट रोग',
      ta: 'அரிசி ப்ளாஸ்ட்',
      ml: 'നെൽ ബ്ലാസ്റ്റ്',
      te: 'వరి బ్లాస్ట్',
      kn: 'ಅಕ್ಕಿ ಬ್ಲಾಸ್ಟ್',
    },
    crop: 'Rice',
    confidence: 0.89,
    severity: 'moderate' as const,
    recommendations: {
      organic: [
        'Apply Trichoderma viride',
        'Use silicon-based fertilizers',
        'Spray potassium permanganate solution',
      ],
      chemical: [
        'Tricyclazole 75% WP @ 0.6g/liter',
        'Carbendazim 50% WP @ 1g/liter',
      ],
      preventive: [
        'Use resistant varieties',
        'Balanced nitrogen application',
        'Proper water management',
      ],
    },
  },
];

async function seedDemoData() {
  try {
    await connectDB();
    logger.info('Connected to MongoDB');

    // Clear existing demo data
    logger.info('Clearing existing demo data...');
    const demoPhoneNumbers = demoUsers.map((u) => u.phoneNumber);
    const demoUserDocs = await User.find({ phoneNumber: { $in: demoPhoneNumbers } });
    const demoUserIds = demoUserDocs.map((u) => u._id);
    
    await Query.deleteMany({ userId: { $in: demoUserIds } });
    await DiseaseDetection.deleteMany({ userId: { $in: demoUserIds } });
    await User.deleteMany({ phoneNumber: { $in: demoPhoneNumbers } });
    logger.info('Cleared existing demo data');

    // Create demo users
    logger.info('Creating demo users...');
    const createdUsers = await User.insertMany(demoUsers);
    logger.info(`Created ${createdUsers.length} demo users`);

    // Create queries for each user
    logger.info('Creating demo queries...');
    let totalQueries = 0;
    
    for (const user of createdUsers) {
      const languageQueries = sampleQueries[user.language as keyof typeof sampleQueries];
      if (!languageQueries) continue;

      const queries = languageQueries.map((q) => ({
        ...q,
        userId: user._id,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last 7 days
      }));

      await Query.insertMany(queries);
      totalQueries += queries.length;
    }
    
    logger.info(`Created ${totalQueries} demo queries`);

    // Create disease detections for users with relevant crops
    logger.info('Creating demo disease detections...');
    let totalDetections = 0;

    for (const user of createdUsers) {
      const userCrops = user.farmProfile.crops;
      
      // Find matching disease detections based on user crops
      const matchingDetections = sampleDiseaseDetections.filter((detection) => {
        const cropLower = detection.crop.toLowerCase();
        return userCrops.some((userCrop) => cropLower.includes(userCrop));
      });

      if (matchingDetections.length === 0) {
        // Add at least one generic detection
        matchingDetections.push(sampleDiseaseDetections[0]);
      }

      // Create 1-2 detections per user
      const numDetections = Math.min(matchingDetections.length, Math.floor(Math.random() * 2) + 1);
      
      for (let i = 0; i < numDetections; i++) {
        const detection = matchingDetections[i];
        const diseaseLocal = detection.diseaseLocal[user.language as keyof typeof detection.diseaseLocal] || detection.disease;
        
        const diseaseDetection = {
          userId: user._id,
          imageUrl: `https://farmly-ai-demo-images.blob.vercel-storage.com/sample-${detection.crop.toLowerCase()}-disease-${i + 1}.jpg`,
          imageMetadata: {
            size: Math.floor(Math.random() * 2000000) + 500000, // Random size 0.5-2.5MB
            mimeType: 'image/jpeg',
            capturedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random within last 14 days
          },
          predictions: [
            {
              disease: detection.disease,
              diseaseLocal,
              crop: detection.crop,
              confidence: detection.confidence,
              severity: detection.severity,
            },
          ],
          topPrediction: {
            disease: detection.disease,
            confidence: detection.confidence,
            severity: detection.severity,
          },
          recommendations: detection.recommendations,
          modelVersion: 'mobilenetv3_v1.2',
          inferenceTimeMs: Math.floor(Math.random() * 500) + 300, // Random 300-800ms
          createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        };

        await DiseaseDetection.create(diseaseDetection);
        totalDetections++;
      }
    }

    logger.info(`Created ${totalDetections} demo disease detections`);

    // Print summary
    logger.info('\n========================================');
    logger.info('Demo Data Seeding Complete!');
    logger.info('========================================');
    logger.info(`Total demo users: ${createdUsers.length}`);
    logger.info(`Total demo queries: ${totalQueries}`);
    logger.info(`Total disease detections: ${totalDetections}`);
    logger.info('\nDemo Account Credentials:');
    logger.info('========================================');
    
    for (const user of createdUsers) {
      const state = user.farmProfile.location?.state || 'Unknown';
      const crops = user.farmProfile.crops.join(', ');
      logger.info(`Phone: ${user.phoneNumber} | Language: ${user.language.toUpperCase()} | ${state} | Crops: ${crops}`);
    }
    
    logger.info('\nNote: In demo mode, OTP verification is bypassed for these accounts.');
    logger.info('========================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding demo data:', error);
    process.exit(1);
  }
}

seedDemoData();
