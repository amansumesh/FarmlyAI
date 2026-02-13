import { logger } from '../utils/logger.js';

export type Intent =
  | 'price_query'
  | 'disease_query'
  | 'scheme_query'
  | 'weather_query'
  | 'advisory_query'
  | 'general';

interface IntentResult {
  intent: Intent;
  confidence: number;
  entities?: Record<string, string>;
}

const intentPatterns: Record<Intent, RegExp[]> = {
  price_query: [
    /कीमत|दाम|भाव|मूल्य|price|rate|cost/i,
    /मंडी|बाजार|market|mandi/i,
    /बेचना|बिक्री|sell|selling/i
  ],
  disease_query: [
    /बीमारी|रोग|disease|infection/i,
    /कीड़े|कीट|pest|insect/i,
    /पत्ते|पत्ता|leaf|leaves/i,
    /सड़ना|सूखना|rot|wilt/i,
    /दवा|उपचार|treatment|medicine|spray/i
  ],
  scheme_query: [
    /योजना|स्कीम|scheme/i,
    /सरकार|government/i,
    /सहायता|मदद|help|support|subsidy/i,
    /लाभ|फायदा|benefit/i
  ],
  weather_query: [
    /मौसम|weather/i,
    /बारिश|वर्षा|rain/i,
    /तापमान|temperature/i,
    /forecast|पूर्वानुमान/i
  ],
  advisory_query: [
    /सिंचाई|irrigation|पानी|water/i,
    /खाद|उर्वरक|fertilizer|manure/i,
    /बोना|बुवाई|sowing|planting/i,
    /कटाई|harvest/i,
    /सलाह|advice|suggestion/i
  ],
  general: []
};

const cropKeywords = [
  'टमाटर',
  'tomato',
  'धान',
  'rice',
  'गेहूं',
  'wheat',
  'कपास',
  'cotton',
  'मक्का',
  'maize',
  'सोयाबीन',
  'soybean',
  'आलू',
  'potato',
  'प्याज',
  'onion',
  'मिर्च',
  'chili',
  'गन्ना',
  'sugarcane'
];

export function recognizeIntent(text: string): IntentResult {
  const normalizedText = text.toLowerCase().trim();

  logger.info(`Recognizing intent for: ${normalizedText.substring(0, 50)}...`);

  let maxMatches = 0;
  let detectedIntent: Intent = 'general';

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (intent === 'general') continue;

    const matches = patterns.filter((pattern) => pattern.test(normalizedText)).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIntent = intent as Intent;
    }
  }

  const confidence = maxMatches > 0 ? Math.min(0.6 + maxMatches * 0.2, 0.95) : 0.3;

  const entities: Record<string, string> = {};
  for (const crop of cropKeywords) {
    if (normalizedText.includes(crop.toLowerCase())) {
      entities.crop = crop;
      break;
    }
  }

  logger.info(`Intent detected: ${detectedIntent} (confidence: ${confidence})`);

  return {
    intent: detectedIntent,
    confidence,
    entities: Object.keys(entities).length > 0 ? entities : undefined
  };
}

export function generateResponse(intent: Intent, language: string, entities?: Record<string, string>): string {
  const crop = entities?.crop || '';

  const responses: Record<Intent, Record<string, string>> = {
    price_query: {
      hi: crop
        ? `${crop} की कीमत जानने के लिए कृपया मार्केट प्राइस पेज पर जाएं। वहां आप अपने नजदीकी मंडियों की ताजा कीमतें देख सकते हैं।`
        : 'फसल की कीमत जानने के लिए कृपया मार्केट प्राइस पेज पर जाएं। वहां आप अपनी फसल चुनकर नजदीकी मंडियों की कीमतें देख सकते हैं।',
      ta: crop
        ? `${crop} விலையை அறிய மார்க்கெட் பிரைஸ் பக்கத்திற்கு செல்லவும். அங்கு உங்கள் அருகிலுள்ள சந்தைகளின் சமீபத்திய விலைகளைக் காணலாம்.`
        : 'பயிர் விலையை அறிய மார்க்கெட் பிரைஸ் பக்கத்திற்கு செல்லவும். அங்கு உங்கள் பயிரைத் தேர்ந்தெடுத்து அருகிலுள்ள சந்தை விலைகளைக் காணலாம்.',
      ml: crop
        ? `${crop} വില അറിയാൻ മാർക്കറ്റ് പ്രൈസ് പേജിലേക്ക് പോകുക. അവിടെ നിങ്ങളുടെ അടുത്തുള്ള മാർക്കറ്റുകളുടെ ഏറ്റവും പുതിയ വിലകൾ കാണാം.`
        : 'വിള വില അറിയാൻ മാർക്കറ്റ് പ്രൈസ് പേജിലേക്ക് പോകുക. അവിടെ നിങ്ങളുടെ വിള തിരഞ്ഞെടുത്ത് അടുത്തുള്ള മാർക്കറ്റ് വിലകൾ കാണാം.',
      te: crop
        ? `${crop} ధరను తెలుసుకోవడానికి మార్కెట్ ప్రైస్ పేజీకి వెళ్లండి. అక్కడ మీ సమీపంలోని మార్కెట్ల తాజా ధరలను చూడవచ్చు.`
        : 'పంట ధరను తెలుసుకోవడానికి మార్కెట్ ప్రైస్ పేజీకి వెళ్లండి. అక్కడ మీ పంటను ఎంచుకుని సమీపంలోని మార్కెట్ ధరలను చూడవచ్చు.',
      kn: crop
        ? `${crop} ಬೆಲೆ ತಿಳಿಯಲು ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಪುಟಕ್ಕೆ ಹೋಗಿ. ಅಲ್ಲಿ ನಿಮ್ಮ ಹತ್ತಿರದ ಮಾರುಕಟ್ಟೆಗಳ ಇತ್ತೀಚಿನ ಬೆಲೆಗಳನ್ನು ನೋಡಬಹುದು.`
        : 'ಬೆಳೆ ಬೆಲೆ ತಿಳಿಯಲು ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಪುಟಕ್ಕೆ ಹೋಗಿ. ಅಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ಹತ್ತಿರದ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳನ್ನು ನೋಡಬಹುದು.',
      en: crop
        ? `To check ${crop} prices, please visit the Market Price page. There you can see the latest prices from nearby mandis.`
        : 'To check crop prices, please visit the Market Price page. There you can select your crop and see prices from nearby mandis.'
    },
    disease_query: {
      hi: crop
        ? `${crop} की बीमारी की पहचान करने के लिए कृपया कैमरा से प्रभावित पत्ते की फोटो खींचें। हमारी AI तुरंत बीमारी की पहचान करके उपचार बताएगी।`
        : 'बीमारी की पहचान करने के लिए कृपया कैमरा से प्रभावित पत्ते की फोटो खींचें। हमारी AI तुरंत बीमारी की पहचान करके उपचार बताएगी।',
      ta: crop
        ? `${crop} நோயை கண்டறிய தயவுசெய்து கேமராவால் பாதிக்கப்பட்ட இலையின் புகைப்படத்தை எடுக்கவும். எங்கள் AI உடனடியாக நோயை கண்டறிந்து சிகிச்சை தரும்.`
        : 'நோயை கண்டறிய தயவுசெய்து கேமராவால் பாதிக்கப்பட்ட இலையின் புகைப்படத்தை எடுக்கவும். எங்கள் AI உடனடியாக நோயை கண்டறிந்து சிகிச்சை தரும்.',
      ml: crop
        ? `${crop} രോഗം കണ്ടെത്താൻ ദയവായി ക്യാമറ ഉപയോഗിച്ച് ബാധിച്ച ഇലയുടെ ഫോട്ടോ എടുക്കുക. ഞങ്ങളുടെ AI ഉടൻ രോഗം കണ്ടെത്തി ചികിത്സ നൽകും.`
        : 'രോഗം കണ്ടെത്താൻ ദയവായി ക്യാമറ ഉപയോഗിച്ച് ബാധിച്ച ഇലയുടെ ഫോട്ടോ എടുക്കുക. ഞങ്ങളുടെ AI ഉടൻ രോഗം കണ്ടെത്തി ചികിത്സ നൽകും.',
      te: crop
        ? `${crop} వ్యాధిని గుర్తించడానికి దయచేసి కెమెరాతో ప్రభావిత ఆకు యొక్క ఫోటో తీయండి. మా AI వెంటనే వ్యాధిని గుర్తించి చికిత్స చెబుతుంది.`
        : 'వ్యాధిని గుర్తించడానికి దయచేసి కెమెరాతో ప్రభావిత ఆకు యొక్క ఫోటో తీయండి. మా AI వెంటనే వ్యాధిని గుర్తించి చికిత్స చెబుతుంది.',
      kn: crop
        ? `${crop} ರೋಗವನ್ನು ಗುರುತಿಸಲು ದಯವಿಟ್ಟು ಕ್ಯಾಮೆರಾದಿಂದ ಪೀಡಿತ ಎಲೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ. ನಮ್ಮ AI ತಕ್ಷಣ ರೋಗವನ್ನು ಗುರುತಿಸಿ ಚಿಕಿತ್ಸೆ ತಿಳಿಸುತ್ತದೆ.`
        : 'ರೋಗವನ್ನು ಗುರುತಿಸಲು ದಯವಿಟ್ಟು ಕ್ಯಾಮೆರಾದಿಂದ ಪೀಡಿತ ಎಲೆಯ ಫೋಟೋ ತೆಗೆಯಿರಿ. ನಮ್ಮ AI ತಕ್ಷಣ ರೋಗವನ್ನು ಗುರುತಿಸಿ ಚಿಕಿತ್ಸೆ ತಿಳಿಸುತ್ತದೆ.',
      en: crop
        ? `To identify ${crop} disease, please take a photo of the affected leaf using the camera. Our AI will instantly identify the disease and suggest treatment.`
        : 'To identify the disease, please take a photo of the affected leaf using the camera. Our AI will instantly identify the disease and suggest treatment.'
    },
    scheme_query: {
      hi: 'सरकारी योजनाओं की जानकारी के लिए कृपया योजना पेज पर जाएं। वहां आपको आपके लिए उपयुक्त सभी योजनाएं मिलेंगी।',
      ta: 'அரசாங்க திட்டங்கள் பற்றிய தகவலுக்கு தயவுசெய்து திட்டங்கள் பக்கத்திற்கு செல்லவும். அங்கே உங்களுக்கு ஏற்ற அனைத்து திட்டங்களும் கிடைக்கும்.',
      ml: 'സർക്കാർ പദ്ധതികളെക്കുറിച്ചുള്ള വിവരങ്ങൾക്ക് ദയവായി സ്കീമുകൾ പേജിലേക്ക് പോകുക. അവിടെ നിങ്ങൾക്ക് അനുയോജ്യമായ എല്ലാ പദ്ധതികളും ലഭിക്കും.',
      te: 'ప్రభుత్వ పథకాల సమాచారం కోసం దయచేసి పథకాల పేజీకి వెళ్లండి. అక్కడ మీకు అనుకూలమైన అన్ని పథకాలు లభిస్తాయి.',
      kn: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಮಾಹಿತಿಗಾಗಿ ದಯವಿಟ್ಟು ಯೋಜನೆಗಳ ಪುಟಕ್ಕೆ ಹೋಗಿ. ಅಲ್ಲಿ ನಿಮಗೆ ಸೂಕ್ತವಾದ ಎಲ್ಲಾ ಯೋಜನೆಗಳು ಸಿಗುತ್ತವೆ.',
      en: 'For information about government schemes, please visit the Schemes page. There you will find all schemes suitable for you.'
    },
    weather_query: {
      hi: 'मौसम की जानकारी के लिए कृपया होम पेज पर जाएं। वहां आपको अगले 7 दिनों का मौसम पूर्वानुमान मिलेगा।',
      ta: 'வானிலை தகவலுக்கு தயவுசெய்து முகப்பு பக்கத்திற்கு செல்லவும். அங்கு அடுத்த 7 நாட்களின் வானிலை முன்னறிவிப்பு கிடைக்கும்.',
      ml: 'കാലാവസ്ഥ വിവരങ്ങൾക്ക് ദയവായി ഹോം പേജിലേക്ക് പോകുക. അവിടെ അടുത്ത 7 ദിവസത്തെ കാലാവസ്ഥ പ്രവചനം ലഭിക്കും.',
      te: 'వాతావరణ సమాచారం కోసం దయచేసి హోమ్ పేజీకి వెళ్లండి. అక్కడ రాబోయే 7 రోజుల వాతావరణ సూచన లభిస్తుంది.',
      kn: 'ಹವಾಮಾನ ಮಾಹಿತಿಗಾಗಿ ದಯವಿಟ್ಟು ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ. ಅಲ್ಲಿ ಮುಂದಿನ 7 ದಿನಗಳ ಹವಾಮಾನ ಮುನ್ನೋಟ ಸಿಗುತ್ತದೆ.',
      en: 'For weather information, please visit the Home page. There you will find a 7-day weather forecast.'
    },
    advisory_query: {
      hi: 'खेती की सलाह के लिए कृपया एडवाइजरी पेज पर जाएं। वहां आपको आपकी फसल के अनुसार सलाह मिलेगी।',
      ta: 'விவசாய ஆலோசனைக்கு தயவுசெய்து அட்வைசரி பக்கத்திற்கு செல்லவும். அங்கு உங்கள் பயிருக்கு ஏற்ற ஆலோசனை கிடைக்கும்.',
      ml: 'കൃഷി ഉപദേശത്തിനായി ദയവായി ഉപദേശ പേജിലേക്ക് പോകുക. അവിടെ നിങ്ങളുടെ വിളയ്ക്ക് അനുസൃതമായ ഉപദേശം ലഭിക്കും.',
      te: 'వ్యవసాయ సలహా కోసం దయచేసి అడ్వైజరీ పేజీకి వెళ్లండి. అక్కడ మీ పంటకు అనుగుణంగా సలహా లభిస్తుంది.',
      kn: 'ಕೃಷಿ ಸಲಹೆಗಾಗಿ ದಯವಿಟ್ಟು ಅಡ್ವೈಸರಿ ಪುಟಕ್ಕೆ ಹೋಗಿ. ಅಲ್ಲಿ ನಿಮ್ಮ ಬೆಳೆಗೆ ತಕ್ಕ ಸಲಹೆ ಸಿಗುತ್ತದೆ.',
      en: 'For farming advice, please visit the Advisory page. There you will get advice according to your crop.'
    },
    general: {
      hi: 'नमस्ते! मैं फार्मली AI हूं। मैं आपकी खेती में मदद कर सकता हूं। आप मुझसे फसल की बीमारी, कीमत, मौसम, सरकारी योजनाओं के बारे में पूछ सकते हैं।',
      ta: 'வணக்கம்! நான் ஃபார்ம்லி AI. உங்கள் விவசாயத்தில் உதவ முடியும். பயிர் நோய், விலை, வானிலை, அரசாங்க திட்டங்கள் பற்றி என்னிடம் கேட்கலாம்.',
      ml: 'നമസ്കാരം! ഞാൻ ഫാർംലി AI ആണ്. നിങ്ങളുടെ കൃഷിയിൽ സഹായിക്കാം. വിള രോഗം, വില, കാലാവസ്ഥ, സർക്കാർ പദ്ധതികൾ എന്നിവയെക്കുറിച്ച് എന്നോട് ചോദിക്കാം.',
      te: 'నమస్కారం! నేను ఫార్మ్లీ AI. మీ వ్యవసాయంలో సహాయం చేయగలను. పంట వ్యాధి, ధర, వాతావరణం, ప్రభుత్వ పథకాల గురించి నన్ను అడగవచ్చు.',
      kn: 'ನಮಸ್ಕಾರ! ನಾನು ಫಾರ್ಮ್ಲಿ AI. ನಿಮ್ಮ ಕೃಷಿಯಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಬೆಳೆ ರೋಗ, ಬೆಲೆ, ಹವಾಮಾನ, ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಬಹುದು.',
      en: 'Hello! I am Farmly AI. I can help you with your farming. You can ask me about crop diseases, prices, weather, and government schemes.'
    }
  };

  const languageResponses = responses[intent];
  return languageResponses[language] || languageResponses.en || languageResponses.hi;
}
