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
  },

  email: {
    host: requireEnv('EMAIL_HOST'),
    port: parseInt(requireEnv('EMAIL_PORT'), 10),
    user: requireEnv('EMAIL_USER'),
    pass: requireEnv('EMAIL_PASS'),
    from: requireEnv('EMAIL_FROM'),
  },

  sms: {
    provider: process.env.SMS_PROVIDER ?? '',
    apiKey: process.env.SMS_API_KEY ?? '',
    from: process.env.SMS_FROM ?? '',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
  },

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN ?? '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
  },

  termii: {
    apiKey: process.env.TERMII_API_KEY ?? '',
    senderId: process.env.TERMII_SENDER_ID ?? 'FaithCare',
    baseUrl: process.env.TERMII_BASE_URL ?? 'https://api.ng.termii.com/api',
  },

  platformUrl: process.env.PLATFORM_URL ?? 'https://faithcare-web.vercel.app',
});

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};
