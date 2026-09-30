const { AccountError } = require('../accounts/accounts');

function sendAccountError(res, err) {
  if (!(err instanceof AccountError)) throw err;
  res.status(err.status).json({ error: { code: err.code, message: err.message } });
}

module.exports = { sendAccountError };
