const { markOpenEvents } = require('./sessionEvents');

function event(id, type, { studentId = 1, stepId = 10 } = {}) {
  return { id, type, studentId, stepId, createdAt: new Date(2026, 8, 30, 14, id) };
}

describe('markOpenEvents', () => {
  test('keeps a help request open until it is resolved', () => {
    const [help] = markOpenEvents([event(1, 'help_requested')]);
    expect(help).toMatchObject({ open: true, closedAt: null });
  });

  test('closes a help request at the time of the later resolve', () => {
    const events = [event(1, 'help_requested'), event(2, 'help_resolved')];
    const [help] = markOpenEvents(events);
    expect(help).toMatchObject({ open: false, closedAt: events[1].createdAt });
  });

  test('a help request made after a resolve is open again', () => {
    const result = markOpenEvents([event(1, 'help_requested'), event(2, 'help_resolved'), event(3, 'help_requested')]);
    expect(result[0].open).toBe(false);
    expect(result[2]).toMatchObject({ open: true, closedAt: null });
  });

  test('a resolve for another student or step does not close the request', () => {
    const result = markOpenEvents([
      event(1, 'help_requested'),
      event(2, 'help_resolved', { studentId: 2 }),
      event(3, 'help_resolved', { stepId: 11 }),
    ]);
    expect(result[0].open).toBe(true);
  });

  test('keeps a checkpoint open until the step is done', () => {
    const [checkpoint] = markOpenEvents([event(1, 'checkpoint_submitted')]);
    expect(checkpoint).toMatchObject({ open: true, closedAt: null });
  });

  test('closes a checkpoint when the same step is done', () => {
    const events = [event(1, 'checkpoint_submitted'), event(2, 'step_done')];
    const [checkpoint] = markOpenEvents(events);
    expect(checkpoint).toMatchObject({ open: false, closedAt: events[1].createdAt });
  });

  test('never marks joined, step_done or help_resolved as open', () => {
    const result = markOpenEvents([event(1, 'joined'), event(2, 'step_done'), event(3, 'help_resolved')]);
    expect(result.map((e) => e.open)).toEqual([false, false, false]);
    expect(result.map((e) => e.closedAt)).toEqual([null, null, null]);
  });
});
