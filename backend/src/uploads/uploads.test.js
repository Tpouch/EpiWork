const { newUploadName, isUploadName, uploadError, MAX_BYTES } = require('./uploads');

describe('uploads', () => {
  it('names a PNG with 32 hex characters and its extension', () => {
    expect(newUploadName('image/png')).toMatch(/^[a-f0-9]{32}\.png$/);
  });

  it('accepts generated names', () => {
    expect(isUploadName(newUploadName('image/webp'))).toBe(true);
  });

  it('rejects path traversal', () => {
    expect(isUploadName('../../etc/passwd')).toBe(false);
  });

  it('rejects a type that is not an image', () => {
    expect(uploadError('text/html', 10)).toBe('Only PNG, JPEG, WebP or GIF images can be uploaded.');
  });

  it('rejects an empty body', () => {
    expect(uploadError('image/png', 0)).toBe('The image is empty.');
  });

  it('rejects a file over 5 MB', () => {
    expect(uploadError('image/png', MAX_BYTES + 1)).toBe('Images must be 5 MB or smaller.');
  });

  it('accepts a small JPEG', () => {
    expect(uploadError('image/jpeg', 1000)).toBeNull();
  });
});
