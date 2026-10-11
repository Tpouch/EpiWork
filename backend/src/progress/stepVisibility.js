const QCM_ALERT_AFTER = 2;
const DEFAULT_QCM_MESSAGE = 'Not quite.';

// Everything a participant may receive about a step: the QCM answer never leaves the
// server, and the solution only once the host unlocked it or the session is over.
function participantStep(step, { solutionUnlocked = false, sessionOver = false } = {}) {
  const { questionAnswer, solution, ...visible } = step;
  const hasSolution = Boolean(solution);
  const canSee = hasSolution && (solutionUnlocked || sessionOver);
  return { ...visible, solution: canSee ? solution : null, hasSolution };
}

function isRightQcmAnswer(step, answer) {
  return step.questionType === 'qcm' && typeof answer === 'string' && answer === step.questionAnswer;
}

// One alert when the count reaches the threshold; resolving it resets the count to 0.
function qcmFailureOutcome(previousFailures) {
  const failedAttempts = previousFailures + 1;
  return { failedAttempts, alert: failedAttempts === QCM_ALERT_AFTER };
}

module.exports = { participantStep, isRightQcmAnswer, qcmFailureOutcome, QCM_ALERT_AFTER, DEFAULT_QCM_MESSAGE };
