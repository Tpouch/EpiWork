const { AccountError } = require('../accounts/accounts');

// P2002 = unique constraint. The services check emails first, but two
// simultaneous requests can both pass that check; the database has the last word.
const EMAIL_TAKEN = { code: 'EMAIL_TAKEN', message: 'This email is already in use.' };

function sendAccountError(res, err) {
  if (err?.code === 'P2002') return res.status(409).json({ error: EMAIL_TAKEN });
  if (!(err instanceof AccountError)) throw err;
  res.status(err.status).json({ error: { code: err.code, message: err.message } });
}

module.exports = { sendAccountError };
