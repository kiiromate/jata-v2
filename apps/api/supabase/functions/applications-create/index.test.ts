import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createClient, SupabaseClient, UserResponse, AuthError, PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { corsMiddleware } from '../_shared/cors';
import handler from './index';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('../_shared/cors', () => ({
  corsMiddleware: jest.fn((req: Request, res: Response, next: NextFunction) => next()),
}));

// Define a more specific mock type for the Supabase client
type MockSupabaseClient = SupabaseClient & {
  auth: {
    getUser: jest.Mock<() => Promise<UserResponse>>;
  };
  from: jest.Mock<any>;
};

const mockCreateClient = createClient as jest.Mock;
const mockCorsMiddleware = corsMiddleware as jest.Mock;

// Mock environment variables
process.env.SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.SUPABASE_ANON_KEY = 'mock-anon-key';

// Helper function to create mock Express request
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  method: 'POST',
  headers: {
    authorization: 'Bearer mock-token',
    ...overrides.headers,
  },
  body: {
    title: 'Software Engineer',
    company: 'Tech Corp',
    status: 'Applied',
    date_applied: '2023-01-01',
    url: 'https://example.com/job/1',
    ...overrides.body,
  },
  ...overrides,
});

// Helper function to create mock Express response
const createMockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn<Response['status']>().mockReturnThis();
  res.json = jest.fn<Response['json']>().mockReturnThis();
  res.send = jest.fn<Response['send']>().mockReturnThis();
  res.header = jest.fn<Response['header']>().mockReturnThis();
  return res as Response;
};

describe('Application Create Handler', () => {
  let req: Partial<Request>;
  let res: Response;
  let next: NextFunction;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();

    const mockGetUser = jest.fn<() => Promise<UserResponse>>().mockResolvedValue({
      data: { user: { id: 'user-123' } as any }, // Using `as any` to bypass strict type checking for the mock
      error: null,
    });

    const mockAuth = {
      getUser: mockGetUser,
    };

    const mockSingle = jest.fn<() => Promise<PostgrestSingleResponse<any>>>().mockResolvedValue({
      data: { id: 'app-123', ...req.body, user_id: 'user-123' },
      error: null,
      status: 201,
      statusText: 'Created',
      count: 1,
    });

    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    });

    const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

    mockSupabase = { auth: mockAuth, from: mockFrom } as unknown as MockSupabaseClient;
    mockCreateClient.mockReturnValue(mockSupabase);
  });

  it('should create a new application for an authenticated user', async () => {
    await handler(req as Request, res, next);

    expect(mockCorsMiddleware).toHaveBeenCalled();
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    expect(mockSupabase.from).toHaveBeenCalledWith('applications');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.any(String),
      title: 'Software Engineer',
    }));
  });

  it('should return 401 for unauthenticated requests', async () => {
    const authError = new AuthError('Unauthorized');
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: authError });

    await handler(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 400 for invalid request body', async () => {
    req.body = { invalid: 'data' };

    await handler(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid request body' }));
  });

  it('should handle database errors', async () => {
    const dbError: PostgrestError = {
      message: 'Database error',
      details: 'Something went wrong',
      hint: 'Check logs',
      code: '500',
      name: 'PostgrestError',
    };
    const mockSingle = jest.fn<() => Promise<PostgrestSingleResponse<any>>>().mockResolvedValue({ 
      data: null, 
      error: dbError,
      status: 500,
      statusText: 'Internal Server Error',
      count: null,
    });
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({ single: mockSingle }),
    });
    mockSupabase.from.mockReturnValue({ insert: mockInsert });

    await handler(req as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Database error', details: dbError.message });
  });

  it('should handle CORS preflight requests', async () => {
    req.method = 'OPTIONS';

    await handler(req as Request, res, next);

    expect(mockCorsMiddleware).toHaveBeenCalled();
  });
});
