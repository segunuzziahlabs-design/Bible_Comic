import { localDevelopment, playerAccount, shellLink } from '../product/account-runtime';
import '../product/game-account.css';
import { canReviewChapter } from '../product/chapter-access';

// This dependency must finish before any chapter's main() runs, including ?review.
if (!localDevelopment) {
  try {
    const player = await playerAccount();
    if (new URLSearchParams(location.search).has('review')) {
      const pages = ['valley.html','camp.html','challenge.html','preparation.html','duel.html','victory.html'];
      const chapter = pages.indexOf(location.pathname.split('/').at(-1)!);
      if (chapter >= 0 && !canReviewChapter(player.account.episode,chapter)) {
        location.replace(shellLink('chapters')); await new Promise<never>(()=>{});
      }
    }
    player.onIdentityChange(() => location.replace(shellLink('sign-in')));
    // Returning from another tab or the back-forward cache must re-read ownership/revision.
    window.addEventListener('pageshow', event => { if(event.persisted) location.reload(); });
    const nav = document.createElement('a'); nav.className = 'game-dashboard';
    nav.textContent = 'Dashboard'; nav.href = shellLink('dashboard');
    const header=document.querySelector('header');
    if(header){header.classList.add('with-game-account');(header.querySelector('.preview-nav')??header).append(nav);}
    else document.body.append(nav);
  } catch {
    location.replace(shellLink('sign-in'));
    // Prevent scene creation while navigation is pending, even on direct chapter URLs.
    await new Promise<never>(()=>{});
  }
}
export const checkpointSaved = () => localDevelopment ? 'Checkpoint saved locally' : 'Account checkpoint confirmed';
