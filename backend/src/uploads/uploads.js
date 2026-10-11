const crypto = require('node:crypto');

const EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const ALLOWED_TYPES = Object.keys(EXTENSIONS);
const MAX_BYTES = 5 * 1024 * 1024;
const NAME_PATTERN = /^[a-f0-9]{32}\.(png|jpg|webp|gif)$/;

// Random names only, so a stored name can never point outside the upload folder.
function newUploadName(contentType) {
  return `${crypto.randomBytes(16).toString('hex')}.${EXTENSIONS[contentType]}`;
}

function isUploadName(name) {
  return NAME_PATTERN.test(name);
}

function uploadError(contentType, size) {
  if (!ALLOWED_TYPES.includes(contentType)) return 'Only PNG, JPEG, WebP or GIF images can be uploaded.';
  if (!size) return 'The image is empty.';
  if (size > MAX_BYTES) return 'Images must be 5 MB or smaller.';
  return null;
}

module.exports = { ALLOWED_TYPES, MAX_BYTES, newUploadName, isUploadName, uploadError };
