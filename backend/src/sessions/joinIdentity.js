const { randomInt } = require('node:crypto');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const EPITECH_EMAIL = /^([a-z]+(?:-[a-z]+)*)\.([a-z]+(?:-[a-z]+)*)@epitech\.eu$/;

function generateJoinCode(pickIndex = (max) => randomInt(max)) {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[pickIndex(CODE_ALPHABET.length)];
  }
  return code;
}

function normalizeJoinCode(code) {
  return typeof code === 'string' ? code.trim().toUpperCase() : '';
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function capitalizeNamePart(part) {
  return part
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join('-');
}

function nameFromEpitechEmail(email) {
  const match = EPITECH_EMAIL.exec(normalizeEmail(email));
  if (!match) return null;
  return `${capitalizeNamePart(match[1])} ${capitalizeNamePart(match[2])}`;
}

module.exports = {
  CODE_ALPHABET,
  CODE_LENGTH,
  generateJoinCode,
  normalizeJoinCode,
  normalizeEmail,
  nameFromEpitechEmail,
};
