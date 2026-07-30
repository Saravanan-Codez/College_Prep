<script>
  import { onMount } from 'svelte';
  import falkonLogo from '../resources/images/Falkon Labs.png';

  export let onFinish = () => {};

  let visible = false;
  let exiting = false;

  onMount(() => {
    visible = true;
    const timer = setTimeout(() => {
      exiting = true;
      setTimeout(() => onFinish(), 500);
    }, 2200);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div class="splash" class:exit={exiting}>
    <div class="splash-inner">
      <div class="splash-logo">
        <img src={falkonLogo} alt="Falkon Labs" class="logo-img" />
      </div>
      <div class="splash-brand">
        <h1 class="splash-name">EngiPrep</h1>
        <p class="splash-sub">by Falkon Labs</p>
      </div>
      <div class="splash-loader">
        <div class="loader-bar"></div>
      </div>
      <p class="splash-tagline">Your 20-Day Engineering Mastery System</p>
    </div>
  </div>
{/if}

<style>
  .splash {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: #0d1117;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
    transition: opacity 0.5s ease;
  }

  .splash.exit { opacity: 0; pointer-events: none; }

  .splash-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    animation: splashIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  .splash-logo {
    width: 80px;
    height: 80px;
    border-radius: 22px;
    background: linear-gradient(135deg, rgba(56,139,253,0.15), rgba(163,113,247,0.1));
    border: 1px solid rgba(56,139,253,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 40px rgba(56,139,253,0.3), 0 8px 32px rgba(0,0,0,0.5);
    padding: 14px;
  }

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0 8px rgba(56,139,253,0.5));
  }

  .splash-brand { text-align: center; }

  .splash-name {
    font-family: 'Inter', sans-serif;
    font-size: 2.25rem;
    font-weight: 900;
    color: #e6edf3;
    letter-spacing: -0.04em;
    line-height: 1;
    background: linear-gradient(135deg, #388bfd, #a371f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .splash-sub {
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: #6e7681;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin-top: 4px;
  }

  .splash-loader {
    width: 160px;
    height: 3px;
    background: rgba(255,255,255,0.08);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 8px;
  }

  .loader-bar {
    height: 100%;
    background: linear-gradient(90deg, #388bfd, #a371f7);
    border-radius: 99px;
    animation: loadProgress 1.8s cubic-bezier(0.4,0,0.2,1) forwards;
  }

  .splash-tagline {
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    color: #6e7681;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  @keyframes splashIn {
    from { opacity: 0; transform: scale(0.85) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes loadProgress {
    from { width: 0%; }
    to   { width: 100%; }
  }
</style>
