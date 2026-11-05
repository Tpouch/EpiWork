const { parseSlug } = require('./slug');

describe('parseSlug', () => {
  it('accepts a lowercase slug with dashes', () => {
    expect(parseSlug('git-workshop')).toEqual({ slug: 'git-workshop' });
  });

  it('trims the value', () => {
    expect(parseSlug('  git  ')).toEqual({ slug: 'git' });
  });

  it('turns a blank value or null into no slug', () => {
    expect(parseSlug('  ')).toEqual({ slug: null });
    expect(parseSlug(null)).toEqual({ slug: null });
  });

  it('rejects uppercase, spaces and the pipe used by the flag scheme', () => {
    expect(parseSlug('Git')).toHaveProperty('error');
    expect(parseSlug('git workshop')).toHaveProperty('error');
    expect(parseSlug('git|workshop')).toHaveProperty('error');
  });

  it('rejects dashes at the edges and doubled dashes', () => {
    expect(parseSlug('-git')).toHaveProperty('error');
    expect(parseSlug('git--workshop')).toHaveProperty('error');
  });

  it('rejects a value that is not text', () => {
    expect(parseSlug(42)).toHaveProperty('error');
  });

  it('rejects a slug that is too long', () => {
    expect(parseSlug('a'.repeat(61))).toHaveProperty('error');
  });
});
