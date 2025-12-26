const js = require('@eslint/js')
const tseslint = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const globals = require('globals')

module.exports = [
    // ========================
    // JavaScript (Node)
    // ========================
    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                ...globals.node
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-undef': 'off',
            'no-unused-vars': 'off'
        }
    },

    // ========================
    // TypeScript (Node)
    // ========================
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: process.cwd(),
                sourceType: 'module'
            },
            globals: {
                ...globals.node
            }
        },
        plugins: {
            '@typescript-eslint': tseslint
        },
        rules: {
            ...tseslint.configs.recommended.rules,

            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/await-thenable': 'off'
        }
    },

    {
        ignores: ['dist/**', 'node_modules/**']
    }
]
