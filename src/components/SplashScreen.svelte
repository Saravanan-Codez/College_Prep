<script>
  import { onMount } from 'svelte';

  export let onFinish = () => {};

  let visible = true;
  let fading = false;

  onMount(() => {
    const timer = setTimeout(() => {
      fading = true;
      setTimeout(() => {
        visible = false;
        onFinish();
      }, 500);
    }, 2500);

    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-color)] transition-opacity duration-500 {fading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}">
    <!-- Centered Soft UI Elevated Card -->
    <div class="neu-card p-8 rounded-[24px] flex flex-col items-center gap-6 text-center max-w-xs w-full">
      <!-- Minimal Modern Placeholder Logo -->
      <div class="w-16 h-16 rounded-2xl neu-card flex items-center justify-center text-2xl font-black text-[var(--accent-color)]">
        [ F ]
      </div>
      <div>
        <h1 class="text-xl font-black tracking-widest text-[var(--text-main)]">EngiPrep OS</h1>
        <p class="text-[12px] font-bold text-[var(--text-muted)] tracking-widest uppercase mt-1">BY FALKON LABS</p>
      </div>
      <!-- Sleek Inset Linear Progress Bar -->
      <div class="w-full neu-panel-inset h-[6px] rounded-[10px] overflow-hidden p-0 mt-2">
        <div class="bg-[var(--accent-color)] h-full rounded-[10px] animate-pulse"></div>
      </div>
    </div>
  </div>
{/if}

<style>
  .neu-card {
    background-color: var(--bg-color);
    box-shadow: var(--shadow-raised);
  }
  .neu-panel-inset {
    background-color: var(--bg-color);
    box-shadow: var(--shadow-pressed);
  }
</style>
