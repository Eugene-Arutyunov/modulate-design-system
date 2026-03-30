# Quickstart: Velma-2 Batch English Fast

High-throughput English-only transcription. Accepts Opus audio and returns
results with automatic capitalization and punctuation.

## Authentication

Pass your API key in the `X-API-Key` header. Generate keys in
[API Keys](/dashboard/api-keys/).

## Basic transcription

```bash
curl -X POST https://modulate-developer-apis.com/api/velma-2-stt-batch-fast-en/transcribe \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "audio=@recording.opus"
```

Response:

```json
{
  "transcript": "This is the transcribed text with proper capitalization.",
  "duration_seconds": 4.1,
  "segments": [
    {
      "start": 0.0,
      "end": 4.1,
      "text": "This is the transcribed text with proper capitalization."
    }
  ]
}
```

## Python example

```python
import requests

api_key = "YOUR_API_KEY"
url = "https://modulate-developer-apis.com/api/velma-2-stt-batch-fast-en/transcribe"

with open("recording.opus", "rb") as f:
    response = requests.post(
        url,
        headers={"X-API-Key": api_key},
        files={"audio": f},
    )

result = response.json()
print(result["transcript"])
```

## Supported format

Opus only. For other audio formats, use Velma-2 Batch.

## When to use this model

- High-volume English transcription pipelines
- Applications where speed matters more than multilingual support
- Workflows where content is always English and audio is already in Opus format

For multilingual content, speaker diarization, or emotion detection, use
[Velma-2 Batch](/docs/) instead.
