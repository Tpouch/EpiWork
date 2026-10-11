const CHECK_TYPES = ['checkpoint', 'question', 'qcm'];
const TEXT_FIELDS = ['title', 'content', 'hint', 'solution', 'questionPrompt', 'questionAnswer', 'questionFeedback'];
const CLEARED_CHECK = { questionPrompt: null, questionOptions: null, questionAnswer: null, questionFeedback: null };

function blankToNull(value) {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

function validateCheck(data) {
  const { questionType: type } = data;
  if (!CHECK_TYPES.includes(type)) return 'Unknown check type.';
  if (type !== 'checkpoint' && !data.questionPrompt) return 'Write the question.';
  if (type !== 'qcm') return null;
  const options = JSON.parse(data.questionOptions ?? '[]');
  if (options.length < 2) return 'A QCM needs at least two choices.';
  if (!options.includes(data.questionAnswer)) return 'Mark one of the choices as the right answer.';
  return null;
}

function textFields(body) {
  const data = {};
  for (const key of TEXT_FIELDS) {
    if (key in body) data[key] = key === 'content' ? String(body[key] ?? '') : blankToNull(body[key]);
  }
  return data;
}

function serializeOptions(value) {
  if (!Array.isArray(value)) return null;
  return JSON.stringify(value.map((o) => String(o).trim()).filter(Boolean));
}

// Partial update for autosave: only the keys present in the body are written.
function checkFields(body) {
  const data = textFields(body);
  if ('title' in data && !data.title) return { error: 'Title cannot be empty.' };
  if ('questionOptions' in body) data.questionOptions = serializeOptions(body.questionOptions);
  if (!('questionType' in body)) return { data };
  if (body.questionType === null) return { data: { ...data, questionType: null, ...CLEARED_CHECK } };
  data.questionType = body.questionType;
  const error = validateCheck(data);
  return error ? { error } : { data };
}

module.exports = { checkFields, CHECK_TYPES };
