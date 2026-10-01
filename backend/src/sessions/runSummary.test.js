const { summarizeRun } = require('./runSummary');

const steps = [
  { id: 1, title: 'Setup' },
  { id: 2, title: 'First commit' },
  { id: 3, title: 'Push' },
];
const at = (minute) => new Date(2026, 8, 29, 10, minute);
const launchedAt = at(0);
const endedAt = at(50);
const maya = { id: 7, name: 'Maya Lopez' };
const tom = { id: 8, name: 'Tom Martin' };

function joined(student, minute) {
  return { type: 'joined', createdAt: at(minute), studentId: student.id, stepId: null, student };
}
function done(student, stepId, minute) {
  return { type: 'step_done', createdAt: at(minute), studentId: student.id, stepId, student };
}
function summary(events, feedback = [], range = {}) {
  return summarizeRun({ steps, events, feedback, launchedAt, endedAt, ...range });
}

describe('summarizeRun', () => {
  test('lists students who joined inside the window, once each, in join order', () => {
    const { students } = summary([joined(tom, 1), joined(maya, 2), joined(tom, 3)]);
    expect(students.map((s) => s.name)).toEqual(['Tom Martin', 'Maya Lopez']);
  });

  test('ignores joins before the launch or after the end', () => {
    const { students } = summary([joined(maya, -5), joined(tom, 55)]);
    expect(students).toEqual([]);
  });

  test('a student who did the last step is finished', () => {
    const { students } = summary([joined(maya, 1), done(maya, 1, 5), done(maya, 2, 9), done(maya, 3, 20)]);
    expect(students[0].reached).toEqual({ finished: true, number: 3, title: 'Push' });
  });

  test('a student who stopped midway reached the next step', () => {
    const { students } = summary([joined(maya, 1), done(maya, 1, 5)]);
    expect(students[0].reached).toEqual({ finished: false, number: 2, title: 'First commit' });
  });

  test('a student who did nothing reached step 1', () => {
    const { students } = summary([joined(maya, 1)]);
    expect(students[0].reached).toEqual({ finished: false, number: 1, title: 'Setup' });
  });

  test('steps done after the end do not count', () => {
    const { students } = summary([joined(maya, 1), done(maya, 1, 5), done(maya, 2, 60)]);
    expect(students[0].reached.number).toBe(2);
  });

  test('steps done in an earlier run still count', () => {
    const { students } = summary([done(maya, 1, -30), done(maya, 2, -25), done(maya, 3, -20), joined(maya, 1)]);
    expect(students[0].reached.finished).toBe(true);
  });

  test('a live run has no end limit', () => {
    const { students } = summary([joined(maya, 1), done(maya, 1, 60)], [], { launchedAt, endedAt: null });
    expect(students[0].reached.number).toBe(2);
  });

  test('counts finished students and averages ratings to one decimal', () => {
    const events = [joined(maya, 1), done(maya, 3, 20), joined(tom, 2)];
    const feedback = [{ studentId: maya.id, rating: 4 }, { studentId: tom.id, rating: 5 }, { studentId: 99, rating: 4 }];
    const result = summary(events, feedback);
    expect(result).toMatchObject({ finishedCount: 1, ratingCount: 3, averageRating: 4.3 });
    expect(result.students.map((s) => s.rating)).toEqual([4, 5]);
  });

  test('average rating is null without feedback', () => {
    expect(summary([joined(maya, 1)]).averageRating).toBeNull();
  });

  test('a workshop with no steps left does not crash', () => {
    const result = summarizeRun({ steps: [], events: [joined(maya, 1)], feedback: [], launchedAt, endedAt });
    expect(result.students[0].reached).toEqual({ finished: false, number: null, title: null });
  });
});
