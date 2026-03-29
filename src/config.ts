export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  useRealModel: process.env.USE_REAL_MODEL === 'true',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
};
