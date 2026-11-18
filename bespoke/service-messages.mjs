// What a teacher reads when the shared service cannot help. Pure wording, no page access.
// The service's own text is written for its log; these say what is safe and what to do next.

export const SERVICE_DOWN = 'BeSpoke could not finish that just now. Your work is safe in this browser. Try again in a minute. If it keeps happening, tell Britt.';
export const SERVICE_UNREADABLE = 'Saving is not working right now. Your work is safe in this browser. Wait a minute and try again. If it keeps happening, tell Britt.';

/** The message to show for a service answer: outages get plain words, everything else passes through. */
export function teacherMessage(result) {
  if (result?.ok) return result.message;
  if (result?.error === 'store') return SERVICE_DOWN;
  if (result?.error === 'unreadable') return SERVICE_UNREADABLE;
  return result?.message;
}

/** A refused code. The service refuses a right code under the wrong lesson the same way, so name the lesson. */
export function wrongCodeMessage(lessonTitle) {
  return `That code does not open ${lessonTitle}. Check that Lesson is your team's lesson, then retype the 8-character code from your team's OneDrive folder.`;
}

/** A code this browser remembered that the service no longer accepts. */
export function staleCodeMessage() {
  return "This computer's team code no longer works. Type the current 8-character code from your team's OneDrive folder. Your work on this computer is kept.";
}
