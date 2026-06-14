/** Human-friendly join date for profile / designer cards. */
export function formatMemberSince(createdAt) {
  if (!createdAt) return 'Member since 2023';

  const joined = new Date(createdAt);
  const now = new Date();
  const days = Math.floor((now - joined) / (1000 * 60 * 60 * 24));

  if (days < 1) return 'Joined today';
  if (days < 7) return 'Joined this week';
  if (days < 30) return 'Joined this month';
  if (days < 365) {
    return `Joined ${joined.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
  }

  return `Member since ${joined.getFullYear()}`;
}

export function isNewMember(createdAt, withinDays = 30) {
  if (!createdAt) return false;
  const joined = new Date(createdAt);
  const days = (Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24);
  return days <= withinDays;
}
