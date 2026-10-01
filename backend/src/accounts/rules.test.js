const {
  DEFAULT_ADMIN_EMAIL,
  validatePassword,
  validateName,
  isEmail,
  isProtectedAccount,
  canDeleteAccount,
  signupKind,
} = require('./rules');

describe('validatePassword', () => {
  test('rejects a 7 character password', () => {
    expect(validatePassword('1234567')).toBe('Password must be at least 8 characters.');
  });

  test('accepts an 8 character password', () => {
    expect(validatePassword('12345678')).toBeNull();
  });

  test('rejects a non-string password', () => {
    expect(validatePassword(12345678)).not.toBeNull();
    expect(validatePassword(undefined)).not.toBeNull();
  });
});

describe('validateName', () => {
  test('rejects an empty or blank name', () => {
    expect(validateName('   ')).toBe('Name is required.');
    expect(validateName(undefined)).toBe('Name is required.');
  });

  test('rejects a name longer than 80 characters', () => {
    expect(validateName('a'.repeat(81))).toBe('Name must be at most 80 characters.');
  });

  test('accepts a normal name', () => {
    expect(validateName(' Léa Martin ')).toBeNull();
  });
});

describe('isEmail', () => {
  test('accepts a simple address', () => {
    expect(isEmail('sam@devgoblin.fr')).toBe(true);
  });

  test('rejects text without @ or domain dot', () => {
    expect(isEmail('sam')).toBe(false);
    expect(isEmail('sam@devgoblin')).toBe(false);
    expect(isEmail(undefined)).toBe(false);
  });

  test('rejects a domain with an empty label', () => {
    expect(isEmail('sam@devgoblin..fr')).toBe(false);
  });
});

describe('canDeleteAccount', () => {
  test('refuses deleting yourself', () => {
    expect(canDeleteAccount({ actorId: 1, target: { id: 1, role: 'admin' }, adminCount: 3 })).toBe('CANNOT_DELETE_SELF');
  });

  test('refuses deleting the last admin', () => {
    expect(canDeleteAccount({ actorId: 9, target: { id: 1, role: 'admin' }, adminCount: 1 })).toBe('LAST_ADMIN');
  });

  test('allows deleting another admin when two exist', () => {
    expect(canDeleteAccount({ actorId: 1, target: { id: 2, role: 'admin' }, adminCount: 2 })).toBeNull();
  });

  test('refuses deleting the protected default admin', () => {
    const target = { id: 1, role: 'admin', email: DEFAULT_ADMIN_EMAIL };
    expect(canDeleteAccount({ actorId: 2, target, adminCount: 2 })).toBe('PROTECTED_ACCOUNT');
  });

  test('allows deleting a student', () => {
    expect(canDeleteAccount({ actorId: 1, target: { id: 5, role: 'student' }, adminCount: 1 })).toBeNull();
  });
});

describe('signupKind', () => {
  test('a known user with a password logs in', () => {
    expect(signupKind('lea.martin@epitech.eu', { role: 'student', passwordHash: 'scrypt$x$y' })).toBe('login');
    expect(signupKind('sam@devgoblin.fr', { role: 'admin', passwordHash: 'scrypt$x$y' })).toBe('login');
  });

  test('a legacy student without a password signs up', () => {
    expect(signupKind('lea.martin@epitech.eu', { role: 'student', passwordHash: null })).toBe('signup');
  });

  test('an unknown Epitech email signs up', () => {
    expect(signupKind('lea.martin@epitech.eu', null)).toBe('signup');
  });

  test('an unknown non-Epitech email is forbidden', () => {
    expect(signupKind('lea@gmail.com', null)).toBe('forbidden');
    expect(signupKind('', null)).toBe('forbidden');
  });

  test('an admin without a password is forbidden', () => {
    expect(signupKind('admin@devgoblin.fr', { role: 'admin', passwordHash: null })).toBe('forbidden');
  });
});

describe('isProtectedAccount', () => {
  test('the default admin is protected', () => {
    expect(isProtectedAccount({ email: 'admin@devgoblin.fr' })).toBe(true);
  });

  test('any other account is not protected', () => {
    expect(isProtectedAccount({ email: 'sam@devgoblin.fr' })).toBe(false);
    expect(isProtectedAccount(null)).toBe(false);
  });
});
