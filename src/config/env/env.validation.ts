import * as Joi from 'joi';

export const validationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'localhost', 'staging', 'production').default('development'),
    PORT: Joi.number().default(3400),

    DB_CONNECTION: Joi.string().valid('postgres', 'mysql', 'sqlite').required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),

    JWT_SECRET: Joi.string().required(),
    STATIC_TOKEN: Joi.string().required(),

    EMAIL_ADDRESS: Joi.string().email().required(),
    EMAIL_PASSWORD: Joi.string().required(),
    CLIENT_URL: Joi.string().uri().required(),
    SENDGRID_API_KEY: Joi.string().required(),
    GMAIL_USER: Joi.string().email().required(),
    GMAIL_PASS: Joi.string().required(),
    GMAIL_SERVICE: Joi.string().default('gmail'),
    SMTP_FROM: Joi.string().email().required(),
    EMAIL_PROVIDER: Joi.string().valid('gmail', 'sendgrid', 'mailchimp').required(),
    CORS_ORIGIN: Joi.string().uri().required(),
    CORS_METHODS: Joi.string().required(),
    CORS_CREDENTIALS: Joi.boolean().default(true),
    CORS_ALLOWED_HEADERS: Joi.string().required(),

    TWILIO_ACCOUNT_SID: Joi.string().required(),
    TWILIO_AUTH_TOKEN: Joi.string().required(),
    TWILIO_PHONE_NUMBER: Joi.string().required(),

    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().default(6379),
    CACHE_TTL: Joi.number().default(600),

    DATA_DIR: Joi.string().required(),
    GLOBAL_PRESET: Joi.string().required(),
    SUPER_ADMIN_PASSWORD: Joi.string().required(),

    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
});
