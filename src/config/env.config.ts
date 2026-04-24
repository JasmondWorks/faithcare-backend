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
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? '',
  },

  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
});

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};
