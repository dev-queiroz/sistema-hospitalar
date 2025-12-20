export const AUTH_ERRORS = {
    INVALID_CREDENTIALS: 'Credenciais inválidas ou usuário inativo',
    USER_NOT_FOUND: 'Usuário não encontrado ou inativo',
    ADMIN_EXISTS: 'Já existe um administrador registrado',
    DUPLICATE_USER: 'Email, CPF ou CNS já cadastrado',
    INVALID_ADMIN_SECRET: 'Senha especial inválida',
    PASSWORD_RESET_FAILED: 'Erro ao enviar email de recuperação',
    USER_CREATION_FAILED: 'Erro ao criar usuário',
    ADMIN_CREATION_FAILED: 'Erro ao criar administrador',
    INVALID_TOKEN: 'Token inválido ou expirado',
    PASSWORD_MISMATCH: 'As senhas não conferem',
    PASSWORD_TOO_WEAK: 'A senha não atende aos requisitos de segurança',
    INVALID_EMAIL: 'Email inválido',
    EMAIL_ALREADY_EXISTS: 'Este email já está em uso',
    CPF_ALREADY_EXISTS: 'Este CPF já está cadastrado',
    CNS_ALREADY_EXISTS: 'Este CNS já está cadastrado',
    TOO_MANY_ATTEMPTS: 'Muitas tentativas de login. Tente novamente mais tarde.',
    ACCOUNT_LOCKED: 'Sua conta foi bloqueada temporariamente devido a muitas tentativas de login. Tente novamente em 15 minutos.',
};

export const AUTH_MESSAGES = {
    LOGIN_SUCCESS: 'Login realizado com sucesso',
    REGISTRATION_SUCCESS: 'Cadastro realizado com sucesso',
    PASSWORD_RESET_SENT: 'Se o email existir, você receberá um link de recuperação',
    PASSWORD_RESET_SUCCESS: 'Senha redefinida com sucesso',
    LOGOUT_SUCCESS: 'Logout realizado com sucesso',
    TOKEN_REFRESHED: 'Token atualizado com sucesso',
    ACCOUNT_VERIFIED: 'Conta verificada com sucesso',
};

export const TOKEN_CONFIG = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    RESET_TOKEN_EXPIRY: '1h',
};

export const RATE_LIMIT = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000,
    ATTEMPTS_WINDOW: 60 * 60 * 1000,
};