const CHECKLIST_ITEMS = [
  {
    id: 'avatar',
    label: 'Add a profile photo',
    href: '/settings',
    check: (p) => Boolean(p?.avatar_url),
    weight: 20,
  },
  {
    id: 'bio',
    label: 'Write a short bio',
    href: '/settings',
    check: (p) => Boolean(p?.bio?.trim()),
    weight: 20,
  },
  {
    id: 'cover',
    label: 'Upload a cover photo',
    href: '/settings',
    check: (p) => Boolean(p?.cover_url),
    weight: 15,
  },
  {
    id: 'skills',
    label: 'Add your skills or tools',
    href: '/settings',
    check: (p) => (p?.skills?.length > 0) || (p?.tools?.length > 0),
    weight: 15,
  },
  {
    id: 'location',
    label: 'Set your location',
    href: '/settings',
    check: (p) => Boolean(p?.location?.trim()),
    weight: 10,
  },
  {
    id: 'project',
    label: 'Publish your first project',
    href: '/projects/new',
    check: (p) => (p?.projects_count || 0) > 0,
    weight: 20,
  },
];

export function getProfileCompleteness(profile) {
  const items = CHECKLIST_ITEMS.map((item) => ({
    ...item,
    done: item.check(profile),
  }));

  const percent = items.reduce(
    (sum, item) => sum + (item.done ? item.weight : 0),
    0
  );

  return {
    percent,
    items,
    incomplete: items.filter((item) => !item.done),
    isComplete: percent >= 100,
  };
}

export function getNextProfileStep(profile) {
  const { incomplete } = getProfileCompleteness(profile);
  return incomplete[0] || null;
}
