const { newToken, hashToken } = require('./tokens');

describe('tokens', () => {
  test('newToken returns 64 hex characters', () => {
    expect(newToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  test('newToken returns a different token each time', () => {
    expect(newToken()).not.toBe(newToken());
  });

  test('hashToken is deterministic and differs from the token', () => {
    const token = newToken();
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });
});
