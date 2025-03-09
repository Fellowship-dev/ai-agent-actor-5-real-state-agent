export interface OpenaiAPICost {
  input: number; // USD cost per 1000 tokens
  output: number; // USD cost per 1000 tokens
}

export interface GPTModelConfig {
  model: string;
  maxTokens: number;
  maxOutputTokens?: number;
  interface: 'text' | 'chat';
  cost: OpenaiAPICost; // USD cost per 1000 tokens
}

/**
* List of GPT models that can be used.
* Should be in sync with https://platform.openai.com/docs/models/
* Last updated on 2025-03-09
*/
export const GPT_MODEL_LIST: {[key: string]: GPTModelConfig} = {
  'gpt-4o': {
    model: 'gpt-4o',
    maxTokens: 16384,
    interface: 'chat',
    cost: {
      input: 0.0025,
      output: 0.01,
    },
  },
  'gpt-4o-mini': {
    model: 'gpt-4o-mini',
    maxTokens: 16384,
    interface: 'chat',
    cost: {
      input: 0.00015,
      output: 0.0006,
    },
  },
  'gpt-3.5-turbo': {
    model: 'gpt-3.5-turbo',
    maxTokens: 8192,
    interface: 'chat',
    cost: {
      input: 0.0005,
      output: 0.0015,
    },
  },
  'o3-mini': {
    model: 'o3-mini',
    maxTokens: 4096,
    interface: 'chat',
    cost: {
      input: 0.0011,
      output: 0.0044,
    },
  },
  'o1-mini': {
    model: 'o1-mini',
    maxTokens: 2048,
    interface: 'chat',
    cost: {
      input: 0.0011,
      output: 0.0044,
    },
  },
};
