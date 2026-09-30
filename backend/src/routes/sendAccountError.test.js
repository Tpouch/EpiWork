const { sendAccountError } = require('./sendAccountError');
const { AccountError } = require('../accounts/accounts');

function mockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('sendAccountError', () => {
  test('sends an AccountError with its status and code', () => {
    const res = mockRes();
    sendAccountError(res, new AccountError(400, 'INVALID_NAME', 'Name is required.'));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'INVALID_NAME', message: 'Name is required.' } });
  });

  test('turns a unique email race (Prisma P2002) into a 409 EMAIL_TAKEN', () => {
    const res = mockRes();
    sendAccountError(res, Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }));
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: { code: 'EMAIL_TAKEN', message: 'This email is already in use.' } });
  });

  test('rethrows any other error for the default handler', () => {
    expect(() => sendAccountError(mockRes(), new Error('boom'))).toThrow('boom');
  });
});
