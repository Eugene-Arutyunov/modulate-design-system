# Quickstart: Velma-2 Batch

Submit an audio file and receive a full transcript with optional speaker
diarization, emotion detection, and PII/PHI redaction.

## Authentication

All requests require an API key passed in the `X-API-Key` header. You can
generate keys in the [API Keys](/dashboard/api-keys/) section of the dashboard.

## Basic transcription

```bash
curl -X POST https://modulate-developer-apis.com/api/velma-2-stt-batch/transcribe \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "audio=@recording.mp3"
```

The response is a JSON object with a `transcript` string and a `segments` array:

```json
{
  "transcript": "Hello, this is a test recording.",
  "language": "en-US",
  "duration_seconds": 3.2,
  "segments": [
    { "start": 0.0, "end": 3.2, "text": "Hello, this is a test recording." }
  ]
}
```

## Speaker diarization

Pass `diarization=true` to label each segment by speaker:

```bash
curl -X POST https://modulate-developer-apis.com/api/velma-2-stt-batch/transcribe \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "audio=@meeting.mp4" \
  -F "diarization=true"
```

Each segment will include a `speaker` field (`"SPEAKER_00"`, `"SPEAKER_01"`, …).

## Emotion and accent detection

```bash
curl -X POST https://modulate-developer-apis.com/api/velma-2-stt-batch/transcribe \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "audio=@interview.wav" \
  -F "emotion=true" \
  -F "accent=true"
```

## PII/PHI redaction

Pass `pii_redaction=true` to replace personally identifiable information with
`[REDACTED]` in the transcript:

```bash
curl -X POST https://modulate-developer-apis.com/api/velma-2-stt-batch/transcribe \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "audio=@patient-call.wav" \
  -F "pii_redaction=true"
```

## Python example

```python
import requests

api_key = "YOUR_API_KEY"
url = "https://modulate-developer-apis.com/api/velma-2-stt-batch/transcribe"

with open("recording.mp3", "rb") as f:
    response = requests.post(
        url,
        headers={"X-API-Key": api_key},
        files={"audio": f},
        data={"diarization": "true"},
    )

result = response.json()
print(result["transcript"])
```

## Supported formats

AAC, AIFF, FLAC, MOV, MP3, MP4, OGG, Opus, WAV, WebM — up to 100 MB per file.

## Quotas and billing

Usage is counted in hours of audio processed. The base rate is $0.25 per hour.
Speaker diarization adds $0.05/hr and PII/PHI tagging adds $0.075/hr when
enabled. Quotas reset monthly. Current usage is visible in the
[Usage Dashboard](/dashboard/usage/).
