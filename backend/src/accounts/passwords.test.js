const { hashPassword, verifyPassword } = require('./passwords');

describe('passwords', () => {
  test('a hashed password verifies', async () => {
    const stored = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', stored)).toBe(true);
  });

  test('a wrong password does not verify', async () => {
    const stored = await hashPassword('correct horse');
    expect(await verifyPassword('wrong horse', stored)).toBe(false);
  });

  test('hashing the same password twice gives different values', async () => {
    expect(await hashPassword('same one')).not.toBe(await hashPassword('same one'));
  });

  test('the stored value uses the scrypt$salt$hash format', async () => {
    expect(await hashPassword('format me')).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  });

  test('a missing stored hash never verifies', async () => {
    expect(await verifyPassword('anything', null)).toBe(false);
  });

  test('a malformed stored hash never verifies', async () => {
    expect(await verifyPassword('anything', 'plain-text')).toBe(false);
    expect(await verifyPassword('anything', 'scrypt$abc$zz')).toBe(false);
  });

  test('a non-string password never verifies', async () => {
    const stored = await hashPassword('12345678');
    expect(await verifyPassword(12345678, stored)).toBe(false);
  });
});
