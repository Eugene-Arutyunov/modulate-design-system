// Velma Fraud Demo — default conversation data.
//
// Converted from velma-fraud-demo-events.json (v2.1, verbatim from the
// recordings): same timings, plus a curated `emotion` per utterance so the
// fingerprint timeline can color the clips the canonical way. Emotions
// follow the emotion signals in the feed (Caller: frustrated → angry,
// Agent: calm) and fill the gaps plausibly.

export const velmaFraudData = {
  meta: {
    title: "Velma Triage",
    subtitle: "live analysis preconfigured demo · Harborview Bank sample call",
    scenario:
      "Account takeover attempt, Harborview Bank — opens mid-call in the social-manipulation phase",
    durationMs: 68440,
    fraudThreshold: 85,
    // On the tools page the file is served from the site assets; for a
    // Webflow embed upload the mp3 to the site assets and put its URL here.
    audioUrl: "/assets/service/velma-fraud/velma-fraud-demo.mp3",
    speakers: {
      1: { label: "Caller", voice: "synthetic (ElevenLabs)" },
      2: { label: "Agent", name: "Alex", voice: "human recording" },
    },
  },
  transcript: [
    {
      id: "u1",
      speaker: 1,
      startMs: 0,
      endMs: 8738,
      emotion: "frustrated",
      text: "Come on! We've been at this for five minutes. I've answered everything. Just change the email on the account so I can get my code.",
    },
    {
      id: "u2",
      speaker: 2,
      startMs: 9088,
      endMs: 14483,
      emotion: "calm",
      text: "I do apologize, sir, but the answers you gave didn't match what we have on file.",
    },
    {
      id: "u3",
      speaker: 1,
      startMs: 14733,
      endMs: 22685,
      emotion: "stressed",
      text: "Because I moved last month. Look, I have a $12,000 transfer waiting. Every minute this takes is costing me.",
    },
    {
      id: "u4",
      speaker: 2,
      startMs: 23085,
      endMs: 30845,
      emotion: "neutral",
      text: "Yes, I understand your frustration here. However, the fastest secure option is verifying your identity at a branch.",
    },
    {
      id: "u5",
      speaker: 1,
      startMs: 30995,
      endMs: 40321,
      emotion: "anxious",
      text: "I'm overseas, that's the whole point. Just update the email and phone. You can hear it's me. Who else would know the account number?",
    },
    {
      id: "u6",
      speaker: 2,
      startMs: 40771,
      endMs: 46847,
      emotion: "confident",
      text: "Knowing the account number isn't identity verification, sir. It's for your protection.",
    },
    {
      id: "u7",
      speaker: 1,
      startMs: 47196,
      endMs: 55869,
      emotion: "angry",
      text: "This is unbelievable. What's your name? Alex, you said? I'll make sure your supervisor knows you cost me this transfer.",
    },
    {
      id: "u8",
      speaker: 2,
      startMs: 56369,
      endMs: 64848,
      emotion: "calm",
      text: "Yes, that's correct. And again, I understand that you're frustrated, sir. But unfortunately, I'm not going to be able to make that change today for you.",
    },
    {
      id: "u9",
      speaker: 1,
      startMs: 65248,
      endMs: 67697,
      emotion: "contemptuous",
      text: "This is ridiculous. Just forget it.",
    },
  ],
  signals: [
    { tMs: 2000, type: "language", label: "English (en) detected", confidence: 99, speaker: null },
    { tMs: 3800, type: "speaker", label: "Speaker 1 identified — Caller", confidence: 97, speaker: 1 },
    {
      tMs: 5800,
      type: "deepfake",
      label: "Caller clip flagged as synthetic (0:00–0:04)",
      confidence: 93,
      speaker: 1,
    },
    { tMs: 7000, type: "emotion", label: "Caller: Frustrated", confidence: 90, speaker: 1, emotion: "frustrated" },
    { tMs: 10100, type: "speaker", label: "Speaker 2 identified — Agent", confidence: 98, speaker: 2 },
    { tMs: 11600, type: "emotion", label: "Agent: Calm", confidence: 94, speaker: 2, emotion: "calm" },
    {
      tMs: 13100,
      type: "behavior",
      label: "Repeated Verification Failure",
      confidence: 87,
      speaker: 1,
    },
    {
      tMs: 18700,
      type: "deepfake",
      label: "Caller clip flagged as synthetic (0:14–0:18)",
      confidence: 95,
      speaker: 1,
    },
    { tMs: 20700, type: "behavior", label: "Urgency Pressure", confidence: 89, speaker: 1 },
    {
      tMs: 35000,
      type: "behavior",
      label: "Contact Change Request (unverified)",
      confidence: 92,
      speaker: 1,
    },
    {
      tMs: 37000,
      type: "deepfake",
      label: "Caller clip flagged as synthetic (0:30–0:34)",
      confidence: 94,
      speaker: 1,
    },
    {
      tMs: 49200,
      type: "emotion",
      label: "Caller: Agitated — emotion shift",
      confidence: 93,
      speaker: 1,
      emotion: "angry",
    },
    {
      tMs: 51700,
      type: "behavior",
      label: "Intimidation — threat to escalate",
      confidence: 88,
      speaker: 1,
    },
  ],
  verdict: { tMs: 56000, label: "High fraud risk — account takeover pattern", confidence: 94 },
  actions: [
    { tMs: 58500, label: "Labeled as suspected fraud" },
    { tMs: 61000, label: "Sent for manual review" },
    { tMs: 63500, label: "Account changes frozen" },
  ],
  meterKeyframes: [
    { tMs: 0, value: 0 },
    { tMs: 5800, value: 22 },
    { tMs: 13100, value: 38 },
    { tMs: 18700, value: 50 },
    { tMs: 20700, value: 58 },
    { tMs: 35000, value: 70 },
    { tMs: 37000, value: 80 },
    { tMs: 51700, value: 88 },
    { tMs: 56000, value: 94 },
  ],
};
