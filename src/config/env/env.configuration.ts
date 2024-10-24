export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        connection: process.env.DB_CONNECTION,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    staticToken: process.env.STATIC_TOKEN,
    mail: {
        service: process.env.SERVICE,
        address: process.env.EMAIL_ADDRESS,
        password: process.env.EMAIL_PASSWORD,
    },
    twilio: {
        sid: process.env.TWILIO_ACCOUNT_SID,
        token: process.env.TWILIO_AUTH_TOKEN,
        phone_number: process.env.TWILIO_PHONE_NUMBER,
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        ttl: process.env.CACHE_TTL,
    },
});
