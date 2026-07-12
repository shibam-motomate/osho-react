"""
Pilot transcription runner. Run export-episodes.mjs first to produce manifest.json,
then: pip install faster-whisper  &&  python transcribe.py

Env vars:
  WHISPER_MODEL   tiny|base|small|medium|large-v3 (default: small)
  WHISPER_DEVICE  cpu|cuda (default: auto-detect)
  KEEP_AUDIO      set to "1" to keep downloaded mp3s (default: deleted after transcribing)
"""
import json
import os
import urllib.request

from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get('WHISPER_MODEL', 'small')
KEEP_AUDIO = os.environ.get('KEEP_AUDIO') == '1'
AUDIO_DIR = 'audio'
OUT_DIR = 'transcripts'


def download(url, dest):
    if os.path.exists(dest):
        return
    urllib.request.urlretrieve(url, dest)


def main():
    with open('manifest.json') as f:
        manifest = json.load(f)

    os.makedirs(AUDIO_DIR, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)

    model = WhisperModel(MODEL_SIZE, device='auto', compute_type='int8')

    for item in manifest:
        key = f"{item['seriesId']}_{item['episodeIndex']:03d}"
        audio_path = f"{AUDIO_DIR}/{key}.mp3"
        out_path = f"{OUT_DIR}/{key}.json"

        if os.path.exists(out_path):
            print(f"skip {key} (already transcribed)")
            continue

        print(f"downloading: {item['title']}")
        download(item['url'], audio_path)

        print(f"transcribing: {item['title']}")
        segments, info = model.transcribe(audio_path, language=item['lang'])
        text = ' '.join(seg.text.strip() for seg in segments)

        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump({**item, 'transcript': text, 'detectedLanguage': info.language},
                       f, ensure_ascii=False, indent=2)

        if not KEEP_AUDIO:
            os.remove(audio_path)

        print(f"done: {key} ({len(text)} chars)")


if __name__ == '__main__':
    main()
