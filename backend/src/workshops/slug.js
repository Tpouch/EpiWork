const SLUG_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 60;

// The slug is part of every flag: a blank value clears it, anything else must be a lowercase identifier.
function parseSlug(value) {
  if (value === null || (typeof value === 'string' && value.trim() === '')) return { slug: null };
  const slug = typeof value === 'string' ? value.trim() : '';
  if (slug.length > MAX_SLUG_LENGTH || !SLUG_SHAPE.test(slug)) {
    return { error: 'Slug must be lowercase letters, digits and dashes (e.g. git-workshop).' };
  }
  return { slug };
}

module.exports = { parseSlug };
