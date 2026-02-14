import json
import os
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

client = Groq(api_key=GROQ_API_KEY)

# Configuration
INPUT_FILE = "data/comprehensive_agriculture_data.json"
OUTPUT_FILE = "data/comprehensive_agriculture_data_multilingual.json"

LANGUAGES = {
    "hindi": "Hindi",
    "tamil": "Tamil",
    "telugu": "Telugu",
    "malayalam": "Malayalam",
    "kannada": "Kannada"
}

def translate_text(text, target_language):
    """Translate text using Groq Llama 3"""
    if not text or len(text) < 2:
        return text

    prompt = f"""Translate the following agriculture-related text to {target_language}.
Maintain the original meaning and tone.
Output ONLY the translation. No introductory text.

Text: "{text}"
Translation:"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
        )
        return chat_completion.choices[0].message.content.strip().strip('"')
    except Exception as e:
        print(f"Error translating to {target_language}: {e}")
        return text

def main():
    print(f"Loading data from {INPUT_FILE}...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Found {len(data)} items. Starting translation...")

    for i, item in enumerate(data):
        print(f"\nProcessing {i+1}/{len(data)}: {item['crop']} - {item['disease']}")
        
        # Ensure 'content' exists
        if "content" not in item:
            item["content"] = {}
        
        # English content (source)
        source = item["content"].get("english", {})
        if not source:
            print("Skipping (no English content)")
            continue

        # Translate to each language
        for lang_code, lang_name in LANGUAGES.items():
            if lang_code in item["content"]:
                print(f"  - {lang_name} already exists. Skipping.")
                continue
            
            print(f"  - Translating to {lang_name}...", end="", flush=True)
            
            translated_content = {
                "symptoms": translate_text(source.get("symptoms", ""), lang_name),
                "treatment": translate_text(source.get("treatment", ""), lang_name),
                "prevention": translate_text(source.get("prevention", ""), lang_name)
            }
            
            item["content"][lang_code] = translated_content
            print(" Done.")
            time.sleep(0.5) # Rate limit friendly

        # Save intermediate progress every 5 items
        if (i + 1) % 5 == 0:
            print("Saving progress...")
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    # Final Save
    print(f"\nTranslation complete! Saving to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Done!")

if __name__ == "__main__":
    main()
