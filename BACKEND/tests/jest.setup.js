// Global test setup
const { connectTestDB, disconnectTestDB, clearDB } = require('./utils/setup');

beforeAll(async () => {
    await connectTestDB();
});

afterAll(async () => {
    await disconnectTestDB();
});

beforeEach(async () => {
    await clearDB();
});