const { requireAdmin, requireUser } = require('./auth');

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
