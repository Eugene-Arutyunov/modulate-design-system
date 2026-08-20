export const convScatterConfig = {
  axisX: {
    leftZone: { min: 0, max: 0.08 },
    rightZone: { min: 0.08, max: 1.50 },
    break: {
      leftSectionEnd: 65,
      rightSectionStart: 70,
    },
    // Grid line frequency settings for X axis
    gridLines: {
      left: {
        step: 0.01, // step between lines
        max: 0.08, // draw up to this value
        labels: [], // auto-generated
      },
      right: {
        step: 0.05, // step between lines
        max: 1.50, // draw up to this value
        labels: [0.10, 0.50, 1.00, 1.50], // specific values for labels
      },
    },
    staticDecimals: 2,
    hoverDecimals: { default: 2, exceptions: { "Modulate": 4 } },
  },
  axisY: {
    min: 0,
    max: 10,
    // Grid line frequency settings for Y axis
    gridLines: {
      step: 1, // step between lines (each integer)
      labels: [], // auto-generated for each integer from min to max
    },
    staticDecimals: 0,
    hoverDecimals: 2,
  },
  data: [
    {
      vendor: "Modulate",
      model: "velma-2-mini",
      modelType: "Mini",
      score: 7.93333,
      cost: "$0.033000",
      
    },
    {
      vendor: "Modulate",
      model: "velma-2",
      modelType: "Regular",
      score: 9.83332,
      cost: "$0.055000",
      visualOffset: -0.15,
    },
    // {
    //   vendor: "Modulate",
    //   model: "velma-1",
    //   modelType: "Regular",
    //   score: 9.49999,
    //   cost: "$0.024440",
    // },
    {
      vendor: "xAI",
      model: "grok-4.1-fast-non-reasoning",
      modelType: "Fast",
      score: 0.83333,
      cost: "$0.036410",
    },
    {
      vendor: "xAI",
      model: "grok-4.1-fast-reasoning",
      modelType: "Fast",
      score: 4.63333,
      cost: "$0.037320",
    },
    {
      vendor: "Google",
      model: "gemini-2-flash-lite",
      modelType: "",
      score: 1.43333,
      cost: "$0.050290",
      
    },
    {
      vendor: "DeepSeek",
      model: "deepseek-v3.1",
      modelType: "Regular",
      score: 5.73999,
      cost: "$0.054760",
    },
    {
      vendor: "Google",
      model: "gemini-2-flash",
      modelType: "",
      score: 4.26666,
      cost: "$0.056060",
      visualOffset: -0.1,
    },
    {
      vendor: "DeepSeek",
      model: "deepseek-v3.2",
      modelType: "",
      score: 6.46666,
      cost: "$0.062040",
    },
    {
      vendor: "Google",
      model: "gemini-3-flash-min",
      modelType: "",
      score: 5.06666,
      cost: "$0.090620",
      
    },
    {
      vendor: "DeepSeek",
      model: "deepseek-r1",
      modelType: "",
      score: 6.93333,
      cost: "$0.091990",
      visualOffset: -0.2,
    },
    {
      vendor: "Google",
      model: "gemini-3-flash-med",
      modelType: "",
      score: 6.29999,
      cost: "$0.118550",
      
    },
    {
      vendor: "Google",
      model: "gemini-2.5-pro",
      modelType: "",
      score: 7.53333,
      cost: "$0.283000",
      visualOffset: -0.2,
    },
    {
      vendor: "Google",
      model: "gemini-3-pro",
      modelType: "",
      score: 7.59999,
      cost: "$0.397580",
      visualOffset: 0.15,
    },
    {
      vendor: "xAI",
      model: "grok-3",
      modelType: "",
      score: 5.86666,
      cost: "$0.398780",
      
    },
    {
      vendor: "Deepgram",
      model: "nova-3-intelligence",
      modelType: "",
      score: 2.59333,
      cost: "$0.4382",
      
    },
    {
      vendor: "ElevenLabs",
      model: "scribe-v2",
      modelType: "",
      score: 1.5,
      cost: "$0.4414",
      
    },
    {
      vendor: "xAI",
      model: "grok-4-heavy",
      modelType: "",
      score: 7.86666,
      cost: "$0.444790",
      visualOffset: 0.3,
    },
    {
      vendor: "OpenAI",
      model: "gpt-5-mini",
      modelType: "",
      score: 3.33333,
      cost: "$0.559410",
      
    },
    {
      vendor: "OpenAI",
      model: "gpt-5.2-pro",
      modelType: "",
      score: 5.76666,
      cost: "$1.483230",
    },
    {
      vendor: "OpenAI",
      model: "gpt-5.2",
      modelType: "",
      score: 6.43333,
      cost: "$1.498401",
    },
  ],
  backgroundHighlight: {
    text: "Highest accuracy lowest cost",
  },
  useVisualOffset: true,
};

// Mobile (≤768px): sparser X-axis labels only; grid step unchanged
export const convScatterConfigMobile = {
  ...convScatterConfig,
  axisX: {
    ...convScatterConfig.axisX,
    trimLabelZeros: true,
    gridLines: {
      left: {
        step: 0.01,
        max: 0.08,
        labels: [0.02, 0.04, 0.06, 0.08],
      },
      right: {
        step: 0.05,
        max: 1.50,
        labels: [0.5, 1.0, 1.5],
      },
    },
  },
};


export const convScatterMeta = {
  title: "Conversation Understanding Benchmark — Accuracy vs. Cost",
  subtitle:
    "Evaluates a model's ability to identify conversation types, topics, speaker roles and key behaviors.",
  methodologyUrl: "https://www.modulate.ai/benchmark-methodology",
  methodologyLabel: "Methodology ↗",
  axisLabelX: "Inference cost",
  axisLabelY: "Accuracy score",
};
