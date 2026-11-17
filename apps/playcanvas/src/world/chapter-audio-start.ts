/** Call directly in the click/tap handler, before awaiting any other context. */
// Cold Windows audio-device startup measured close to two seconds and once
// exceeded the old 2.5 s deadline. Keep a bounded retry without rejecting it early.
export function resumeChapterAudio(context: AudioContext, timeoutMs = 8000): Promise<void> {
  const request = context.resume();
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Sound could not start. Select Enable sound and begin to try again.')), timeoutMs);
    request.then(() => {
      window.clearTimeout(timer);
      if (context.state === 'running') resolve();
      else reject(new Error('Sound is not ready. Select Enable sound and begin to try again.'));
    }, error => { window.clearTimeout(timer); reject(error); });
  });
}
