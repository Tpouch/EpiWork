const { summarizeProgress } = require('./progressSummary');

describe('summarizeProgress', () => {
  test('reports a workshop with no steps as not finished', () => {
    expect(summarizeProgress([])).toEqual({ doneCount: 0, finished: false });
  });

  test('reports no progress when nothing is done', () => {
    expect(summarizeProgress(['available', 'locked', 'locked'])).toEqual({ doneCount: 0, finished: false });
  });

  test('counts only done steps while partway through', () => {
    expect(summarizeProgress(['done', 'pending_review', 'locked'])).toEqual({ doneCount: 1, finished: false });
  });

  test('marks the workshop finished when every step is done', () => {
    expect(summarizeProgress(['done', 'done', 'done'])).toEqual({ doneCount: 3, finished: true });
  });

  test('marks the workshop finished when only the last checkpoint awaits review', () => {
    expect(summarizeProgress(['done', 'done', 'pending_review'])).toEqual({ doneCount: 2, finished: true });
  });

  test('does not finish the workshop when an earlier step awaits review', () => {
    expect(summarizeProgress(['pending_review', 'done', 'done'])).toEqual({ doneCount: 2, finished: false });
  });
});
