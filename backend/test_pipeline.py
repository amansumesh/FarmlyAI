"""Test: Generate speech audio -> Whisper transcription -> RAG response"""
import requests, io, os, sys

RAG_URL = "http://localhost:5001"

# Install gtts if needed
try:
    from gtts import gTTS
except ImportError:
    os.system("pip install gtts -q")
    from gtts import gTTS

print("[TEST] Generating speech audio for: 'What is early blight disease in crops'")
tts = gTTS(text="What is early blight disease in crops", lang="en")
audio_buf = io.BytesIO()
tts.write_to_fp(audio_buf)
audio_buf.seek(0)
print("[TEST] Audio generated, sending to Whisper /transcribe...")

# Step 1: Transcribe
try:
    resp = requests.post(
        f"{RAG_URL}/transcribe",
        files={"audio": ("speech.mp3", audio_buf, "audio/mpeg")},
        data={"language": "en"},
        timeout=60
    )
    print(f"[TRANSCRIBE] Status: {resp.status_code}")
    data = resp.json()
    transcription = data.get("text", "")
    print(f"[TRANSCRIBE] Result: \"{transcription}\"")
except Exception as e:
    print(f"[TRANSCRIBE] ERROR: {e}")
    transcription = ""
    sys.exit(1)

# Step 2: RAG query
if transcription:
    print(f"\n[RAG] Sending transcription to /query...")
    try:
        resp2 = requests.post(
            f"{RAG_URL}/query",
            json={"query": transcription, "k": 3},
            timeout=120
        )
        print(f"[RAG] Status: {resp2.status_code}")
        data2 = resp2.json()
        print(f"\n[RAG] ANSWER:")
        print(data2.get("answer", "No answer"))
        sources = data2.get("sources", [])
        if sources:
            print(f"\n[RAG] SOURCES:")
            for s in sources:
                crop = s.get("crop", "?")
                disease = s.get("disease", "?")
                score = s.get("score", 0)
                print(f"  - {crop}: {disease} (score={score:.3f})")
    except Exception as e:
        print(f"[RAG] ERROR: {e}")
else:
    print("[SKIP] No transcription, skipping RAG query")

print("\n[DONE] Pipeline test complete")
