// Runs before every test file (see vitest.config.js `test.setupFiles`) so
// modules that read these at import time (e.g. auth.controller.js's
// CLIENT_ORIGIN) see them before anything else loads.
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
process.env.NODE_ENV = process.env.NODE_ENV || "test";
