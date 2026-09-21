// Force test environment BEFORE anything else loads
process.env.NODE_ENV = "test";

// FORCE the use of your 'appdb' database for tests
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/appdb?schema=public";

process.env.AUTH_MIDDLEWARE_ENABLED = "false";
process.env.JWT_SECRET = "test-jest-secret-key-12345";
process.env.GEMINI_API_KEY = "fake-key-for-tests";