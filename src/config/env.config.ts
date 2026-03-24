export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/faithcare',
  },

  jwt: {
    accessSecret: process.env.JWT_SECRET || 'faithcare-dev-access-secret',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'faithcare-dev-refresh-secret',
    accessExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '90d',
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'FaithCare <noreply@faithcare.app>',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || '',
    apiKey: process.env.SMS_API_KEY || '',
    from: process.env.SMS_FROM || '',
  },
});
