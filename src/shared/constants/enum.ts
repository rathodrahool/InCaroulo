export enum UserStatus {
    BLOCKED = 'blocked',
    PENDING = 'pending',
    SUSPENDED = 'suspended',
    VERIFIED = 'verified',
    UNVERIFIED = 'unverified',
    DEACTIVATED = 'deactivated',
}

export enum DefaultStatus {
    ACTIVE = 'active',
    IN_ACTIVE = 'inactive',
}

export enum VerificationType {
    SIGNUP = 'signup',
    VERIFY = 'verify',
    LOGIN = 'login',
    FORGOT_PASSWORD = 'forgot_password',
    UPDATE_EMAIL = 'update_email',
    UPDATE_PHONE = 'update_phone',
    SOCIAL_AUTH = 'social_auth',
}

export enum ActivityType {
    SIGNUP = 'signup',
    SIGNUP_VERIFICATION = 'signup_verification',
    LOGIN = 'login',
    LOGOUT = 'logout',
    RESET_PASSWORD = 'reset_password',
    FORGOT_PASSWORD = 'forgot_password',
    UPDATE_PROFILE = 'update_profile',
    UPDATE_EMAIL = 'update_email',
    UPDATE_PHONE = 'update_phone',
    SOCIAL_AUTH = 'social_auth',
    VERIFY_EMAIL_UPDATE = 'verify_email_update',
    VERIFY_PHONE_UPDATE = 'verify_phone_update',
    DELETE_ACCOUNT = 'delete_account',
    VIEW_PROFILE = 'view_profile',
}
export enum DeviceType {
    IOS = 'ios',
    ANDROID = 'android',
    WEB = 'web',
}

export enum MediaFolder {
    default = 'default',
    task = 'task',
    assets = 'assets',
}

export enum CacheDuration {
    ONE_MINUTE = 60,
    FIVE_MINUTES = 300,
    TEN_MINUTES = 600,
}

export enum MailProvider {
    GMAIL = 'gmail',
    SENDGRID = 'sendgrid',
}

export enum FileConfig {
    DEFAULT = 'default',
}

export enum DefaultImage {
    user = 'user.png',
}
export enum BlockReasonEnum {
    USER_DELETED_ACCOUNT = 'user_deleted_account',
    INACTIVE = 'inactive',
    SUSPICIOUS_ACTIVITY = 'suspicious_activity',
    TERMS_VIOLATION = 'terms_violation',
}

export enum expiryTimeEnum {
    TWO_MIN = 2,
    FIVE_MIN = 5,
    TEN_MIN = 10,
    ONE_HOUR = 60,
    FIVE_HOUR = 300,
    TEN_DAY = 14400, // 10 days in minutes
    THIRTY_DAY = 43200, // 30 days in minutes
}

export enum TokenTypeEnum {
    ACCESS = 'access',
    REFRESH = 'refresh',
    RESET = 'reset',
    VERIFY = 'verify',
}

export enum AuthEndpoints {
    ForgotPassword = 'http://localhost:3400/auth/forgot-password/',
    VerifySignup = 'http://localhost:3400/auth/verify-signup/',
}
export enum ENVIRONMENT {
    development = 'development',
    production = 'production',
    local = 'local',
}
