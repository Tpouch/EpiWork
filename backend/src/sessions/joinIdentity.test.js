const {
  CODE_ALPHABET,
  generateJoinCode,
  normalizeJoinCode,
  normalizeEmail,
  nameFromEpitechEmail,
} = require('./joinIdentity');

describe('generateJoinCode', () => {
  test('returns 6 characters from the join code alphabet', () => {
    expect(generateJoinCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  test('uses the injected picker for every character', () => {
    expect(generateJoinCode(() => 0)).toBe('AAAAAA');
    expect(generateJoinCode(() => CODE_ALPHABET.length - 1)).toBe('999999');
  });

  test('never uses the ambiguous characters 0, O, 1 or I', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateJoinCode()).not.toMatch(/[0O1I]/);
    }
  });
});

describe('normalizeJoinCode', () => {
  test('trims and upper-cases a typed code', () => {
    expect(normalizeJoinCode(' 7f3k9q ')).toBe('7F3K9Q');
  });

  test('returns an empty string for a non-string', () => {
    expect(normalizeJoinCode(undefined)).toBe('');
  });
});

describe('normalizeEmail', () => {
  test('trims and lower-cases', () => {
    expect(normalizeEmail('  Maya.Lopez@EPITECH.EU ')).toBe('maya.lopez@epitech.eu');
  });
});

describe('nameFromEpitechEmail', () => {
  test('derives "Firstname Lastname"', () => {
    expect(nameFromEpitechEmail('maya.lopez@epitech.eu')).toBe('Maya Lopez');
  });

  test('accepts capitals and surrounding spaces', () => {
    expect(nameFromEpitechEmail('  Maya.Lopez@EPITECH.EU ')).toBe('Maya Lopez');
  });

  test('capitalizes each part of a hyphenated name', () => {
    expect(nameFromEpitechEmail('jean-pierre.dupont@epitech.eu')).toBe('Jean-Pierre Dupont');
  });

  test('rejects another domain', () => {
    expect(nameFromEpitechEmail('maya.lopez@epitech.digital')).toBeNull();
  });

  test('rejects an email without a firstname.lastname dot', () => {
    expect(nameFromEpitechEmail('maya@epitech.eu')).toBeNull();
  });

  test('rejects a non-string', () => {
    expect(nameFromEpitechEmail(null)).toBeNull();
  });
});
