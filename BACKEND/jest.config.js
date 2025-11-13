module.exports = {
    testEnvironment: "node",
    verbose: true,
    testTimeout: 30000,
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/**/*.test.js",
        "!src/config/**",
        "!src/migrations/**"
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js']
};
