// Steps arrive in workshop order; consecutive steps of the same section form one group.
export function groupBySection(steps) {
  const groups = [];
  steps.forEach((step, index) => {
    const key = step.section?.id ?? null;
    let group = groups.at(-1);
    if (!group || group.key !== key) {
      group = { key, title: step.section?.title ?? null, items: [] };
      groups.push(group);
    }
    group.items.push({ step, index });
  });
  return groups;
}

export function hasSections(steps) {
  return steps.some((step) => step.section);
}

export function positionLabel(steps, index) {
  const step = steps[index];
  if (!step.section) return `Step ${index + 1} of ${steps.length}`;
  const siblings = steps.filter((other) => other.section?.id === step.section.id);
  return `${step.section.title}, sub step ${siblings.indexOf(step) + 1} of ${siblings.length}`;
}

// Admin endpoints return sections separately; participant endpoints embed them.
export function withSections(workshop) {
  const byId = new Map(workshop.sections.map((section) => [section.id, section]));
  return {
    ...workshop,
    steps: workshop.steps.map((step) => ({
      ...step,
      section: byId.get(step.sectionId) ?? null,
      hasSolution: Boolean(step.solution),
    })),
  };
}
