import { config } from '../config.js';
import { ValidationError, ModelError } from '../errors/index.js';
import { registerCapability } from './registry.js';
import type { CapabilityHandler } from '../types/index.js';

const textSummary: CapabilityHandler = {
  name: 'text_summary',
  description: 'Summarize text content',

  validate(input: Record<string, unknown>): void {
    if (!input.text || typeof input.text !== 'string') {
      throw new ValidationError('input.text is required and must be a string', {
        field: 'text',
        received: typeof input.text,
      });
    }
    if (input.text.length === 0) {
      throw new ValidationError('input.text must not be empty', { field: 'text' });
    }
    if (input.max_length !== undefined) {
      if (typeof input.max_length !== 'number' || input.max_length <= 0) {
        throw new ValidationError('input.max_length must be a positive number', {
          field: 'max_length',
          received: input.max_length,
        });
      }
    }
  },

  async execute(input: Record<string, unknown>): Promise<{ result: unknown }> {
    const text = input.text as string;
    const maxLength = (input.max_length as number) || 120;

    if (config.useRealModel) {
      return executeWithModel(text, maxLength);
    }
    return executeMock(text, maxLength);
  },
};

async function executeWithModel(text: string, maxLength: number): Promise<{ result: unknown }> {
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: config.openaiApiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Please summarize the following text in no more than ${maxLength} characters. Return only the summary, no extra commentary.\n\n${text}`,
        },
      ],
      max_tokens: Math.ceil(maxLength / 2),
    });

    return { result: response.choices[0].message.content?.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown model error';
    throw new ModelError(`OpenAI API call failed: ${message}`, {
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
  }
}

function executeMock(text: string, maxLength: number): { result: unknown } {
  // Smart mock: split by sentence boundaries, preserve complete sentences
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || [text];
  let summary = '';
  for (const sentence of sentences) {
    if ((summary + sentence).length > maxLength) break;
    summary += sentence;
  }
  if (!summary) {
    summary = text.slice(0, maxLength);
  }
  return {
    result: summary.length < text.length ? summary.trimEnd() + '...' : summary,
  };
}

registerCapability(textSummary);
