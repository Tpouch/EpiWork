const { checkFields } = require('./checkFields');

describe('checkFields', () => {
  it('keeps only the provided fields', () => {
    expect(checkFields({ title: 'New' })).toEqual({ data: { title: 'New' } });
  });

  it('clears every check field when the type is removed', () => {
    expect(checkFields({ questionType: null }).data).toEqual({
      questionType: null,
      questionPrompt: null,
      questionOptions: null,
      questionAnswer: null,
      questionFeedback: null,
      flagExoId: null,
    });
  });

  it('rejects an unknown type', () => {
    expect(checkFields({ questionType: 'essay' })).toEqual({ error: 'Unknown check type.' });
  });

  it('stores QCM choices as JSON', () => {
    const { data } = checkFields({ questionType: 'qcm', questionPrompt: 'Which?', questionOptions: ['a', 'b'], questionAnswer: 'b' });
    expect(data.questionOptions).toBe('["a","b"]');
  });

  it('rejects a QCM with fewer than two choices', () => {
    expect(checkFields({ questionType: 'qcm', questionPrompt: 'Which?', questionOptions: ['a'], questionAnswer: 'a' }).error)
      .toBe('A QCM needs at least two choices.');
  });

  it('rejects a QCM whose right answer is not one of the choices', () => {
    expect(checkFields({ questionType: 'qcm', questionPrompt: 'Which?', questionOptions: ['a', 'b'], questionAnswer: 'c' }).error)
      .toBe('Mark one of the choices as the right answer.');
  });

  it('rejects a question without a prompt', () => {
    expect(checkFields({ questionType: 'question', questionPrompt: ' ' }).error).toBe('Write the question.');
  });

  it('rejects an empty title', () => {
    expect(checkFields({ title: '  ' }).error).toBe('Title cannot be empty.');
  });

  it('accepts a flag step with an exercise id', () => {
    const { data } = checkFields({ questionType: 'flag', flagExoId: '02' });
    expect(data).toEqual({ questionType: 'flag', flagExoId: '02' });
  });

  it('does not ask for a question on a flag step', () => {
    expect(checkFields({ questionType: 'flag', flagExoId: '02' })).not.toHaveProperty('error');
  });

  it('rejects a flag step without exercise id', () => {
    expect(checkFields({ questionType: 'flag' })).toHaveProperty('error');
    expect(checkFields({ questionType: 'flag', flagExoId: '  ' })).toHaveProperty('error');
  });

  it('rejects an exercise id with the separator used by the flag scheme', () => {
    expect(checkFields({ questionType: 'flag', flagExoId: '0|2' })).toHaveProperty('error');
  });
});
