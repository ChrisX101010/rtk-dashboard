// LLM pricing per 1M input tokens (USD) — updated March 2026
// Users select their model to see accurate cost savings

export const LLM_MODELS = {
  "claude-sonnet-4": { name: "Claude Sonnet 4", provider: "Anthropic", inputPer1M: 3.00, outputPer1M: 15.00 },
  "claude-opus-4": { name: "Claude Opus 4", provider: "Anthropic", inputPer1M: 15.00, outputPer1M: 75.00 },
  "claude-haiku-4": { name: "Claude Haiku 4", provider: "Anthropic", inputPer1M: 0.80, outputPer1M: 4.00 },
  "gpt-4o": { name: "GPT-4o", provider: "OpenAI", inputPer1M: 2.50, outputPer1M: 10.00 },
  "gpt-4o-mini": { name: "GPT-4o Mini", provider: "OpenAI", inputPer1M: 0.15, outputPer1M: 0.60 },
  "gpt-4.1": { name: "GPT-4.1", provider: "OpenAI", inputPer1M: 2.00, outputPer1M: 8.00 },
  "gemini-2.5-pro": { name: "Gemini 2.5 Pro", provider: "Google", inputPer1M: 1.25, outputPer1M: 10.00 },
  "gemini-2.5-flash": { name: "Gemini 2.5 Flash", provider: "Google", inputPer1M: 0.15, outputPer1M: 0.60 },
  "deepseek-v3": { name: "DeepSeek V3", provider: "DeepSeek", inputPer1M: 0.27, outputPer1M: 1.10 },
  "codex-mini": { name: "Codex Mini", provider: "OpenAI", inputPer1M: 1.50, outputPer1M: 6.00 },
  "custom": { name: "Custom rate", provider: "Custom", inputPer1M: 3.00, outputPer1M: 15.00 },
};

export const DEFAULT_MODEL = "claude-sonnet-4";

export function calculateCost(tokens, modelId) {
  const model = LLM_MODELS[modelId] || LLM_MODELS[DEFAULT_MODEL];
  return (tokens / 1_000_000) * model.inputPer1M;
}
