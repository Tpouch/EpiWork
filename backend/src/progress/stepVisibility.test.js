const {
  participantStep,
  isRightQcmAnswer,
  qcmFailureOutcome,
  QCM_ALERT_AFTER,
} = require('./stepVisibility');

const step = {
  id: 7,
  title: 'Find the guilty commit',
  content: 'Use git log',
  hint: 'Look at my_strlen',
  solution: 'git revert 2dfa89d',
  questionType: 'qcm',
  questionOptions: JSON.stringify(['git reset', 'git revert']),
  questionAnswer: 'git revert',
};

describe('participantStep', () => {
  it('never exposes the QCM answer', () => {
    expect(participantStep(step, { solutionUnlocked: true })).not.toHaveProperty('questionAnswer');
  });

  it('hides a locked solution but says one exists', () => {
    const visible = participantStep(step);
    expect(visible.solution).toBeNull();
    expect(visible.hasSolution).toBe(true);
  });

  it('shows the solution once unlocked for the participant', () => {
    expect(participantStep(step, { solutionUnlocked: true }).solution).toBe('git revert 2dfa89d');
  });

  it('shows the solution once the session is over', () => {
    expect(participantStep(step, { sessionOver: true }).solution).toBe('git revert 2dfa89d');
  });

  it('reports no solution when the step has none', () => {
    const visible = participantStep({ ...step, solution: null });
    expect(visible.hasSolution).toBe(false);
    expect(visible.solution).toBeNull();
  });

  it('keeps the hint visible while the solution is locked', () => {
    expect(participantStep(step).hint).toBe('Look at my_strlen');
  });
});

describe('isRightQcmAnswer', () => {
  it('accepts the exact right choice', () => {
    expect(isRightQcmAnswer(step, 'git revert')).toBe(true);
  });

  it('rejects another choice', () => {
    expect(isRightQcmAnswer(step, 'git reset')).toBe(false);
  });

  it('rejects a missing answer', () => {
    expect(isRightQcmAnswer(step, null)).toBe(false);
  });

  it('rejects any answer on a step that is not a QCM', () => {
    expect(isRightQcmAnswer({ ...step, questionType: 'question' }, 'git revert')).toBe(false);
  });
});

describe('qcmFailureOutcome', () => {
  it('does not alert on the first failure', () => {
    expect(qcmFailureOutcome(0)).toEqual({ failedAttempts: 1, alert: false });
  });

  it('alerts on the second failure', () => {
    expect(qcmFailureOutcome(1)).toEqual({ failedAttempts: QCM_ALERT_AFTER, alert: true });
  });

  it('does not alert again on later failures', () => {
    expect(qcmFailureOutcome(2)).toEqual({ failedAttempts: 3, alert: false });
  });
});
