module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.spec.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    clearMocks: true,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Opcional, para configurações adicionais
    testTimeout: 10000, // Aumenta o timeout para testes com chamadas externas
};