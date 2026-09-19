<script>
  import { tick, untrack } from 'svelte';
  import gsap from 'gsap';
  import { router } from '/src/api/router.svelte.js';
  import { X } from 'lucide-svelte';

  let {
    open = $bindable(false),
    title = '',
    name = 'modal',
    // 'md' centred dialog (bottom sheet on mobile), 'palette' top-aligned
    // command palette, 'lg' wider dialog.
    size = 'md',
    showClose = true,
    // Fires when the user dismisses (backdrop, Escape, back gesture, drag).
    onClose,
    // Fires once the exit animation has finished and the modal is gone.
    // Clear any data the content renders here, not in onClose, or the sheet
    // empties out while it's still sliding away.
    onClosed,
    children,
  } = $props();

  // Rendered while open *and* while the exit animation plays. Animations are
  // driven here rather than by Svelte transitions, which are local and get
  // skipped whenever a parent block mounts or unmounts the modal.
  let mounted = $state(false);
  let overlayEl = $state();
  let dialogEl = $state();
  let triggerEl = null;
  let token = null;

  const widths = {
    md: 'sm:max-w-md',
    lg: 'sm:max-w-2xl',
    palette: 'sm:max-w-2xl',
  };

  const FOCUSABLE =
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

  const isDesktop = () => window.matchMedia('(min-width: 640px)').matches;
  const motion = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1);
  // Bottom sheet on phones; everything else is a dialog that rises into place.
  const isSheet = () => size !== 'palette' && !isDesktop();

  function close() {
    if (!open) return;
    open = false;
    onClose?.();
  }

  // Invoked by the router when the back gesture pops our history entry. The
  // entry is already gone by then, so we must not wind history back again.
  function closeFromPop() {
    if (!open) return;
    open = false;
    onClose?.();
  }

  // ── Animation ──

  async function show() {
    const fresh = !mounted;
    mounted = true;
    await tick();
    if (!overlayEl || !dialogEl) return;

    gsap.killTweensOf([overlayEl, dialogEl]);
    overlayEl.style.pointerEvents = '';
    const m = motion();

    if (fresh) {
      gsap.set(overlayEl, { opacity: 0 });
      gsap.set(dialogEl, isSheet() ? { y: dialogEl.offsetHeight, opacity: 1 } : { y: 24, opacity: 0 });
    }
    gsap.to(overlayEl, { opacity: 1, duration: 0.22 * m, ease: 'power2.out' });
    gsap.to(dialogEl, { y: 0, opacity: 1, duration: (isSheet() ? 0.28 : 0.22) * m, ease: 'power3.out' });

    if (fresh) {
      // The command palette always wants its input. Otherwise, on desktop go
      // to the first field; on a phone focus the sheet itself, so the keyboard
      // doesn't jump up over it and the close button doesn't get a focus ring.
      const field = size === 'palette' || isDesktop()
        ? dialogEl.querySelector('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')
        : null;
      (field ?? dialogEl).focus({ preventScroll: true });
    }
  }

  function hide() {
    if (!mounted) return;
    if (!overlayEl || !dialogEl) {
      mounted = false;
      onClosed?.();
      return;
    }

    gsap.killTweensOf([overlayEl, dialogEl]);
    // Don't let a stray tap on the fading backdrop land on anything.
    overlayEl.style.pointerEvents = 'none';
    const m = motion();

    gsap.to(overlayEl, { opacity: 0, duration: 0.18 * m });
    const tween = isSheet()
      ? gsap.to(dialogEl, { y: dialogEl.offsetHeight, duration: 0.18 * m, ease: 'power2.in' })
      : gsap.to(dialogEl, { y: 16, opacity: 0, duration: 0.15 * m, ease: 'power2.in' });

    tween.then(() => {
      // Reopened mid-exit: show() already took over.
      if (open) return;
      mounted = false;
      onClosed?.();
    });
  }

  $effect(() => {
    const isOpen = open;
    untrack(() => (isOpen ? show() : hide()));
  });

  // ── History, scroll lock, focus return ──

  $effect(() => {
    if (!open) return;

    triggerEl = document.activeElement;
    token = router.openModal(name, closeFromPop);

    // Preserve the scrollbar's width as padding so the page behind doesn't
    // shift on desktop.
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;

      // Still on the stack means the close came from the UI, so our history
      // entry is ours to clean up. If it's gone, the back gesture already did.
      if (token !== null && router.isModalOpen(token)) router.closeModal(token);
      token = null;

      if (triggerEl?.isConnected) triggerEl.focus({ preventScroll: true });
      triggerEl = null;
    };
  });

  // ── Drag to dismiss (bottom sheet only) ──

  let drag = null;

  function dragStart(e) {
    if (!isSheet() || !open) return;
    gsap.killTweensOf([overlayEl, dialogEl]);
    drag = { startY: e.clientY, lastY: e.clientY, lastT: performance.now(), velocity: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function dragMove(e) {
    if (!drag) return;
    const dy = Math.max(0, e.clientY - drag.startY);
    const now = performance.now();
    drag.velocity = (e.clientY - drag.lastY) / Math.max(1, now - drag.lastT);
    drag.lastY = e.clientY;
    drag.lastT = now;
    gsap.set(dialogEl, { y: dy });
    gsap.set(overlayEl, { opacity: 1 - dy / dialogEl.offsetHeight });
  }

  function dragEnd(e) {
    if (!drag) return;
    const dy = e.clientY - drag.startY;
    const flicked = drag.velocity > 0.5 && dy > 20;
    drag = null;

    if (flicked || dy > dialogEl.offsetHeight * 0.3) {
      close();
    } else {
      gsap.to(dialogEl, { y: 0, duration: 0.22, ease: 'power3.out' });
      gsap.to(overlayEl, { opacity: 1, duration: 0.22 });
    }
  }

  // ── Keyboard ──

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab') return;

    const items = dialogEl?.querySelectorAll(FOCUSABLE);
    if (!items?.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
</script>

{#if mounted}
  <!-- Backdrop: its own layer so fading it never fades the panel -->
  <div
    bind:this={overlayEl}
    class="fixed inset-0 z-50 bg-black/40 dark:bg-black/60"
    style="opacity: 0"
    onclick={close}
    aria-hidden="true"
  ></div>

  <!-- Positioning layer; lets clicks outside the panel fall through to the backdrop -->
  <div
    class="fixed inset-0 z-50 flex justify-center pointer-events-none
      {size === 'palette' ? 'items-start pt-16 px-4' : 'items-end sm:items-center sm:p-4'}"
  >
    <!-- Panel: bottom sheet on mobile, centred dialog from sm: up -->
    <div
      bind:this={dialogEl}
      role="dialog"
      aria-modal="true"
      aria-label={title || undefined}
      tabindex="-1"
      onkeydown={handleKeydown}
      class="pointer-events-auto w-full {widths[size] ?? widths.md} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800
        max-h-[90vh] overflow-y-auto overscroll-contain outline-none shadow-lg
        {size === 'palette'
          ? 'rounded-2xl overflow-hidden'
          : 'rounded-t-3xl sm:rounded-xl border-b-0 sm:border-b pb-[env(safe-area-inset-bottom)] sm:pb-0'}"
    >
      {#if size !== 'palette'}
        <!-- Drag handle: pull down to dismiss -->
        <div
          class="sm:hidden flex justify-center pt-3 pb-2 touch-none cursor-grab"
          onpointerdown={dragStart}
          onpointermove={dragMove}
          onpointerup={dragEnd}
          onpointercancel={dragEnd}
          aria-hidden="true"
        >
          <div class="h-1 w-9 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
        </div>
      {/if}

      {#if title}
        <div class="flex items-start justify-between gap-3 px-5 pt-2 sm:pt-5">
          <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          {#if showClose}
            <button
              type="button"
              onclick={close}
              aria-label="Close"
              class="-mr-1 p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          {/if}
        </div>
      {/if}

      <div class={size === 'palette' ? '' : 'px-5 pt-4 pb-5'}>
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}
