# Synthetic Voice Detection Streaming API - Quickstart Guide

Real-time speech deepfake detection for single-speaker audio over WebSocket. Stream audio and
receive per-frame verdicts incrementally as they become available.

## Endpoint

```
WSS wss://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-streaming
```

## Authentication

Pass your API key as the `api_key` query parameter when opening the connection.
If authentication fails, the server closes the socket with code `4003` before
accepting the handshake.

## Audio Format

The `audio_format` query parameter is **required** for all connections.

### Raw formats

Raw formats send headerless audio samples as binary WebSocket frames.
When using a raw format, `sample_rate` and `num_channels` are also **required**.

Supported raw formats: `s8`, `s16le`, `s16be`, `s24le`, `s24be`, `s32le`,
`s32be`, `u8`, `u16le`, `u16be`, `u24le`, `u24be`, `u32le`, `u32be`,
`f32le`, `f32be`, `f64le`, `f64be`, `mulaw`, `alaw`

Common examples:

| Use case               | `audio_format` | `sample_rate` | `num_channels` |
|------------------------|----------------|---------------|----------------|
| Default / native app   | `s16le`        | `16000`       | `1`            |
| Web Audio AudioWorklet | `f32le`        | `48000`       | `1`            |
| Native stereo capture  | `s16le`        | `48000`       | `2`            |
| Telephony (mu-law)     | `mulaw`        | `8000`        | `1`            |
| Telephony (A-law)      | `alaw`         | `8000`        | `1`            |

### Container formats

Container formats include metadata in the stream itself, so `sample_rate`
and `num_channels` are not required.

Supported container formats: `wav`, `mp3`, `ogg`, `flac`, `webm`, `aac`, `aiff`

### Conversion

All audio is internally converted to 16 kHz mono for analysis. When the
input is already `s16le` at 16 kHz mono, no conversion is performed
(zero-cost passthrough). All other formats are decoded and resampled
automatically.

### Valid sample rates

`8000`, `11025`, `16000`, `22050`, `32000`, `44100`, `48000`, `96000`

### Valid channel counts

`1` through `8`

## Protocol

### Client → Server

| Frame type | Content              | Meaning                     |
|------------|----------------------|-----------------------------|
| Binary     | Audio bytes          | Audio data in declared format |
| Text       | `""` (empty string)  | Signals end of audio stream |

### Server → Client

All server messages are JSON text frames with a `type` field.

#### `frame` — Per-frame detection result

Emitted each time a sliding window of audio has been analysed.

```json
{
  "type": "frame",
  "frame": {
    "start_time_ms": 0,
    "end_time_ms": 4000,
    "verdict": "synthetic",
    "confidence": 0.9973
  }
}
```

| Field                  | Type   | Description                                         |
|------------------------|--------|-----------------------------------------------------|
| `frame.start_time_ms`  | int    | Window start time in the original audio (ms)        |
| `frame.end_time_ms`    | int    | Window end time in the original audio (ms)          |
| `frame.verdict`        | string | `"synthetic"`, `"non-synthetic"`, or `"no-content"` |
| `frame.confidence`     | float  | Confidence in the stated verdict (0–1)              |

#### `done` — Analysis complete

Sent after all frames have been delivered, in response to the client's
end-of-stream signal. The server closes the connection after this message.

```json
{
  "type": "done",
  "duration_ms": 12500,
  "frame_count": 10
}
```

| Field         | Type | Description                           |
|---------------|------|---------------------------------------|
| `duration_ms` | int  | Total duration of streamed audio (ms) |
| `frame_count` | int  | Total number of frames analysed       |

#### `error` — Error

Sent if the audio format is invalid, inference fails, or the server encounters
an internal error. The server closes the connection after this message.

```json
{
  "type": "error",
  "error": "Internal server error"
}
```

### Verdict Values

| Verdict         | Meaning                                         |
|-----------------|-------------------------------------------------|
| `synthetic`     | The frame likely contains AI-generated speech   |
| `non-synthetic` | The frame likely contains natural human speech  |
| `no-content`    | The frame is silent or contains no usable audio |

## Windowing Strategy

1. The first prediction fires once the minimum audio duration (~0.5 s) has been received.
2. Each subsequent prediction fires 1 second later, with the window growing from time 0.
3. Once the window reaches the full clip length (~4 s), the start slides forward so the window size stays constant.

This means results arrive incrementally during streaming — you don't need to wait
for the entire audio to be sent before receiving verdicts.

## Behavior Notes

- **Silent windows:** Frames that contain only silence are classified as `"no-content"` with confidence `1.0` immediately, without going through the model.
- **End-of-stream flush:** When you send the empty text frame, the server submits a final window covering any audio beyond the last sliding-window boundary, ensuring no trailing audio is dropped.
- **Backpressure:** If the inference queue is full, the server sends an error and closes the connection.

## Error Handling

| Scenario                          | Behavior                                       |
|-----------------------------------|-------------------------------------------------|
| Missing `audio_format`            | `error` message sent, connection closed (`1003`) |
| Invalid `audio_format`            | `error` message sent, connection closed (`1003`) |
| Raw format missing `sample_rate` or `num_channels` | `error` message sent, connection closed (`1003`) |
| Invalid `sample_rate`             | `error` message sent, connection closed (`1003`) |
| Invalid `num_channels`            | `error` message sent, connection closed (`1003`) |
| Data doesn't match declared format | `error` message sent, connection closed (`4002`) |
| Invalid or denied API key         | Connection closed with code `4003` before accept |
| Server overloaded                 | `error` message sent, connection closed          |
| Inference timeout                 | `error` message sent, connection closed          |
| Inference failure                 | `error` message sent, connection closed          |
| Client disconnects mid-stream     | Server cancels pending inference and cleans up   |

## Example: Python (aiohttp, from file)

```python
import asyncio
import json

import aiohttp

API_URL = "wss://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-streaming"
API_KEY = "YOUR_API_KEY"
AUDIO_FORMAT = "s16le"
SAMPLE_RATE = 16000
NUM_CHANNELS = 1
CHUNK_DURATION_S = 0.1
BYTES_PER_SAMPLE = 2
CHUNK_SIZE = int(SAMPLE_RATE * CHUNK_DURATION_S) * BYTES_PER_SAMPLE * NUM_CHANNELS


async def stream_audio(file_path: str) -> None:
    params = {
        "api_key": API_KEY,
        "audio_format": AUDIO_FORMAT,
        "sample_rate": str(SAMPLE_RATE),
        "num_channels": str(NUM_CHANNELS),
    }

    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(API_URL, params=params) as ws:

            async def listen() -> None:
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        data = json.loads(msg.data)
                        if data["type"] == "frame":
                            f = data["frame"]
                            print(
                                f"  {f['start_time_ms']}ms – {f['end_time_ms']}ms  "
                                f"verdict={f['verdict']}, confidence={f['confidence']:.4f}"
                            )
                        elif data["type"] == "done":
                            print(
                                f"Done: {data['duration_ms']}ms, "
                                f"{data['frame_count']} frame(s)"
                            )
                        elif data["type"] == "error":
                            print(f"Error: {data['error']}")
                    elif msg.type in (
                        aiohttp.WSMsgType.CLOSED,
                        aiohttp.WSMsgType.ERROR,
                    ):
                        break

            listener = asyncio.create_task(listen())

            # Stream audio file as raw PCM
            with open(file_path, "rb") as f:
                while True:
                    chunk = f.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    await ws.send_bytes(chunk)
                    # Pace sending to approximate real-time
                    await asyncio.sleep(CHUNK_DURATION_S)

            # Signal end of stream
            await ws.send_str("")

            # Wait for server to finish
            await listener


asyncio.run(stream_audio("/path/to/audio.raw"))
```

> **Note:** The file must already be in the format you declared. To produce
> raw 16 kHz mono int16 LE PCM with ffmpeg:
> ```bash
> ffmpeg -i input.mp3 -ar 16000 -ac 1 -f s16le -acodec pcm_s16le output.raw
> ```
>
> Alternatively, send the MP3 directly using `audio_format=mp3` (no
> `sample_rate` or `num_channels` needed):
> ```python
> params = {"api_key": API_KEY, "audio_format": "mp3"}
> ```

## Example: Python (aiohttp, from microphone)

```python
import asyncio
import json

import aiohttp
import sounddevice as sd

API_URL = "wss://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-streaming"
API_KEY = "YOUR_API_KEY"
AUDIO_FORMAT = "s16le"
SAMPLE_RATE = 16000
NUM_CHANNELS = 1
CHUNK_DURATION_S = 0.1
FRAMES_PER_CHUNK = int(SAMPLE_RATE * CHUNK_DURATION_S)


async def stream_microphone() -> None:
    params = {
        "api_key": API_KEY,
        "audio_format": AUDIO_FORMAT,
        "sample_rate": str(SAMPLE_RATE),
        "num_channels": str(NUM_CHANNELS),
    }

    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(API_URL, params=params) as ws:

            async def listen() -> None:
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.TEXT:
                        data = json.loads(msg.data)
                        if data["type"] == "frame":
                            f = data["frame"]
                            print(
                                f"  {f['start_time_ms']}ms – {f['end_time_ms']}ms  "
                                f"verdict={f['verdict']}, confidence={f['confidence']:.4f}"
                            )
                        elif data["type"] == "done":
                            print(
                                f"Done: {data['duration_ms']}ms, "
                                f"{data['frame_count']} frame(s)"
                            )
                        elif data["type"] == "error":
                            print(f"Error: {data['error']}")
                    elif msg.type in (
                        aiohttp.WSMsgType.CLOSED,
                        aiohttp.WSMsgType.ERROR,
                    ):
                        break

            listener = asyncio.create_task(listen())

            loop = asyncio.get_running_loop()
            audio_queue: asyncio.Queue[bytes] = asyncio.Queue()

            def audio_callback(indata, frame_count, time_info, status):
                loop.call_soon_threadsafe(
                    audio_queue.put_nowait, indata.tobytes()
                )

            stream = sd.InputStream(
                samplerate=SAMPLE_RATE,
                channels=NUM_CHANNELS,
                dtype="int16",
                blocksize=FRAMES_PER_CHUNK,
                callback=audio_callback,
            )

            print("Recording... press Ctrl+C to stop.")
            with stream:
                try:
                    while True:
                        chunk = await audio_queue.get()
                        await ws.send_bytes(chunk)
                except (KeyboardInterrupt, asyncio.CancelledError):
                    pass

            # Signal end of stream
            await ws.send_str("")

            # Wait for server to finish
            await listener


asyncio.run(stream_microphone())
```

> **Tip:** To capture audio in a different format, change the `sounddevice`
> parameters and query parameters to match. For example, to send float32
> at 48 kHz:
> ```python
> AUDIO_FORMAT = "f32le"
> SAMPLE_RATE = 48000
> NUM_CHANNELS = 1
>
> stream = sd.InputStream(
>     samplerate=SAMPLE_RATE,
>     channels=NUM_CHANNELS,
>     dtype="float32",
>     blocksize=FRAMES_PER_CHUNK,
>     callback=audio_callback,
> )
> ```

## Example: JavaScript (Browser)

```javascript
const API_URL = "wss://modulate-developer-apis.com/api/velma-2-synthetic-voice-detection-streaming";
const API_KEY = "YOUR_API_KEY";
const SAMPLE_RATE = 16000;

async function streamMicrophone() {
  const params = new URLSearchParams({
    api_key: API_KEY,
    audio_format: "s16le",
    sample_rate: String(SAMPLE_RATE),
    num_channels: "1",
  });
  const ws = new WebSocket(`${API_URL}?${params}`);

  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "frame") {
      const f = msg.frame;
      console.log(
        `${f.start_time_ms}ms – ${f.end_time_ms}ms  ` +
        `verdict=${f.verdict}, confidence=${f.confidence.toFixed(4)}`
      );
    } else if (msg.type === "done") {
      console.log(`Done: ${msg.duration_ms}ms, ${msg.frame_count} frame(s)`);
    } else if (msg.type === "error") {
      console.error(`Error: ${msg.error}`);
    }
  });

  await new Promise((resolve) => ws.addEventListener("open", resolve));

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
  const source = audioCtx.createMediaStreamSource(stream);

  // ScriptProcessorNode for simplicity — use AudioWorklet in production
  const processor = audioCtx.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (e) => {
    const float32 = e.inputBuffer.getChannelData(0);
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      int16[i] = Math.max(-32768, Math.min(32767, Math.round(float32[i] * 32768)));
    }
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(int16.buffer);
    }
  };

  source.connect(processor);
  processor.connect(audioCtx.destination);

  // Call this to stop recording
  return function stop() {
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    audioCtx.close();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("");  // signal end of stream
    }
  };
}

// Usage:
// const stop = await streamMicrophone();
// ... later ...
// stop();
```

> **Tip:** To skip the manual float32-to-int16 conversion in JavaScript,
> you can send float32 directly and let the server convert:
> ```javascript
> const params = new URLSearchParams({
>   api_key: API_KEY,
>   audio_format: "f32le",
>   sample_rate: String(audioCtx.sampleRate),
>   num_channels: "1",
> });
> ```
> Then send `float32.buffer` directly instead of converting to int16.

## Rate Limits

- Concurrent connection limits apply per organization
- Monthly usage limits (in audio hours) apply per organization
- Exceeding limits results in a `4003` close code at connection time