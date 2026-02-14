
import axios from 'axios';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'gsk_dummy' }); // Ensure it doesn't crash if env missing, but will fail gracefully in func

// Define the structure based on what scheme.service.ts expects
interface ScrapedSchemeData {
    schemeId: string;
    name: {
        en: string;
        hi?: string;
        ml?: string;
        ta?: string;
        kn?: string;
        te?: string;
        [key: string]: string | undefined;
    } | string;
    description: {
        en: string;
        hi?: string;
        ml?: string;
        ta?: string;
        kn?: string;
        te?: string;
        [key: string]: string | undefined;
    } | string;
    benefits: {
        en: string[];
        hi?: string[];
        ml?: string[];
        ta?: string[];
        kn?: string[];
        te?: string[];
        [key: string]: string[] | undefined;
    } | string;
    eligibility: {
        landSize: { min: number; max?: number };
        crops: string[];
        states: string[];
        [key: string]: any;
    } | string[];
    applicationProcess?: {
        steps: {
            en: string[];
            hi?: string[];
            ml?: string[];
            ta?: string[];
            kn?: string[];
            te?: string[];
            [key: string]: string[] | undefined;
        };
        documents: {
            en: string[];
            hi?: string[];
            ml?: string[];
            ta?: string[];
            kn?: string[];
            te?: string[];
            [key: string]: string[] | undefined;
        };
        [key: string]: any;
    } | any;
    howToApply?: any; // legacy support
    documentsRequired?: any; // legacy support
    officialUrl: string;
    sourceCitations: string[];
    type: string;
    status: "active" | "closed" | "paused";
}

// Helper function to scrape using Groq
async function scrapeWithGroq(url: string, schemeId: string): Promise<ScrapedSchemeData | null> {
    if (!process.env.GROQ_API_KEY) {
        logger.warn(`GROQ_API_KEY missing. Skipping scraping for ${schemeId}.`);
        return null; // Fallback to hardcoded
    }

    try {
        logger.info(`Scraping ${url} for ${schemeId}...`);

        // 1) Fetch website HTML
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            },
            timeout: 30000
        });

        // 2) Parse HTML with cheerio
        const $ = cheerio.load(response.data);
        // Extract plain text - remove scripts, styles to reduce token count
        $('script').remove();
        $('style').remove();
        const text = $("body").text().replace(/\s+/g, " ").trim();
        const slicedText = text.slice(0, 15000); // Increased limit as 120b can handle it

        // 3) Send extracted text to Groq
        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            // model: "llama-3.1-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an expert government scheme analyzer. Extract scheme details from the provided text into valid JSON format matching this structure exactly. 
                    Ensure to provide English ('en'), Hindi ('hi'), Malayalam ('ml'), Tamil ('ta'), Kannada ('kn'), and Telugu ('te') translations for name, description, benefits, steps, and documents if possible (infer/translate if not in text).
                    
                    JSON Structure:
                    {
                        "schemeId": "${schemeId}",
                        "name": { 
                            "en": "Scheme Name", 
                            "hi": "Scheme Name in Hindi",
                            "ml": "Scheme Name in Malayalam",
                            "ta": "Scheme Name in Tamil",
                            "kn": "Scheme Name in Kannada",
                            "te": "Scheme Name in Telugu"
                        },
                        "description": { 
                            "en": "Description", 
                            "hi": "Description in Hindi",
                            "ml": "Description in Malayalam",
                            "ta": "Description in Tamil",
                            "kn": "Description in Kannada",
                            "te": "Description in Telugu"
                        },
                        "benefits": { 
                            "en": ["benefit 1", "benefit 2"], 
                            "hi": ["benefit 1 in Hindi"],
                            "ml": ["benefit 1 in Malayalam"],
                            "ta": ["benefit 1 in Tamil"],
                            "kn": ["benefit 1 in Kannada"],
                            "te": ["benefit 1 in Telugu"]
                        },
                        "eligibility": {
                            "landSize": { "min": 0, "max": 100 }, 
                            "crops": ["crop1", "crop2"], 
                            "states": [] 
                        },
                        "applicationProcess": {
                             "steps": { 
                                 "en": ["step 1", "step 2"], 
                                 "hi": ["step 1 in Hindi"],
                                 "ml": ["step 1 in Malayalam"],
                                 "ta": ["step 1 in Tamil"],
                                 "kn": ["step 1 in Kannada"],
                                 "te": ["step 1 in Telugu"]
                             },
                             "documents": { 
                                 "en": ["doc 1", "doc 2"], 
                                 "hi": ["doc 1 in Hindi"],
                                 "ml": ["doc 1 in Malayalam"],
                                 "ta": ["doc 1 in Tamil"],
                                 "kn": ["doc 1 in Kannada"],
                                 "te": ["doc 1 in Telugu"]
                             }
                        },
                        "officialUrl": "${url}",
                        "sourceCitations": ["${url}"],
                        "type": "central",
                        "status": "active"
                    }
                    
                    Return ONLY the JSON. No markdown.`
                },
                {
                    role: "user",
                    content: `Extract info for ${schemeId}:\n\n${slicedText}`
                },
            ],
            temperature: 0.1
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("No content from LLM");

        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);
        logger.info(`Successfully scraped ${schemeId}`);
        return data as ScrapedSchemeData;

    } catch (error) {
        logger.error(`Error scraping ${schemeId} with Groq: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

// Wrapper to combine fallback and scraping
async function getSchemeData(schemeId: string, url: string, defaultData: ScrapedSchemeData): Promise<ScrapedSchemeData> {
    const scrapedData = await scrapeWithGroq(url, schemeId);
    if (scrapedData) {
        // Merge with default to ensure critical fields like schemeId exist if LLM messed up
        return { ...defaultData, ...scrapedData, schemeId: defaultData.schemeId };
    }
    return defaultData;
}

// Function to fetch PM-Kisan data
export async function fetchPMKisanData(): Promise<ScrapedSchemeData> {
    const defaultData: ScrapedSchemeData = {
        schemeId: "pm-kisan",
        name: {
            en: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
            hi: "प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)",
            ta: "பிரதமர் கிசான் சம்மன் நிதி",
            ml: "പ്രധാനമന്ത്രി കിസാൻ സമ്മാൻ നിധി",
            te: "ప్రధాన మంత్రి కిసాన్ సమ్మాన్ నిధి",
            kn: "ಪ್ರಧಾನಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ"
        },
        description: {
            en: "A Central Sector Scheme with 100% funding from Government of India. It provides income support to all landholding farmer families.",
            hi: "भारत सरकार से 100% वित्त पोषण के साथ एक केंद्रीय क्षेत्र की योजना। यह सभी भूमिधारक किसान परिवारों को आय सहायता प्रदान करती है।",
            ta: "அனைத்து நிலம் வைத்திருக்கும் விவசாயக் குடும்பங்களுக்கும் ஆண்டுக்கு ₹6,000 நேரடி வருமான உதவி மூன்று சம தவணைகளில்.",
            ml: "എല്ലാ ഭൂവുടമസ്ഥ കർഷക കുടുംബങ്ങൾക്കും വർഷത്തിൽ ₹6,000 നേരിട്ടുള്ള വരുമാന പിന്തുണ മൂന്ന് തുല്യ ഗഡുക്കളിൽ.",
            te: "అన్ని భూస్వామ్య రైతు కుటుంబాలకు సంవత్సరానికి ₹6,000 ప్రత్యక్ష ఆదాయ మద్దతు మూడు సమాన వాయిదాలలో.",
            kn: "ಎಲ್ಲಾ ಭೂಸ್ವಾಮ್ಯ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ವರ್ಷಕ್ಕೆ ₹6,000 ನೇರ ಆದಾಯ ಬೆಂಬಲ ಮೂರು ಸಮಾನ ಕಂತುಗಳಲ್ಲಿ."
        },
        benefits: {
            en: ["Income support of Rs. 6000/- per year in three equal installments"],
            hi: ["तीन समान किस्तों में 6000 रुपये प्रति वर्ष की आय सहायता"],
            ta: ["ஆண்டுக்கு ₹6,000", "நேரடி வங்கி பரிமாற்றம்", "தலா ₹2,000 மூன்று தவணைகள்"],
            ml: ["വർഷത്തിൽ ₹6,000", "നേരിട്ട് ബാങ്ക് കൈമാറ്റം", "മൂന്ന് ഗഡുക്കൾ ₹2,000 വീതം"],
            te: ["సంవత్సరానికి ₹6,000", "నేరుగా బ్యాంకు బదిలీ", "మూడు వాయిదాలు ₹2,000 చొప్పున"],
            kn: ["ವರ್ಷಕ್ಕೆ ₹6,000", "ನೇರ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ", "ಮೂರು ಕಂತುಗಳು ₹2,000 ಪ್ರತಿಯೊಂದು"]
        },
        eligibility: {
            landSize: { min: 0, max: 200 },
            crops: [],
            states: []
        },
        applicationProcess: {
            steps: {
                en: ["Register on PM-KISAN portal", "Visit nearest CSC", "Check status online"],
                hi: ["पीएम-किसान पोर्टल पर पंजीकरण करें", "निकटतम सीएससी पर जाएं", "ऑनलाइन स्थिति की जांच करें"]
            },
            documents: {
                en: ["Aadhaar Card", "Bank Account Details", "Land Holding Documents"],
                hi: ["आधार कार्ड", "बैंक खाता विवरण", "भूमि धारण दस्तावेज"]
            }
        },
        officialUrl: "https://pmkisan.gov.in/",
        sourceCitations: ["https://pmkisan.gov.in/"],
        type: "central",
        status: "active"
    };

    return getSchemeData("pm-kisan", "https://pmkisan.gov.in/", defaultData);
}

// Function to fetch PMFBY Data
export async function fetchPMFBYData(): Promise<ScrapedSchemeData> {
    const defaultData: ScrapedSchemeData = {
        schemeId: "pmfby",
        name: {
            en: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            hi: "प्रधानमंत्री फसल बीमा योजना",
            ta: "பிரதமர் பயிர் காப்பீட்டு திட்டம்",
            ml: "പ്രധാനമന്ത്രി ഫസൽ ബീമാ യോജന",
            te: "ప్రధాన మంత్రి ఫసల్ బీమా యోజన",
            kn: "ಪ್ರಧಾನಮಂತ್ರಿ ಫಸಲ್ ಬೀಮಾ ಯೋಜನೆ"
        },
        description: {
            en: "Crop insurance scheme to provide financial support to farmers suffering crop loss/damage arising out of unforeseen events.",
            hi: "अप्रत्याशित घटनाओं से उत्पन्न फसल हानि/क्षति से पीड़ित किसानों को वित्तीय सहायता प्रदान करने वाली फसल बीमा योजना।",
            ta: "இயற்கை பேரிடர்கள், பூச்சிகள் மற்றும் நோய்களால் பயிர் இழப்பு ஏற்பட்டால் விவசாயிகளுக்கு நிதி உதவி வழங்கும் பயிர் காப்பீட்டு திட்டம்.",
            ml: "പ്രകൃതി ദുരന്തങ്ങൾ, കീടങ്ങൾ, രോഗങ്ങൾ എന്നിവ മൂലം വിള നഷ്ടം സംഭവിക്കുമ്പോൾ കർഷകർക്ക് സാമ്പത്തിക സഹായം നൽകുന്ന വിള ഇൻഷുറൻസ് പദ്ധതി.",
            te: "ప్రకృతి వైపరీత్యాలు, తెగుళ్లు మరియు వ్యాధుల కారణంగా పంట నష్టం జరిగితే రైతులకు ఆర్థిక సహాయం అందించే పంట బీమా పథకం.",
            kn: "ನೈಸರ್ಗಿಕ ವಿಕೋಪಗಳು, ಕೀಟಗಳು ಮತ್ತು ರೋಗಗಳಿಂದಾಗಿ ಬೆಳೆ ನಷ್ಟ ಸಂದರ್ಭದಲ್ಲಿ ರೈತರಿಗೆ ಹಣಕಾಸಿನ ಬೆಂಬಲ ನೀಡುವ ಬೆಳೆ ವಿಮಾ ಯೋಜನೆ."
        },
        benefits: {
            en: ["Financial support in case of crop failure", "Stabilize income of farmers"],
            hi: ["फसल खराब होने की स्थिति में वित्तीय सहायता", "किसानों की आय को स्थिर करना"],
            ta: ["குறைந்த பிரீமியம் (கரீஃப் 2%, ரபி 1.5%)", "விரிவான இடர் பாதுகாப்பு", "விரைவான கோரிக்கை தீர்வு"],
            ml: ["കുറഞ്ഞ പ്രീമിയം (ഖരീഫ് 2%, റാബി 1.5%)", "സമഗ്ര റിസ്ക് കവറേജ്", "വേഗത്തിലുള്ള ക്ലെയിം പരിഹാരം"],
            te: ["తక్కువ ప్రీమియం (ఖరీఫ్ 2%, రబీ 1.5%)", "సమగ్ర రిస్క్ కవరేజీ", "త్వరిత క్లెయిమ్ పరిష్కారం"],
            kn: ["ಕಡಿಮೆ ಪ್ರೀಮಿಯಂ (ಖರೀಫ್ 2%, ರಬಿ 1.5%)", "ಸಮಗ್ರ ಅಪಾಯ ರಕ್ಷಣೆ", "ತ್ವರಿತ ಹಕ್ಕು ಪರಿಹಾರ"]
        },
        eligibility: {
            landSize: { min: 0, max: 50 },
            crops: ["rice", "wheat", "cotton", "sugarcane", "oilseeds", "pulses"],
            states: []
        },
        applicationProcess: {
            steps: {
                en: ["Apply through NCIP Portal", "Visit Bank/CSC", "Pay Premium"],
                hi: ["एनसीआईपी पोर्टल के माध्यम से आवेदन करें", "बैंक/सीएससी पर जाएं", "प्रीमियम का भुगतान करें"]
            },
            documents: {
                en: ["Land Possession Certificate", "Aadhaar Card", "Bank Account Details", "Sowing Certificate"],
                hi: ["भूमि कब्ज़ा प्रमाण पत्र", "आधार कार्ड", "बैंक खाता विवरण", "बुवाई प्रमाण पत्र"]
            }
        },
        officialUrl: "https://pmfby.gov.in/",
        sourceCitations: ["https://pmfby.gov.in/"],
        type: "central",
        status: "active"
    };

    return getSchemeData("pmfby", "https://pmfby.gov.in/", defaultData);
}

// Function to fetch Soil Health Card Data
export async function fetchSoilHealthCardData(): Promise<ScrapedSchemeData> {
    const defaultData: ScrapedSchemeData = {
        schemeId: "soil-health-card",
        name: {
            en: "Soil Health Card Scheme",
            hi: "मृदा स्वास्थ्य कार्ड योजना"
        },
        description: {
            en: "A scheme to issue soil health cards to farmers which will carry crop-wise recommendations of nutrients and fertilizers.",
            hi: "किसानों को मृदा स्वास्थ्य कार्ड जारी करने की योजना जिसमें पोषक तत्वों और उर्वरकों की फसल-वार सिफारिशें होंगी।"
        },
        benefits: {
            en: ["Information on soil nutrient status", "Recommendations on dosage of fertilizers"],
            hi: ["मृदा पोषक तत्व स्थिति पर जानकारी", "उर्वरकों की खुराक पर सिफारिशें"]
        },
        eligibility: {
            landSize: { min: 0, max: 100 },
            crops: [],
            states: []
        },
        applicationProcess: {
            steps: {
                en: ["Collect soil sample", "Submit to Soil Testing Lab", "Download Card from Portal"],
                hi: ["मृदा नमूना एकत्र करें", "मृदा परीक्षण प्रयोगशाला में जमा करें", "पोर्टल से कार्ड डाउनलोड करें"]
            },
            documents: {
                en: ["Soil Sample", "Aadhaar Card", "Mobile Number"],
                hi: ["मृदा नमूना", "आधार कार्ड", "मोबाइल नंबर"]
            }
        },
        officialUrl: "https://soilhealth.dac.gov.in/",
        sourceCitations: ["https://soilhealth.dac.gov.in/"],
        type: "central",
        status: "active"
    };

    return getSchemeData("soil-health-card", "https://soilhealth.dac.gov.in/", defaultData);
}

// Function to fetch PMKSY Data
export async function fetchPMKSYData(): Promise<ScrapedSchemeData> {
    const defaultData: ScrapedSchemeData = {
        schemeId: "pmksy",
        name: {
            en: "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
            hi: "प्रधानमंत्री कृषि सिंचाई योजना"
        },
        description: {
            en: "Scheme to improve physical access of water on farm and expand cultivable area under assured irrigation.",
            hi: "खेत पर पानी की भौतिक पहुंच में सुधार और सुनिश्चित सिंचाई के तहत खेती योग्य क्षेत्र का विस्तार करने की योजना।"
        },
        benefits: {
            en: ["Subsidy on Micro Irrigation Systems (Drip/Sprinkler)", "Har Khet Ko Pani"],
            hi: ["सूक्ष्म सिंचाई प्रणालियों (ड्रिप/स्प्रिंकलर) पर सब्सिडी", "हर खेत को पानी"]
        },
        eligibility: {
            landSize: { min: 0, max: 100 },
            crops: ["cotton", "sugarcane", "vegetables", "fruits"],
            states: []
        },
        applicationProcess: {
            steps: {
                en: ["Register on PMKSY/MIA website", "Submit Application", "Verification by officials"],
                hi: ["PMKSY/MIA वेबसाइट पर पंजीकरण करें", "आवेदन जमा करें", "अधिकारियों द्वारा सत्यापन"]
            },
            documents: {
                en: ["Land Records", "Aadhaar Card", "Bank Details"],
                hi: ["भूमि रिकॉर्ड", "आधार कार्ड", "बैंक विवरण"]
            }
        },
        officialUrl: "https://pmksy.gov.in/",
        sourceCitations: ["https://pmksy.gov.in/"],
        type: "central",
        status: "active"
    };

    return getSchemeData("pmksy", "https://pmksy.gov.in/", defaultData);
}

// Function to fetch PKVY Data
export async function fetchPKVYData(): Promise<ScrapedSchemeData> {
    const defaultData: ScrapedSchemeData = {
        schemeId: "pkvy",
        name: {
            en: "Paramparagat Krishi Vikas Yojana (PKVY)",
            hi: "परम्परागत कृषि विकास योजना"
        },
        description: {
            en: "A component of Soil Health Management (SHM) to promote organic farming.",
            hi: "जैविक खेती को बढ़ावा देने के लिए मृदा स्वास्थ्य प्रबंधन (एसएचएम) का एक घटक।"
        },
        benefits: {
            en: ["Financial assistance of Rs. 50,000 per hectare for 3 years", "Support for organic inputs and marketing"],
            hi: ["3 साल के लिए प्रति हेक्टेयर 50,000 रुपये की वित्तीय सहायता", "जैविक इनपुट और विपणन के लिए सहायता"]
        },
        eligibility: {
            landSize: { min: 0, max: 100 },
            crops: ["organic"],
            states: []
        },
        applicationProcess: {
            steps: {
                en: ["Form a cluster of 20 hectares", "Apply through Regional Council"],
                hi: ["20 हेक्टेयर का एक क्लस्टर बनाएं", "क्षेत्रीय परिषद के माध्यम से आवेदन करें"]
            },
            documents: {
                en: ["Aadhaar Card", "Land Documents", "Bank Account"],
                hi: ["आधार कार्ड", "भूमि दस्तावेज", "बैंक खाता"]
            }
        },
        officialUrl: "https://dms.jaivikkheti.in/",
        sourceCitations: ["https://dms.jaivikkheti.in/"],
        type: "central",
        status: "active"
    };

    return getSchemeData("pkvy", "https://dms.jaivikkheti.in/", defaultData);
}

// Function to fetch eNAM Data
export async function fetchENAMData(): Promise<ScrapedSchemeData> {
    const defaultData: ScrapedSchemeData = {
        schemeId: "enam",
        name: {
            en: "National Agriculture Market (eNAM)",
            hi: "राष्ट्रीय कृषि बाजार (ई-नाम)"
        },
        description: {
            en: "Pan-India electronic trading portal which networks the existing APMC mandis to create a unified national market for agricultural commodities.",
            hi: "पैन-इंडिया इलेक्ट्रॉनिक ट्रेडिंग पोर्टल जो कृषि वस्तुओं के लिए एक एकीकृत राष्ट्रीय बाजार बनाने के लिए मौजूदा एपीएमसी मंडियों को नेटवर्क करता है।"
        },
        benefits: {
            en: ["Better price discovery", "Transparent auction process", "Access to more buyers"],
            hi: ["बेहतर मूल्य खोज", "पारदर्शी नीलामी प्रक्रिया", "अधिक खरीदारों तक पहुंच"]
        },
        eligibility: {
            landSize: { min: 0, max: 1000 },
            crops: [],
            states: []
        },
        applicationProcess: {
            steps: {
                en: ["Register on eNAM portal or Mobile App", "Gate Entry of Lot at Mandi", "Participate in bidding"],
                hi: ["ई-नाम पोर्टल या मोबाइल ऐप पर पंजीकरण करें", "मंडी में लॉट की गेट एंट्री", "बोली में भाग लें"]
            },
            documents: {
                en: ["Aadhaar Card", "Bank Passbook", "Mobile Number"],
                hi: ["आधार कार्ड", "बैंक पासबुक", "मोबाइल नंबर"]
            }
        },
        officialUrl: "https://enam.gov.in/",
        sourceCitations: ["https://enam.gov.in/"],
        type: "central",
        status: "active"
    };

    return getSchemeData("enam", "https://enam.gov.in/", defaultData);
}
