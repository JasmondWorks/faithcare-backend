export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',

  port: parseInt(requireEnv('PORT'), 10),

  mongodb: {
    uri: requireEnv('MONGODB_URI'),
  },

  jwt: {
    accessSecret: requireEnv('ACCESS_SECRET'),
    refreshSecret: requireEnv('REFRESH_SECRET'),
    accessExpiresIn: requireEnv('JWT_ACCESS_TOKEN_EXPIRES_IN'),
    refreshExpiresIn: requireEnv('JWT_REFRESH_TOKEN_EXPIRES_IN'),
    inviteSecret: process.env.JWT_INVITE_SECRET ?? requireEnv('ACCESS_SECRET'),
    inviteExpiresIn: process.env.JWT_INVITE_EXPIRES_IN ?? '7d',
    qrSecret: process.env.JWT_QR_SECRET ?? requireEnv('ACCESS_SECRET'),
    qrExpiresIn: process.env.JWT_QR_EXPIRES_IN ?? '8h',
  },

  email: {
    host: requireEnv('EMAIL_HOST'),
    port: parseInt(requireEnv('EMAIL_PORT'), 10),
    user: requireEnv('EMAIL_USER'),
    pass: requireEnv('EMAIL_PASS'),
    from: requireEnv('EMAIL_FROM'),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN ?? '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? '',
  },

  termii: {
    apiKey: process.env.TERMII_API_KEY ?? '',
    senderId: process.env.TERMII_SENDER_ID ?? 'FaithCare',
    baseUrl: process.env.TERMII_BASE_URL ?? 'https://api.ng.termii.com/api',
  },

  platformUrl: process.env.PLATFORM_URL ?? 'https://faithcare-web.vercel.app',

  scripture: {
    key: requireEnv('API_BIBLE_KEY'),
    url: process.env.API_BIBLE_URL ?? 'https://api.scripture.api.bible/v1',
    // Comma-separated api.bible IDs for each enabled translation, e.g.:
    // API_BIBLE_IDS=de4e12af7f28f599-02,65eec8e0b60e656b-01,116FNN3PTQQH
    // API_BIBLE_NAMES=KJV,NIV,NLT
    bibleIds: (process.env.API_BIBLE_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    bibleNames: (process.env.API_BIBLE_NAMES ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  },
});

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};
