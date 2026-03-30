# Quickstart: Velma-2 Streaming

Real-time transcription over WebSocket. Connect, send audio chunks, and receive
partial and final transcript events as they arrive.

## Authentication

Pass your API key as the `api_key` query parameter when opening the WebSocket
connection.

## JavaScript example

```javascript
const apiKey = "YOUR_API_KEY";
const ws = new WebSocket(
  `wss://modulate-developer-apis.com/api/velma-2-stt-streaming/stream?api_key=${apiKey}&language=en-US`,
);

ws.onopen = () => {
  console.log("Connected. Sending audio...");
  // Send audio chunks as ArrayBuffer
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === "partial") {
    console.log("Partial:", msg.text);
  } else if (msg.type === "final") {
    console.log("Final:", msg.text, `[${msg.start}s – ${msg.end}s]`);
  }
};

ws.onclose = () => console.log("Session closed.");
```

## Sending audio

Send raw audio data as binary WebSocket frames. Supported formats: PCM
(16-bit, 16 kHz, mono), Opus, or WebM. Send an empty binary frame to signal
end of audio and flush the final segment.

```javascript
// Example: stream microphone audio via Web Audio API
navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: "audio/webm;codecs=opus",
  });
  mediaRecorder.ondataavailable = (e) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(e.data);
  };
  mediaRecorder.start(250); // send chunks every 250ms
});
```

## Enabling features

Pass additional query parameters when connecting:

```
?api_key=KEY&diarization=true&emotion=true&pii_redaction=true
```

Final transcript events will include `speaker`, `emotion`, and `accent` fields
when the corresponding features are enabled.

## Python example

```python
import asyncio
import websockets

async def transcribe():
    uri = "wss://modulate-developer-apis.com/api/velma-2-stt-streaming/stream?api_key=YOUR_API_KEY"
    async with websockets.connect(uri) as ws:
        with open("audio.opus", "rb") as f:
            chunk = f.read(4096)
            while chunk:
                await ws.send(chunk)
                chunk = f.read(4096)
        await ws.send(b"")  # signal end of audio
        async for message in ws:
            import json
            msg = json.loads(message)
            if msg["type"] == "final":
                print(msg["text"])

asyncio.run(transcribe())
```

## Quotas and billing

Billed per second of streaming audio. The base rate is $0.40 per hour.
Speaker diarization, emotion detection, and PII/PHI tagging are priced
separately. Quota usage is tracked in real time in the
[Usage Dashboard](/dashboard/usage/).
