// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Set up environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';

// Mock Next.js server components
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
};

global.Headers = class Headers {
  constructor(init) {
    this.map = new Map(Object.entries(init || {}));
  }
  get(name) {
    return this.map.get(name);
  }
  set(name, value) {
    this.map.set(name, value);
  }
};

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    }),
  },
  NextRequest: class NextRequest {
    constructor(input, init) {
      this.url = input;
      this.method = init?.method || 'GET';
      this.headers = new Map();
    }
    json() {
      return Promise.resolve({});
    }
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock mongoose and mongodb to avoid ESM issues
jest.mock('mongoose', () => ({
  Schema: class MockSchema {
    constructor() {
      this.methods = {};
      this.statics = {};
    }
    pre() { return this; }
    post() { return this; }
    index() { return this; }
  },
  model: jest.fn((name) => {
    return class MockModel {
      static findOne = jest.fn();
      static find = jest.fn();
      static findById = jest.fn();
      static findByIdAndUpdate = jest.fn();
      static findByIdAndDelete = jest.fn();
      static create = jest.fn();
      static generateUniqueCode = jest.fn();
      static generateReferralCode = jest.fn();
      static calculatePurchasePoints = jest.fn();
      save = jest.fn();
    };
  }),
  models: {},
  connect: jest.fn(),
  connection: {
    readyState: 1,
    on: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

