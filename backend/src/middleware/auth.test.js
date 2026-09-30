jest.mock('../accounts/accounts', () => ({ findSessionByToken: jest.fn() }));

const { findSessionByToken } = require('../accounts/accounts');
const { attachUser, requireAdmin, requireUser } = require('./auth');

function mockReq(headers = {}) {
  return { header: (name) => headers[name.toLowerCase()] };
}

describe('attachUser', () => {
  beforeEach(() => findSessionByToken.mockReset());

  test('sets no user when there is no Authorization header', async () => {
    const req = mockReq();
    const next = jest.fn();
    await attachUser(req, {}, next);
    expect(findSessionByToken).not.toHaveBeenCalled();
    expect(req.user).toBeNull();
    expect(req.sessionId).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  test('ignores a header that is not a Bearer token', async () => {
    const req = mockReq({ authorization: 'Basic abc' });
    await attachUser(req, {}, jest.fn());
    expect(findSessionByToken).not.toHaveBeenCalled();
    expect(req.user).toBeNull();
  });

  test('sets no user for an unknown token', async () => {
    findSessionByToken.mockResolvedValue(null);
    const req = mockReq({ authorization: 'Bearer unknown' });
    const next = jest.fn();
    await attachUser(req, {}, next);
    expect(findSessionByToken).toHaveBeenCalledWith(expect.anything(), 'unknown');
    expect(req.user).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  test('sets the user and session id for a valid token', async () => {
    const user = { id: 3, name: 'Alice Martin', email: 'alice.martin@epitech.eu', role: 'student' };
    findSessionByToken.mockResolvedValue({ sessionId: 42, user });
    const req = mockReq({ authorization: 'Bearer good-token' });
    await attachUser(req, {}, jest.fn());
    expect(req.user).toEqual(user);
    expect(req.sessionId).toBe(42);
  });
});

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('auth middleware', () => {
  test('requireAdmin rejects a student with 403', () => {
    const req = { user: { id: 2, role: 'student' } };
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAdmin allows an admin through', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('requireUser rejects when no user is attached', () => {
    const req = { user: null };
    const res = mockRes();
    const next = jest.fn();
    requireUser(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('requireUser allows any logged-in user through', () => {
    const req = { user: { id: 3, role: 'student' } };
    const res = mockRes();
    const next = jest.fn();
    requireUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
