// Hash-based router. The app deploys as a static bundle with no SPA rewrite
// rule, so path-based routing would 404 on refresh or on a cold deep link.
//
//   #/month/2026-09   month view, that month selected
//   #/month/2026-09?d=2026-09-14   ...and scroll to that date's week
//   #/recurring
//   #/goals
//
// Modals are not routes, but each open modal owns a history entry so the
// Android/PWA back gesture dismisses it instead of leaving the app.

const VIEWS = ['month', 'recurring', 'goals'];

function pad(n) {
  return String(n).padStart(2, '0');
}

class Router {
  constructor() {
    const now = new Date();
    this.view = $state('month');
    this.month = $state(now.getMonth());
    this.year = $state(now.getFullYear());

    // Set when a route asks the month view to scroll to a particular date
    // (search results, mainly). Consumed once, then cleared.
    this.pendingDate = $state(null);

    // Modal stack, innermost last. Entries are { token, name, onClose }.
    this.modals = [];
    this.modalToken = 0;
    // Set while we unwind our own history entry, so handlePop can tell that
    // pop apart from a real back gesture.
    this.ignoreNextPop = false;

    this.started = false;
  }

  /** Reads the hash into state. Returns false if the hash was unusable. */
  parse(hash) {
    const raw = (hash || '').replace(/^#\/?/, '');
    if (!raw) return false;

    const [path, queryString] = raw.split('?');
    const [view, arg] = path.split('/');
    if (!VIEWS.includes(view)) return false;

    if (view === 'month') {
      const match = /^(\d{4})-(\d{2})$/.exec(arg || '');
      if (!match) return false;
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      if (month < 0 || month > 11) return false;
      this.year = year;
      this.month = month;

      const date = new URLSearchParams(queryString || '').get('d');
      this.pendingDate = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : null;
    } else {
      this.pendingDate = null;
    }

    this.view = view;
    return true;
  }

  /** Builds the hash for the current state. */
  hash({ date = null } = {}) {
    if (this.view !== 'month') return `#/${this.view}`;
    const base = `#/month/${this.year}-${pad(this.month + 1)}`;
    return date ? `${base}?d=${date}` : base;
  }

  /**
   * Navigates. `replace` avoids piling up history entries for repeated moves
   * of the same kind — month arrows use it so eight taps forward don't cost
   * eight back presses to undo.
   */
  go(view, { month, year, date = null, dateInUrl = true, replace = false } = {}) {
    if (!VIEWS.includes(view)) return;

    // Navigating supersedes any open modal. Close it here rather than letting
    // the component wind history back itself: history.back() is async and
    // would race the pushState below. Instead the modal's entry is *reused*
    // for the new route, so back lands on whatever preceded the modal.
    if (this.closeAllModals() > 0) replace = true;

    const viewChanged = view !== this.view;
    this.view = view;
    if (view === 'month') {
      if (typeof year === 'number') this.year = year;
      if (typeof month === 'number') this.month = month;
      this.pendingDate = date;
    } else {
      this.pendingDate = null;
    }

    const url = this.hash({ date: dateInUrl ? date : null });
    if (replace) history.replaceState({ view }, '', url);
    else history.pushState({ view }, '', url);

    if (viewChanged) this.resetScroll();
  }

  /**
   * A new screen starts at the top. A pending date still wins: the month view
   * scrolls to it after mounting, which happens after this.
   */
  resetScroll() {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  /** Jumps to the month containing `dateStr` (YYYY-MM-DD) and scrolls to it. */
  goToDate(dateStr) {
    const [year, month] = dateStr.split('-').map(Number);
    this.go('month', { year, month: month - 1, date: dateStr });
  }

  /**
   * Jumps to the current month and scrolls to this week. The date stays out of
   * the URL: "today" is a moving target, not something worth linking to.
   */
  goToToday({ replace = false } = {}) {
    const now = new Date();
    this.go('month', {
      year: now.getFullYear(),
      month: now.getMonth(),
      date: now.toLocaleDateString('en-CA'),
      dateInUrl: false,
      replace,
    });
  }

  /** Called by the month view once it has acted on `pendingDate`. */
  consumePendingDate() {
    const date = this.pendingDate;
    this.pendingDate = null;
    return date;
  }

  // ── Modals ──
  // Each open modal owns a history entry, so the Android/PWA back gesture
  // dismisses it instead of leaving the app. Entries are identified by token
  // so a component can tell whether its entry is still on the stack.

  openModal(name, onClose) {
    const token = ++this.modalToken;
    this.modals.push({ token, name, onClose });
    history.pushState({ modal: token }, '', location.hash);
    return token;
  }

  isModalOpen(token) {
    return this.modals.some((m) => m.token === token);
  }

  /**
   * Closes a modal that was dismissed through the UI (Cancel, backdrop,
   * Escape). Its history entry is still there, so wind it back — which fires
   * popstate, but `handlePop` finds the entry already gone and ignores it.
   */
  closeModal(token) {
    const index = this.modals.findIndex((m) => m.token === token);
    if (index === -1) return;
    this.modals.splice(index, 1);
    // Our entry is still in history, so wind it back. The resulting popstate
    // is ours, not the user's, hence the flag.
    this.ignoreNextPop = true;
    history.back();
  }

  /** Closes every open modal, innermost first. Returns how many there were. */
  closeAllModals() {
    const entries = this.modals.splice(0, this.modals.length);
    for (const entry of entries.reverse()) entry.onClose?.();
    return entries.length;
  }

  handlePop = () => {
    if (this.ignoreNextPop) {
      this.ignoreNextPop = false;
      return;
    }

    // A modal is open: the browser just dropped its entry, so consume the pop
    // by closing that modal and stay on the current route.
    const entry = this.modals.pop();
    if (entry) {
      entry.onClose?.();
      return;
    }

    const previousView = this.view;
    if (!this.parse(location.hash)) this.goToToday({ replace: true });
    else if (this.view !== previousView) this.resetScroll();
  };

  start() {
    if (this.started) return;
    this.started = true;

    // We decide where each screen scrolls to (top, or a pending date). Left on
    // 'auto', the browser restores the old position after back/forward and
    // overrides that.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    if (!this.parse(location.hash)) {
      // No hash, or garbage: normalize to today's month without adding an
      // entry, so the first back press leaves the app rather than looping.
      const now = new Date();
      this.view = 'month';
      this.year = now.getFullYear();
      this.month = now.getMonth();
      this.pendingDate = null;
      history.replaceState({ view: 'month' }, '', this.hash());
    } else {
      history.replaceState({ view: this.view }, '', location.hash);
    }

    window.addEventListener('popstate', this.handlePop);
  }

  stop() {
    window.removeEventListener('popstate', this.handlePop);
    this.started = false;
  }
}

export const router = new Router();

if (import.meta.env.DEV) {
  window.routerRef = router;
}
