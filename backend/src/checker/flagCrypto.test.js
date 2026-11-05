const { normalizeId, makeId, makeKey, makeFlag, formatId, formatPair, verifyFlag } = require('./flagCrypto');

// Fixed vector, computed by the reference tool admin/flagtool.py and the student's check.sh.
const SECRET = 'test-secret';
const SLUG = 'git-workshop';
const LOGIN = 'prenom.nom@epitech.eu';
const ID = '23696B464285';
const KEY = '33b5f0a3402d3bca79b7d899704395ca';
const FLAG_02 = 'EPI{9ec814dfadafb4df}';

describe('flag scheme', () => {
  it('derives the identification code', () => {
    expect(formatId(makeId(SECRET, SLUG, LOGIN))).toBe('2369-6B46-4285');
  });

  it('ignores the case and the spaces of the login', () => {
    expect(makeId(SECRET, SLUG, '  Prenom.Nom@Epitech.EU ')).toBe(ID);
  });

  it('derives the pairing code', () => {
    expect(formatPair(makeKey(SECRET, ID))).toBe('33b5f0a3-402d3bca-79b7d899-704395ca');
  });

  it('derives the pairing code from an id written with dashes and lowercase', () => {
    expect(makeKey(SECRET, '2369-6b46-4285')).toBe(KEY);
  });

  it('derives the flag of an exercise', () => {
    expect(makeFlag(KEY, SLUG, '02')).toBe(FLAG_02);
  });

  it('gives a different flag to each exercise', () => {
    expect(makeFlag(KEY, SLUG, '01')).not.toBe(FLAG_02);
  });

  it('gives a different id to each login', () => {
    expect(makeId(SECRET, SLUG, 'autre.nom@epitech.eu')).not.toBe(ID);
  });

  it('normalizes a code typed by hand', () => {
    expect(normalizeId(' 2369-6b46 4285 ')).toBe(ID);
  });
});

describe('verifyFlag', () => {
  it('accepts the flag of the student', () => {
    expect(verifyFlag(SECRET, SLUG, LOGIN, '02', FLAG_02)).toBe(true);
  });

  it('accepts a flag pasted with surrounding spaces', () => {
    expect(verifyFlag(SECRET, SLUG, LOGIN, '02', `  ${FLAG_02}\n`)).toBe(true);
  });

  it('rejects the flag of another exercise', () => {
    expect(verifyFlag(SECRET, SLUG, LOGIN, '01', FLAG_02)).toBe(false);
  });

  it('rejects the flag of another student', () => {
    expect(verifyFlag(SECRET, SLUG, 'autre.nom@epitech.eu', '02', FLAG_02)).toBe(false);
  });

  it('rejects an empty or missing flag', () => {
    expect(verifyFlag(SECRET, SLUG, LOGIN, '02', '')).toBe(false);
    expect(verifyFlag(SECRET, SLUG, LOGIN, '02', undefined)).toBe(false);
  });

  it('rejects a flag of a different length', () => {
    expect(verifyFlag(SECRET, SLUG, LOGIN, '02', 'EPI{9ec814dfadafb4d}')).toBe(false);
  });
});
