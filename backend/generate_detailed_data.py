import json
import uuid

# ==========================================
# 1. Comprehensive Agriculture Data Generator
# ==========================================

crops_data = [
    {
        "crop": "Rice (Paddy)",
        "diseases": [
            {
                "name": "Blast Disease",
                "symptoms": "Spindle-shaped spots with gray or white centers on leaves, extensive necrosis on panicles, neck rot causing panicles to fall over.",
                "treatment": "Spray Tricyclazole 75 WP @ 0.6g/L or Isoprothiolane 40 EC @ 1.5ml/L. Drain water from field.",
                "prevention": "Use resistant varieties like IR64, MTU1010. Avoid excessive nitrogen fertilizer. Treat seeds with Carbendazim 2g/kg."
            },
            {
                "name": "Bacterial Leaf Blight",
                "symptoms": "Water-soaked streaks on leaf blades starting from tips, turning yellow/white. 'Kresek' phase causes wilting of seedlings.",
                "treatment": "Spray Streptocycline 1g + Copper Oxychloride 30g in 10L water. Drain field water.",
                "prevention": "Use resistant varieties. Avoid high Nitrogen application. Maintain field sanitation."
            },
            {
                "name": "Brown Plant Hopper",
                "symptoms": "Plants turn yellow and dry up ('hopper burn') in circular patches. Brown insects found at plant base.",
                "treatment": "Spray Imidacloprid 17.8 SL @ 0.3ml/L or Thiamethoxam 25 WG @ 0.2g/L. Direct spray to plant base.",
                "prevention": "Maintain 30cm alleyways every 2m. Avoid resurgence causing insecticides like synthetic pyrethroids."
            },
            {
                "name": "Sheath Blight",
                "symptoms": "Oval or elliptical greenish-gray spots on leaf sheath near waterline. Lesions enlarge and coalesce, causing entire leaves to blight.",
                "treatment": "Spray Hexaconazole 5EC @ 2ml/L or Propiconazole 25EC @ 1ml/L. Focus spray on lower parts of plants.",
                "prevention": "Avoid dense planting. Balance Nitrogen with Potash application. Remove weed hosts."
            }
        ],
        "cultivation": {
            "symptoms": "Best practices for Rice cultivation.",
            "treatment": "Seed rate: 20-25 kg/ha for transplanted, 80-100 kg/ha for direct seeded. Nursery area: 1/10th of main field.",
            "prevention": "Transplant 21-25 day old seedlings. Main field preparation: Puddling 3-4 times. Maintenance of 2-5cm water level."
        }
    },
    {
        "crop": "Wheat",
        "diseases": [
            {
                "name": "Rusts (Yellow, Brown, Black)",
                "symptoms": "Yellow/Orange/Black pustules on leaves and stems based on rust type. Reduces photosynthetic area.",
                "treatment": "Spray Propiconazole @ 1ml/L or Tebuconazole @ 1ml/L immediately after symptom appearance.",
                "prevention": "Use resistant varieties (e.g., HD 2967, DBW 187). Avoid very early or very late sowing."
            },
             {
                "name": "Loose Smut",
                "symptoms": "Entire ear head transformed into black powdery mass of spores. Only rachis remains.",
                "treatment": "Solar heat treatment of seeds. Seed treatment with Carboxin or Carbendazim @ 2g/kg seed.",
                "prevention": "Use certified disease-free seeds. Rogue out infected plants and burn them."
            }
        ],
        "cultivation": {
            "symptoms": "Best practices for Wheat cultivation.",
            "treatment": "Sowing time: Nov 1st-15th (Optimal). Seed rate: 100 kg/ha. Spacing: 22.5 cm between rows.",
            "prevention": "Apply Nitrogen in splits (1/2 basal, 1/2 at CRI stage + 1st irrigation). CRI stage (21 days) is critical for irrigation."
        }
    },
    {
        "crop": "Tomato",
        "diseases": [
            {
                "name": "Early Blight",
                "symptoms": "Concentric rings (target board effect) on lower leaves first. Fruits develop dark, sunken leathery spots at stem end.",
                "treatment": "Spray Mancozeb 75 WP @ 2.5g/L or Chlorothalonil @ 2g/L. Repeat every 10-15 days.",
                "prevention": "Crop rotation with non-solanaceous crops. Stake plants to keep foliage off ground."
            },
            {
                "name": "Late Blight",
                "symptoms": "Water-soaked greyish-green spots on leaves mostly at margins. White fungal growth on underside in humid weather.",
                "treatment": "Prophylactic spray of Mancozeb @ 2.5g/L. Curative spray of Metalaxyl + Mancozeb @ 2.5g/L.",
                "prevention": "Use pathogen-free seeds/transplants. Remove volunteer plants. Improve air circulation."
            },
            {
                "name": "Tomato Leaf Curl Virus",
                "symptoms": "Upward curling, crinkling and puckering of leaves. Vein clearing. Stunted plants with few or no fruits.",
                "treatment": "Control whitefly vector: Spray Imidacloprid @ 0.3ml/L or Acetamiprid @ 0.2g/L. Remove infected plants.",
                "prevention": "Use localized resistant varieties (e.g., Arka Rakshak). Raise nursery under 40-mesh nylon net."
            }
        ],
        "cultivation": {
             "symptoms": "Best practices for Tomato cultivation.",
            "treatment": "Seed rate: 400-500g/ha (Open pollinated), 100-150g/ha (Hybirds). Transplanting: 25-30 day seedlings.",
            "prevention": "Staking is essential for hybrids. Pruning and training improve fruit size and quality."
        }
    },
    {
        "crop": "Cotton",
        "diseases": [
            {
                "name": "Pink Bollworm",
                "symptoms": "Larvae bore into bolls, feed on seeds and lint. Rosetted flowers (`rosette flowers`). Exit holes on bolls.",
                "treatment": "Spray Profenofos 50 EC @ 2ml/L or Emamectin Benzoate 5 SG @ 0.5g/L. Install pheromone traps.",
                "prevention": "Timely sowing. Use short duration varieties. Avoid ratoon crop. Destroy crop residues."
            },
             {
                "name": "Leaf Curl Virus",
                "symptoms": "Upward curling, thickening of veins (enations) on underside of leaves. Stunted growth.",
                "treatment": "Control whitefly vector: Spray Diafenthiuron 50 WP @ 1g/L or Flonicamid 50 WG @ 0.3g/L.",
                "prevention": "Grow resistant varieties. Remove weed hosts like Abutilon. Barrier cropping with tall crops."
            }
        ],
        "cultivation": {
            "symptoms": "Best practices for Cotton cultivation.",
            "treatment": "Soil: Deep black (regur) soils are best. pH 6-8. Sowing: May-June (North), Aug-Sept (South).",
            "prevention": "Spacing: 60x30cm to 90x60cm depending on variety. Nipping of terminal bud at 80-90 days increases boll setting."
        }
    },
     {
        "crop": "Sugarcane",
        "diseases": [
            {
                "name": "Red Rot",
                "symptoms": "Third or fourth leaf yellows and dries. Internal stalk tissue turns red with white transverse bands. Alcoholic smell.",
                "treatment": "No effective chemical control in standing crop. Dip setts in Carbendazim 0.1% for 15 mins before planting.",
                "prevention": "Use healthy seed material from disease-free nurseries. Crop rotation for 2-3 years. Grow resistant varieties."
            },
            {
                "name": "Smut",
                "symptoms": "Conversion of terminal bud into a long whip-like black dusty structure. Stems become thin and grass-like.",
                "treatment": "Remove and burn whip-structures (carefully inside bags). Dip setts in Propiconazole 1ml/L for 15 mins.",
                "prevention": "Use resistant varieties. Avoid ratooning of infected crop. Hot water treatment of setts at 50°C for 2 hours."
            }
        ],
        "cultivation": {
             "symptoms": "Best practices for Sugarcane cultivation.",
            "treatment": "Planting methods: Ridge and furrow, Trench method. Seed rate: 3-budded setts (35,000-40,000/ha).",
            "prevention": "Detrashing (removing dried lower leaves) improves aeration. Propping prevents lodging. Earthing up at 4 months."
        }
    },
    {
        "crop": "Potato",
        "diseases": [
            {
                "name": "Late Blight",
                "symptoms": "Water-soaked spots on leaves in cool humid weather, turning black. Tubers rot in storage.",
                "treatment": "Prophylactic: Mancozeb 75 WP @ 2.5g/L. Curative: Cymoxanil + Mancozeb @ 2.5g/L.",
                "prevention": "Use disease-free tubers. Earthing up prevents spores reaching tubers. Haulm cutting 10-15 days before harvest."
            }
        ],
        "cultivation": {
            "symptoms": "Best practices for Potato cultivation.",
            "treatment": "Soil: Sandy loam rich in organic matter. pH 5.2-6.4. Seed rate: 2.5-3 tons/ha (whole tubers).",
            "prevention": "Seed treatment with Boric acid 3% for 20 mins for common scab. Pre-sprouting tubers ensures uniform germination."
        }
    },
     {
        "crop": "Chilli",
        "diseases": [
            {
                "name": "Anthracnose / Fruit Rot",
                "symptoms": "Circular sunken spots on fruits with black concentric rings. Die-back of twigs from tip downwards.",
                "treatment": "Spray Propiconazole @ 1ml/L or Azoxystrobin @ 1ml/L during fruit formation stage.",
                "prevention": "Seed treatment with Thiram 2g/kg. Remove and destroy infected fruits. balanced nutrition."
            },
            {
                "name": "Leaf Curl Virus",
                "symptoms": "Leaves curl upwards/downwards, crinkled, reduced size. Plants stunted (Murda complex).",
                "treatment": "Control vectors (Thrips/Mites/Whitefly). Spray Fipronil @ 1.5ml/L or Spinosad @ 0.3ml/L.",
                "prevention": "Border crop with maize/sorghum. Use virus-tolerant hybrids. Raising seedlings under net."
            }
        ],
        "cultivation": {
            "symptoms": "Best practices for Chilli cultivation.",
            "treatment": "Nursery management is critical to prevent viral infection early on. Transplant 35-40 day seedlings.",
            "prevention": "Avoid water stagnation causing wilt. Regular weeding essential."
        }
    },
    {
        "crop": "Maize",
        "diseases": [
            {
                "name": "Fall Armyworm",
                "symptoms": "Larvae feed on leaves causing large ragging/holes. Feed in whorls destroying growing point. Sawdust-like frass.",
                "treatment": "Spray Emamectin Benzoate 5 SG @ 0.4g/L or Spinetoram 11.7 SC @ 0.5ml/L directed into whorls.",
                "prevention": "Deep summer ploughing. Install pheromone traps. Intercropping with legumes."
            }
        ],
        "cultivation": {
             "symptoms": "Best practices for Maize cultivation.",
            "treatment": "Seed rate: 20 kg/ha. Spacing: 60x20 cm. Critical stages for irrigation: Tasseling and Silking.",
            "prevention": "Pre-emergence herbicide Atrazine @ 1.0-1.5 kg a.i./ha controls weeds effectively."
        }
    }
]

general_farming = [
    {
        "title": "Soil Health Management",
        "content_type": "technical_guide",
        "desc": "Healthy soil is the foundation of productive agriculture.",
        "details": {
            "symptoms": "Indicators of poor soil health: Soil compaction, poor drainage, low organic matter, nutrient deficiency symptoms in crops.",
            "treatment": "Apply Farm Yard Manure (FYM) @ 10-15 tons/ha. Use biofertilizers (Rhizobium, Azotobacter, PSB). Green manuring (Daincha/Sunnhemp).",
            "prevention": "Adopt conservation tillage. Rotate crops (Legume-Cereal rotation). Maintain soil cover/mulching."
        }
    },
     {
        "title": "Drip Irrigation",
        "content_type": "technical_guide",
        "desc": "Efficient water management technique.",
        "details": {
            "symptoms": "Water scarcity, uneven plant growth due to water stress, excessive weed growth in furrows.",
            "treatment": "Install drip irrigation system. 40-60% water saving. 20-30% yield increase.",
            "prevention": "Regular maintenance: Acid treatment for clogging, filter cleaning frequently."
        }
    },
    {
        "title": "Integrated Pest Management (IPM)",
        "content_type": "technical_guide",
        "desc": "Sustainable approach to managing pests.",
        "details": {
            "symptoms": "High pest incidence, pest resistance to chemicals, damage to beneficial insects.",
            "treatment": "Use pheromone traps, light traps, sticky traps. Release bio-agents (Trichogramma). Use botanicals (Neem oil).",
            "prevention": "Regular monitoring (scouting). Cultural practices (Trap crops, Summer ploughing). Chemical control as LAST resort (ETL based)."
        }
    }
]

# ==========================================
# 2. App Usage Guide Generator
# ==========================================

app_guide_data = [
    {
        "feature": "Language Selection",
        "details": {
            "question": "How do I change the language in the app?",
            "answer": "Go to the Settings/Profile section in the app menu. Look for the 'Language' option. You can select from English, Hindi, Tamil, Telugu, Malayalam, and Kannada. The entire app interface and voice responses will switch to your selected language."
        }
    },
    {
        "feature": "Voice Query",
        "details": {
            "question": "How do I use the voice assistant?",
            "answer": "Tap the microphone icon on the home screen or chat screen. Speak your question clearly in your selected language (e.g., 'How to grow tomato?'). Wait a moment, and the AI will transcribe and answer your question in the same language."
        }
    },
    {
        "feature": "Disease Detection",
        "details": {
            "question": "How do I detect plant diseases?",
            "answer": "Go to the 'Disease Detection' or 'Camera' feature. Point your camera at the affected part of the plant (leaf/fruit) and take a photo. You can also upload a photo from your gallery. The AI will analyze it and tell you the disease name, symptoms, and treatment."
        }
    },
    {
        "feature": "Offline Mode",
        "details": {
            "question": "Does the app work without internet?",
            "answer": "Some features work offline! You can view previously saved answers and use the Disease Detection feature locally on your device. However, Voice features and new AI Chat queries currently require an active internet connection."
        }
    },
    {
        "feature": "Weather Updates",
        "details": {
            "question": "How do I check the weather for my farm?",
            "answer": "The home screen automatically displays the current weather for your location. Make sure GPS/Location permission is enabled for the app to give accurate local weather updates."
        }
    }
]

# ==========================================
# 3. Generate JSON Files
# ==========================================

final_dataset = []

# Process Crops Data
for crop in crops_data:
    # Add Cultivation Entry
    final_dataset.append({
        "id": str(uuid.uuid4()),
        "crop": crop["crop"],
        "category": "crop_cultivation",
        "disease": "Cultivation Guide",
        "content": {
            "english": {
                "symptoms": crop["cultivation"]["symptoms"],
                "treatment": crop["cultivation"]["treatment"],
                "prevention": crop["cultivation"]["prevention"]
            }
        }
    })
    
    # Add Disease Entries
    for disease in crop["diseases"]:
         final_dataset.append({
            "id": str(uuid.uuid4()),
            "crop": crop["crop"],
            "category": "disease_management",
            "disease": disease["name"],
            "content": {
                "english": {
                    "symptoms": disease["symptoms"],
                    "treatment": disease["treatment"],
                    "prevention": disease["prevention"]
                }
            }
        })

# Process General Farming Data
for guide in general_farming:
    final_dataset.append({
        "id": str(uuid.uuid4()),
        "crop": "General Farming",
        "category": "farming_technique",
        "disease": guide["title"],
        "content": {
            "english": {
                "symptoms": guide["details"]["symptoms"],
                "treatment": guide["details"]["treatment"],
                "prevention": guide["details"]["prevention"]
            }
        }
    })

# Process App Guide Data
app_guide_dataset = []
for guide in app_guide_data:
    # Format it to match the RAG schema so it can be ingested by the same system
    # We map 'question' -> 'symptoms', 'answer' -> 'treatment' generally, 
    # but for clarity in RAG result, we'll put the instruction in 'treatment'.
    
    app_guide_dataset.append({
        "id": str(uuid.uuid4()),
        "crop": "Farmly App",
        "category": "app_guide",
        "disease": guide["feature"],
        "content": {
            "english": {
                "symptoms": f"User asks about: {guide['details']['question']}",
                "treatment": guide["details"]["answer"],
                "prevention": "Refer to user manual for more details."
            }
        }
    })

# Merge datasets for the main training file
full_rag_dataset = final_dataset + app_guide_dataset

# Save to JSON
with open("backend/data/comprehensive_agriculture_data.json", "w", encoding="utf-8") as f:
    json.dump(full_rag_dataset, f, indent=2, ensure_ascii=False)

print(f"✅ Generated {len(full_rag_dataset)} detailed agriculture & app guide records (JSON).")
print("Saved to backend/data/comprehensive_agriculture_data.json")

# ==========================================
# 4. Generate Markdown File
# ==========================================

md_content = "# Farmly AI - Comprehensive Knowledge Base\n\n"

# Process Crops
md_content += "## 1. Crop Management & Diseases\n\n"

current_crop = ""
for entry in final_dataset:
    if "App" in entry["crop"] or "General" in entry["crop"]:
        continue
        
    if entry["crop"] != current_crop:
        current_crop = entry["crop"]
        md_content += f"### {current_crop}\n\n"
    
    disease_name = entry["disease"]
    content = entry["content"]["english"]
    
    md_content += f"#### {disease_name}\n"
    md_content += f"- **Symptoms:** {content['symptoms']}\n"
    md_content += f"- **Treatment:** {content['treatment']}\n"
    md_content += f"- **Prevention:** {content['prevention']}\n\n"

# Process General Farming
md_content += "## 2. General Farming Techniques\n\n"
for entry in final_dataset:
    if "General" in entry["crop"]:
        md_content += f"### {entry['disease']}\n"
        content = entry["content"]["english"]
        md_content += f"- **Description:** {content['symptoms']}\n" # Mapping back
        md_content += f"- **Implementation:** {content['treatment']}\n"
        md_content += f"- **Benefits:** {content['prevention']}\n\n"

# Process App Guide
md_content += "## 3. Farmly App User Guide\n\n"
for entry in app_guide_dataset:
    question = entry["content"]["english"]["symptoms"].replace("User asks about: ", "")
    answer = entry["content"]["english"]["treatment"]
    
    md_content += f"### {entry['disease']}\n"
    md_content += f"**Q:** {question}\n\n"
    md_content += f"**A:** {answer}\n\n"

with open("backend/data/farmly_knowledge_base.md", "w", encoding="utf-8") as f:
    f.write(md_content)

print("✅ Generated Markdown Knowledge Base.")
print("Saved to backend/data/farmly_knowledge_base.md")
