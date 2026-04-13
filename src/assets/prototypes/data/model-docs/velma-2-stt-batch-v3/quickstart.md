# Quickstart: Velma-2 Batch v3 (Preview)

## Preview access

Velma-2 Batch v3 is currently in limited preview. Contact us to request access
for your organization.

## Basic transcription

```bash
curl -X POST https://modulate-developer-apis.com/api/velma-2-stt-batch-v3/transcribe \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "audio=@recording.mp3"
```

## Fine-grained emotion detection (v3 feature)

In addition to the primary `emotion` label, v3 returns `emotion_scores` — a
map of emotion names to confidence values between 0 and 1:

```bash
curl -X POST https://modulate-developer-apis.com/api/velma-2-stt-batch-v3/transcribe \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "audio=@interview.wav" \
  -F "emotion=true"
```

Response segment example:

```json
{
  "start": 0.0,
  "end": 3.4,
  "text": "I'm really happy with how this turned out.",
  "emotion": "joy",
  "emotion_scores": {
    "joy": 0.87,
    "surprise": 0.09,
    "neutral": 0.04
  }
}
```

## Migrating from Velma-2 Batch

Update the endpoint URL and keep everything else the same:

```diff
- url = "https://modulate-developer-apis.com/api/velma-2-stt-batch/transcribe"
+ url = "https://modulate-developer-apis.com/api/velma-2-stt-batch-v3/transcribe"
```

All existing parameters and response fields are preserved. The v3 model adds
`emotion_scores` when emotion detection is enabled.
