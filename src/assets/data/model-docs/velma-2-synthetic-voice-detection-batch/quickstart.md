# Synthetic Voice Detection Batch API - Quickstart Guide

## Endpoint

```
POST https://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-batch
```

## Authentication

Include your API key in the `X-API-Key` header:

```
X-API-Key: YOUR_API_KEY
```

## Supported Audio Formats

`.aac`, `.aiff`, `.flac`, `.mov`, `.mp3`, `.mp4`, `.ogg`, `.opus`, `.wav`, `.webm`

**Maximum file size:** 100 MB

**Recommended audio length:** 4–60 seconds. Files shorter than 0.5 seconds
will not be processed.

## Request

| Parameter     | Type                  | Required | Description           |
| ------------- | --------------------- | -------- | --------------------- |
| `upload_file` | `multipart/form-data` | Yes      | Audio file to analyze |
| `X-API-Key`   | Header                | Yes      | Your API key          |

## Response

```json
{
  "filename": "audio.mp3",
  "frames": [
    {
      "start_time_ms": 0,
      "end_time_ms": 4000,
      "verdict": "synthetic",
      "confidence": 0.9996
    },
    {
      "start_time_ms": 4000,
      "end_time_ms": 7648,
      "verdict": "synthetic",
      "confidence": 0.9999
    }
  ],
  "duration_ms": 7683
}
```

| Field                    | Type           | Description                                                                |
| ------------------------ | -------------- | -------------------------------------------------------------------------- |
| `filename`               | string \| null | Name of the submitted audio file, or null if not provided                  |
| `frames`                 | list           | Per-frame analysis results in chronological order                          |
| `frames[].start_time_ms` | int            | Start of detected speech within the frame (ms)                             |
| `frames[].end_time_ms`   | int            | End of detected speech within the frame (ms)                               |
| `frames[].verdict`       | string         | Classification result: `"synthetic"`, `"non-synthetic"`, or `"no-content"` |
| `frames[].confidence`    | float          | Model confidence in the stated verdict (0–1). Higher = more confident      |
| `duration_ms`            | int            | Total duration of the audio file in milliseconds                           |

### Verdict values

| Verdict         | Meaning                                                 |
| --------------- | ------------------------------------------------------- |
| `synthetic`     | The frame likely contains AI-generated speech           |
| `non-synthetic` | The frame likely contains natural human speech          |
| `no-content`    | The frame is silent or contains no usable audio content |

## Behavior Notes

- **Silence trimming:** Leading and trailing silence is trimmed before windowing. Frame timestamps reflect positions in the original file, accounting for any trimmed silence offset.
- **Silent chunks:** Frames that contain only silence or no usable audio are assigned a `"no-content"` verdict with a confidence of `1.0`. These frames are not sent through the model.
- **Short audio:** Files shorter than one full 4-second window are padded before inference.

## Error Responses

| Status | Meaning                                         |
| ------ | ----------------------------------------------- |
| `400`  | Bad request — empty file or unsupported format  |
| `403`  | Invalid or unauthorized API key                 |
| `422`  | Audio too short for analysis                    |
| `500`  | Internal server error during inference          |
| `502`  | Usage check service unavailable — please retry  |
| `503`  | Server is temporarily overloaded — please retry |
| `504`  | Request timed out                               |

## Example: cURL

```bash
curl -X POST https://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-batch \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "upload_file=@/path/to/audio.mp3"
```

## Example: Python (requests)

```python
import requests

API_URL = "https://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-batch"
API_KEY = "YOUR_API_KEY"

with open("/path/to/audio.mp3", "rb") as f:
    response = requests.post(
        API_URL,
        headers={"X-API-Key": API_KEY},
        files={"upload_file": ("audio.mp3", f)},
    )

response.raise_for_status()
result = response.json()

print(f"Duration: {result['duration_ms']}ms")

for frame in result["frames"]:
    print(
        f"  {frame['start_time_ms']}ms – {frame['end_time_ms']}ms  "
        f"verdict={frame['verdict']}, "
        f"confidence={frame['confidence']:.4f}"
    )
```

## Example: Python (aiohttp, async)

```python
import asyncio
import aiohttp

API_URL = "https://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-batch"
API_KEY = "YOUR_API_KEY"


async def analyze_audio(file_path: str) -> dict:
    async with aiohttp.ClientSession(headers={"X-API-Key": API_KEY}) as session:
        with open(file_path, "rb") as f:
            form = aiohttp.FormData()
            form.add_field("upload_file", f, filename=file_path.split("/")[-1])
            async with session.post(API_URL, data=form) as response:
                response.raise_for_status()
                return await response.json()


async def main() -> None:
    result = await analyze_audio("/path/to/audio.mp3")
    print(f"Duration: {result['duration_ms']}ms")

    for frame in result["frames"]:
        print(
            f"  {frame['start_time_ms']}ms – {frame['end_time_ms']}ms  "
            f"verdict={frame['verdict']}, "
            f"confidence={frame['confidence']:.4f}"
        )


asyncio.run(main())
```

## Example: JavaScript (Node.js with fetch)

```javascript
import fs from "fs";
import path from "path";
import FormData from "form-data";

const API_URL =
  "https://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-batch";
const API_KEY = "YOUR_API_KEY";

async function analyzeAudio(filePath) {
  const form = new FormData();
  form.append("upload_file", fs.createReadStream(filePath), {
    filename: path.basename(filePath),
  });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "X-API-Key": API_KEY,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API error ${response.status}: ${error.detail}`);
  }

  return response.json();
}

const result = await analyzeAudio("/path/to/audio.mp3");
console.log(`Duration: ${result.duration_ms}ms`);
for (const frame of result.frames) {
  console.log(
    `  ${frame.start_time_ms}ms – ${frame.end_time_ms}ms  ` +
      `verdict=${frame.verdict}, ` +
      `confidence=${frame.confidence.toFixed(4)}`,
  );
}
```

## Rate Limits

- Concurrent request limits apply per organization
- Monthly usage limits (in audio hours) apply per organization
- Exceeding limits returns a `403` status code
