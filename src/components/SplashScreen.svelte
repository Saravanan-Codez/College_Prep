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
  <div class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-color)] transition-opacity duration-500 {fading ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}" style="position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--bg-color);">
    <!-- Centered Soft UI Elevated Card -->
    <div class="neu-card" style="padding: 32px; border-radius: 24px; display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; max-width: 320px; width: 100%;">
      <!-- Falkon Labs Geometric Vector Falcon Logo -->
      <div class="neu-card" style="width: 72px; height: 72px; border-radius: 20px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--bg-color), rgba(59, 130, 246, 0.1));">
        <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 25L50 85L85 25L65 25L50 60L35 25H15Z" fill="url(#falkon_grad1)"/>
          <path d="M25 15L50 55L75 15H60L50 35L40 15H25Z" fill="url(#falkon_grad2)"/>
          <defs>
            <linearGradient id="falkon_grad1" x1="15" y1="25" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop stop-color="#3B82F6"/>
              <stop offset="1" stop-color="#06B6D4"/>
            </linearGradient>
            <linearGradient id="falkon_grad2" x1="25" y1="15" x2="75" y2="55" gradientUnits="userSpaceOnUse">
              <stop stop-color="#60A5FA"/>
              <stop offset="1" stop-color="#3B82F6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div>
        <h1 style="font-size: 1.25rem; font-weight: 900; letter-spacing: 0.1em; color: var(--text-main);">EngiPrep</h1>
        <p style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px;">BY FALKON LABS</p>
      </div>
      <!-- Inset Linear Progress Bar -->
      <div class="neu-panel-inset" style="width: 100%; height: 6px; border-radius: 9999px; overflow: hidden; padding: 0; margin-top: 8px;">
        <div style="background-color: var(--accent-color); height: 100%; border-radius: 9999px; width: 100%; animation: pulse 1.5s infinite;"></div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
</style>
