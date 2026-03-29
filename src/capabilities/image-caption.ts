import { config } from '../config.js';
import { ValidationError, ModelError } from '../errors/index.js';
import { registerCapability } from './registry.js';
import type { CapabilityHandler } from '../types/index.js';

const imageCaption: CapabilityHandler = {
  name: 'image_caption',
  description: 'Generate a caption for an image URL',

  validate(input: Record<string, unknown>): void {
    if (!input.image_url || typeof input.image_url !== 'string') {
      throw new ValidationError('input.image_url is required and must be a string', {
        field: 'image_url',
        received: typeof input.image_url,
      });
    }
    try {
      new URL(input.image_url);
    } catch {
      throw new ValidationError('input.image_url must be a valid URL', {
        field: 'image_url',
        received: input.image_url,
      });
    }
  },

  async execute(input: Record<string, unknown>): Promise<{ result: unknown }> {
    const imageUrl = input.image_url as string;

    if (config.useRealModel) {
      return executeWithModel(imageUrl);
    }
    return { result: `[Mock] A descriptive caption for the image at ${imageUrl}` };
  },
};

async function executeWithModel(imageUrl: string): Promise<{ result: unknown }> {
  try {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: config.openaiApiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in one sentence.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    return { result: response.choices[0].message.content?.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown model error';
    throw new ModelError(`OpenAI vision API call failed: ${message}`, {
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
  }
}

registerCapability(imageCaption);
