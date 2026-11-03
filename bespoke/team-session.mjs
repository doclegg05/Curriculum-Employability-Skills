// One browser can hold several teams over a week, but it keeps a single pending Send.
// That Send belongs to the lesson and code that made it: any other team session sees
// none, so its Send and note controls are never stuck on another team's request.
export function pendingForSession(pending, session) {
  if (!pending || typeof pending !== 'object' || !session) return null;
  return pending.lessonId === session.lessonId && pending.editCode === session.editCode ? pending : null;
}
