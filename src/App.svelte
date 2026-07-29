<script>
  import { onMount } from 'svelte';
  import SplashScreen from './components/SplashScreen.svelte';
  import { CURRICULUM_DATA } from './js/data/curriculum.js';
  import { DAILY_QUIZZES } from './js/data/quizzes.js';
  import { C_SNIPPETS } from './js/data/snippets.js';
  import { FLASHCARDS } from './js/data/flashcards.js';
  import { playPopSound, playLevelUpSound, toggleAmbientSound } from './js/modules/audio.js';
  import { getUserLevelInfo, ACHIEVEMENTS } from './js/modules/gamification.js';
  import { calculateSM2 } from './js/modules/sm2Engine.js';
  import { executeCCode } from './js/modules/cRunner.js';
  import { sendGeminiPrompt } from './js/modules/aiMentor.js';
  import { buildSyncBundle, parseSyncPayload, attemptBluetoothDiscovery, describeSyncPayload } from './js/modules/p2pSync.js';

  let splashFinished = false;
  let currentDay = 1;
  let activeTab = 'dashboard';
  let theme = 'light'; // 'light' or 'dark'
  let completedTasks = {};
  let customNotes = {};
  let problemLogs = {};
  let quizScores = {};
  let xp = 0;
  let streakCount = 1;
  let unlockedBadges = [];
  let soundMuted = false;
  let flashcardsState = {};

  let currentFlashcardIndex = 0;
  let isFlashcardFlipped = false;

  // Soundscape State
  let activeSoundscape = 'off';

  // Spotify Player State - Default Working Embed URL
  let spotifyPlaylistId = '37i9dQZF1DWWQR0awA2vA8'; // Focus Lofi default
  let customSpotifyUrl = '';

  // Modals
  let showP2PModal = false;
  let showImportModal = false;
  let showVideoModal = false;
  let showAIKeyModal = false;
  let showMusicModal = false;

  let activeVideoTitle = '';
  let activeVideoEmbedId = '';

  let importStrategy = 'overwrite';
  let pendingImportData = null;
  let syncCode = '';
  let syncPayload = '';
  let syncStatus = 'Choose a sync method to share your current study state.';
  let syncBusy = false;
  let syncImportText = '';

  // Gemini AI Assistant State
  let geminiApiKey = '';
  let aiUserPrompt = '';
  let isAiThinking = false;
  let chatMessages = [
    { role: 'assistant', text: "👋 Hello! I am your Context-Aware Gemini AI Study Coach. I automatically monitor your active day, math/physics topics, and live C playground code to help you excel. How can I help you today?" }
  ];

  $: levelInfo = getUserLevelInfo(xp);
  $: currentDayData = CURRICULUM_DATA.find(d => d.day === currentDay) || CURRICULUM_DATA[0];
  $: currentSnippet = C_SNIPPETS[currentDay] || C_SNIPPETS[1];
  $: currentQuiz = DAILY_QUIZZES[currentDay] || DAILY_QUIZZES[1];
  $: currentCard = FLASHCARDS[currentFlashcardIndex] || FLASHCARDS[0];

  $: completedTodayCount = [0,1,2,3,4,5].filter(id => !!completedTasks[`day${currentDay}_slot${id}`]).length;

  // Dynamic html.dark reactivity
  $: {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  onMount(() => {
    loadState();
  });

  function loadState() {
    const saved = localStorage.getItem('college_prep_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        currentDay = parsed.currentDay || 1;
        theme = parsed.theme || 'light';
        completedTasks = parsed.completedTasks || {};
        customNotes = parsed.customNotes || {};
        problemLogs = parsed.problemLogs || {};
        quizScores = parsed.quizScores || {};
        xp = parsed.xp || 0;
        streakCount = parsed.streakCount || 1;
        unlockedBadges = parsed.unlockedBadges || [];
        soundMuted = parsed.soundMuted || false;
        flashcardsState = parsed.flashcardsState || {};
        spotifyPlaylistId = parsed.spotifyPlaylistId || '37i9dQZF1DWWQR0awA2vA8';
        geminiApiKey = parsed.geminiApiKey || localStorage.getItem('gemini_api_key') || '';
        chatMessages = parsed.chatMessages || [
          { role: 'assistant', text: "👋 Hello! I am your Context-Aware Gemini AI Study Coach. How can I help you today?" }
        ];
      } catch(e){}
    }
  }

  function saveState() {
    localStorage.setItem('college_prep_state', JSON.stringify({
      currentDay, theme, completedTasks, customNotes, problemLogs, quizScores,
      xp, streakCount, unlockedBadges, soundMuted, flashcardsState, spotifyPlaylistId, geminiApiKey, chatMessages
    }));
    if (geminiApiKey) {
      localStorage.setItem('gemini_api_key', geminiApiKey);
    }
  }

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    saveState();
  }

  function handleToggleSoundscape(type) {
    activeSoundscape = type;
    toggleAmbientSound(type, soundMuted);
  }

  function setSpotifyPlaylist(id) {
    spotifyPlaylistId = id;
    saveState();
  }

  // Convert full URL or ID to clean Spotify Embed Playlist ID
  function parseAndSetCustomSpotify() {
    if (!customSpotifyUrl.trim()) return;
    try {
      // Extracts playlist ID from URLs like https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn2wVvT
      const match = customSpotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/i);
      if (match && match[1]) {
        spotifyPlaylistId = match[1];
      } else if (customSpotifyUrl.trim().length > 10) {
        spotifyPlaylistId = customSpotifyUrl.trim();
      }
      customSpotifyUrl = '';
      saveState();
    } catch(e){}
  }

  function saveGeminiKey() {
    saveState();
    showAIKeyModal = false;
  }

  function addXP(amount, reason) {
    const oldLvl = getUserLevelInfo(xp).level;
    xp += amount;
    saveState();
    const newLvl = getUserLevelInfo(xp).level;
    if (newLvl > oldLvl) {
      playLevelUpSound(soundMuted);
    } else if (reason) {
      playPopSound(soundMuted);
    }
  }

  function toggleTask(taskKey) {
    completedTasks[taskKey] = !completedTasks[taskKey];
    if (completedTasks[taskKey]) addXP(50, "Session Completed");
    completedTasks = completedTasks;
    saveState();
  }

  function rateFlashcard(q) {
    let cState = flashcardsState[currentCard.id] || { ...currentCard };
    flashcardsState[currentCard.id] = calculateSM2(cState, q);
    flashcardsState = flashcardsState;
    addXP(15, "SM-2 Card Rated");
    saveState();
    currentFlashcardIndex = (currentFlashcardIndex + 1) % FLASHCARDS.length;
    isFlashcardFlipped = false;
  }

  function flipCard() {
    isFlashcardFlipped = !isFlashcardFlipped;
    if (isFlashcardFlipped) playPopSound(soundMuted);
  }

  function handleRunCCode() {
    const editor = document.getElementById('c-app-editor');
    const output = document.getElementById('c-app-output');
    const table = document.getElementById('c-app-table');
    if (editor && output && table) {
      executeCCode(editor.value, output, table);
      addXP(25, "C Code Executed");
    }
  }

  async function handleSendAiChat(customPromptText) {
    const promptToSend = customPromptText || aiUserPrompt;
    if (!promptToSend.trim()) return;

    if (!geminiApiKey) {
      showAIKeyModal = true;
      return;
    }

    chatMessages = [...chatMessages, { role: 'user', text: promptToSend }];
    aiUserPrompt = '';
    isAiThinking = true;
    saveState();

    try {
      const activeCode = document.getElementById('c-app-editor') ? document.getElementById('c-app-editor').value : '';
      const reply = await sendGeminiPrompt(promptToSend, geminiApiKey, {
        currentDay,
        currentDayData,
        levelInfo,
        xp,
        activeCode,
        completedToday: completedTodayCount
      });
      chatMessages = [...chatMessages, { role: 'assistant', text: reply }];
      saveState();
      addXP(20, "AI Assistant Consulted");
    } catch(err) {
      chatMessages = [...chatMessages, { role: 'assistant', text: `⚠️ Error: ${err.message}` }];
      saveState();
    } finally {
      isAiThinking = false;
    }
  }

  function getMasterStateSnapshot() {
    return {
      appVersion: '2.0.0',
      exportTimestamp: new Date().toISOString(),
      currentDay,
      theme,
      completedTasks,
      customNotes,
      problemLogs,
      quizScores,
      xp,
      streakCount,
      unlockedBadges,
      soundMuted,
      flashcardsState,
      spotifyPlaylistId,
      geminiApiKey,
      chatMessages
    };
  }

  function exportJSON() {
    addXP(10, 'JSON Export');
    const fullMasterState = getMasterStateSnapshot();

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullMasterState, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `engi_prep_master_state_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }

  function openSyncModal() {
    const bundle = buildSyncBundle(getMasterStateSnapshot());
    syncCode = bundle.syncCode;
    syncPayload = bundle.payload;
    syncStatus = 'Ready to share. Use the sync code, QR code, or copy the payload to another device.';
    syncImportText = '';
    showP2PModal = true;
  }

  async function handleCopySyncPayload() {
    if (!syncPayload) return;

    try {
      await navigator.clipboard.writeText(syncPayload);
      syncStatus = 'Sync payload copied to your clipboard.';
    } catch (error) {
      syncStatus = 'Clipboard access was blocked, so copy the payload from the text box below.';
    }
  }

  async function handleShareSyncPayload() {
    if (!syncPayload) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'College Prep Sync Payload',
          text: syncPayload
        });
        syncStatus = 'Sync payload shared successfully.';
      } catch (error) {
        syncStatus = 'Sharing was cancelled.';
      }
    } else {
      await handleCopySyncPayload();
    }
  }

  async function handleBluetoothScan() {
    syncBusy = true;
    const success = await attemptBluetoothDiscovery((message) => {
      syncStatus = message;
    });
    syncBusy = false;

    if (!success) {
      syncStatus = syncStatus || 'Bluetooth sync was unavailable. Use the payload flow instead.';
    }
  }

  function applyIncomingState(payloadText) {
    const parsedPayload = parseSyncPayload(payloadText);
    if (!parsedPayload) {
      syncStatus = 'The pasted payload was not recognised. Try pasting the full sync payload from the other device.';
      return false;
    }

    const incomingState = parsedPayload.state || {};
    if (importStrategy === 'overwrite') {
      currentDay = incomingState.currentDay || currentDay;
      theme = incomingState.theme || theme;
      completedTasks = incomingState.completedTasks || {};
      customNotes = incomingState.customNotes || {};
      problemLogs = incomingState.problemLogs || {};
      quizScores = incomingState.quizScores || {};
      xp = incomingState.xp || 0;
      streakCount = incomingState.streakCount || streakCount;
      unlockedBadges = incomingState.unlockedBadges || [];
      flashcardsState = incomingState.flashcardsState || {};
      spotifyPlaylistId = incomingState.spotifyPlaylistId || spotifyPlaylistId;
      geminiApiKey = incomingState.geminiApiKey || geminiApiKey;
      chatMessages = incomingState.chatMessages || chatMessages;
    } else {
      completedTasks = { ...completedTasks, ...(incomingState.completedTasks || {}) };
      customNotes = { ...customNotes, ...(incomingState.customNotes || {}) };
      problemLogs = { ...problemLogs, ...(incomingState.problemLogs || {}) };
      quizScores = { ...quizScores, ...(incomingState.quizScores || {}) };
      xp = Math.max(xp, incomingState.xp || 0);
      streakCount = Math.max(streakCount, incomingState.streakCount || streakCount);
      unlockedBadges = [...new Set([...(unlockedBadges || []), ...(incomingState.unlockedBadges || [])])];
      flashcardsState = { ...flashcardsState, ...(incomingState.flashcardsState || {}) };
      if (incomingState.spotifyPlaylistId) spotifyPlaylistId = incomingState.spotifyPlaylistId;
      if (incomingState.geminiApiKey) geminiApiKey = incomingState.geminiApiKey;
      if (incomingState.chatMessages) chatMessages = [...chatMessages, ...(incomingState.chatMessages || [])];
    }

    saveState();
    syncStatus = `Sync complete. ${describeSyncPayload(parsedPayload)}`;
    syncImportText = '';
    showP2PModal = false;
    return true;
  }

  function handleSyncImport() {
    if (!syncImportText.trim()) return;
    applyIncomingState(syncImportText.trim());
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          pendingImportData = JSON.parse(ev.target.result);
        } catch(err){}
      };
      reader.readAsText(files[0]);
    }
  }

  function executeImport() {
    if (!pendingImportData) return;
    if (importStrategy === 'overwrite') {
      currentDay = pendingImportData.currentDay || 1;
      theme = pendingImportData.theme || theme;
      completedTasks = pendingImportData.completedTasks || {};
      customNotes = pendingImportData.customNotes || {};
      problemLogs = pendingImportData.problemLogs || {};
      quizScores = pendingImportData.quizScores || {};
      xp = pendingImportData.xp || 0;
      streakCount = pendingImportData.streakCount || 1;
      unlockedBadges = pendingImportData.unlockedBadges || [];
      flashcardsState = pendingImportData.flashcardsState || {};
      spotifyPlaylistId = pendingImportData.spotifyPlaylistId || spotifyPlaylistId;
      geminiApiKey = pendingImportData.geminiApiKey || geminiApiKey;
      chatMessages = pendingImportData.chatMessages || chatMessages;
    } else {
      completedTasks = { ...completedTasks, ...(pendingImportData.completedTasks || {}) };
      customNotes = { ...customNotes, ...(pendingImportData.customNotes || {}) };
      problemLogs = { ...problemLogs, ...(pendingImportData.problemLogs || {}) };
      quizScores = { ...quizScores, ...(pendingImportData.quizScores || {}) };
      xp += (pendingImportData.xp || 0);
      if (pendingImportData.geminiApiKey) geminiApiKey = pendingImportData.geminiApiKey;
      if (pendingImportData.chatMessages) chatMessages = [...chatMessages, ...(pendingImportData.chatMessages || [])];
    }
    saveState();
    showImportModal = false;
    pendingImportData = null;
  }

  function openVideo(title, embedId) {
    activeVideoTitle = title;
    activeVideoEmbedId = embedId;
    showVideoModal = true;
  }
</script>

<SplashScreen onFinish={() => splashFinished = true} />

<div class="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-color)] text-[var(--text-main)] antialiased font-sans transition-colors duration-300">
  
  <!-- SIDEBAR NAVIGATION (ENGIPREP OS BY FALKON LABS) -->
  <aside class="hidden lg:flex w-64 flex-col bg-[var(--bg-color)] p-6 space-y-6 flex-shrink-0">
    <!-- App Brand Logo -->
    <div class="neu-card p-4 flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-[var(--accent-color)] flex items-center justify-center text-white font-extrabold shadow-md">
        <i class="fa-solid fa-graduation-cap text-lg"></i>
      </div>
      <div>
        <h1 class="font-extrabold text-base tracking-tight text-[var(--text-main)]">EngiPrep OS</h1>
        <p class="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">by Falkon Labs</p>
      </div>
    </div>

    <!-- Navigation Menu Items (Active Tab Uses Inset Pressed State) -->
    <nav class="space-y-3 flex-grow">
      <button on:click={() => activeTab = 'dashboard'} class="w-full neu-btn justify-start text-xs {activeTab === 'dashboard' ? 'active' : ''}">
        <i class="fa-solid fa-calendar-day text-sm mr-3"></i> 20-Day Schedule
      </button>
      <button on:click={() => activeTab = 'snippets'} class="w-full neu-btn justify-start text-xs {activeTab === 'snippets' ? 'active' : ''}">
        <i class="fa-solid fa-terminal text-sm mr-3"></i> C Playground
      </button>
      <button on:click={() => activeTab = 'flashcards'} class="w-full neu-btn justify-start text-xs {activeTab === 'flashcards' ? 'active' : ''}">
        <i class="fa-solid fa-layer-group text-sm mr-3"></i> Anki SM-2
      </button>
      <button on:click={() => activeTab = 'gamification'} class="w-full neu-btn justify-start text-xs {activeTab === 'gamification' ? 'active' : ''}">
        <i class="fa-solid fa-trophy text-sm mr-3"></i> Gamification & XP
      </button>
      <button on:click={() => activeTab = 'ai-mentor'} class="w-full neu-btn justify-start text-xs {activeTab === 'ai-mentor' ? 'active' : ''}">
        <i class="fa-solid fa-robot text-sm mr-3"></i> AI Study Coach
      </button>
    </nav>

    <!-- Sidebar Level Box -->
    <div class="neu-card p-4 space-y-2 text-center">
      <span class="text-xs font-extrabold text-amber-500 uppercase tracking-wide block"><i class="fa-solid fa-medal mr-1"></i> {levelInfo.title}</span>
      <div class="w-full neu-panel-inset h-2.5 rounded-full overflow-hidden p-0.5">
        <div class="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full transition-all duration-500" style="width: {(xp % 200) / 2}%"></div>
      </div>
      <div class="flex justify-between text-[11px] font-mono font-bold text-[var(--text-muted)]">
        <span>{xp} XP</span>
        <span>{streakCount}d Streak 🔥</span>
      </div>
    </div>
  </aside>

  <!-- MAIN APP CONTAINER -->
  <div class="flex-grow flex flex-col min-w-0 pb-20 lg:pb-0">

    <!-- HEADER / TOP BAR CONTROLS (CRISP HORIZONTAL FLEXING LINE, GAP: 12PX) -->
    <header class="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
      <!-- Theme & Binaural Beat Controls -->
      <div class="flex items-center gap-3">
        <button on:click={toggleTheme} class="neu-btn text-xs">
          <i class="fa-solid {theme === 'dark' ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-600'} mr-2"></i>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div class="hidden md:flex items-center gap-2 neu-panel-inset p-1.5 rounded-2xl">
          <button on:click={() => handleToggleSoundscape('alpha')} class="px-3 py-1 rounded-xl text-[11px] font-bold transition-all {activeSoundscape === 'alpha' ? 'neu-btn text-[var(--accent-color)]' : 'text-[var(--text-muted)]'}">🧠 10Hz Alpha</button>
          <button on:click={() => handleToggleSoundscape('rain')} class="px-3 py-1 rounded-xl text-[11px] font-bold transition-all {activeSoundscape === 'rain' ? 'neu-btn text-cyan-500' : 'text-[var(--text-muted)]'}">🌧️ Rain</button>
          <button on:click={() => handleToggleSoundscape('off')} class="px-3 py-1 rounded-xl text-[11px] font-bold transition-all {activeSoundscape === 'off' ? 'neu-btn text-red-500' : 'text-[var(--text-muted)]'}">🔇 Off</button>
        </div>
      </div>

      <!-- Right Action Buttons (gap: 12px) -->
      <div class="flex items-center gap-3">
        <button on:click={() => showMusicModal = true} class="neu-btn text-xs text-emerald-500">
          <i class="fa-brands fa-spotify mr-1.5"></i> <span class="hidden sm:inline">Spotify Player</span>
        </button>

        <button on:click={openSyncModal} class="neu-btn text-xs text-cyan-500">
          <i class="fa-bluetooth mr-1.5"></i> <span class="hidden sm:inline">P2P Sync</span>
        </button>

        <button on:click={() => showImportModal = true} class="neu-btn text-xs text-[var(--accent-color)]">
          <i class="fa-solid fa-upload mr-1.5"></i> <span class="hidden sm:inline">Load JSON</span>
        </button>

        <button on:click={exportJSON} class="neu-btn text-xs text-amber-500">
          <i class="fa-solid fa-download mr-1.5"></i> <span class="hidden sm:inline">Save JSON</span>
        </button>
      </div>
    </header>

    <!-- MAIN APP WORKSPACE -->
    <main class="flex-grow p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">

      <!-- TAB 1: 20-DAY SCHEDULE -->
      {#if activeTab === 'dashboard'}
        <div class="space-y-6">
          <!-- Day Selector & Header Card -->
          <div class="neu-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-3 py-1 rounded-full text-xs font-extrabold neu-panel-inset text-[var(--accent-color)]">Day {currentDay}</span>
                <span class="px-3 py-1 rounded-full text-xs font-extrabold neu-panel-inset text-purple-500">{currentDayData.phase}</span>
              </div>
              <h2 class="text-2xl font-black mt-2 tracking-tight text-[var(--text-main)]">{currentDayData.dateStr}</h2>
              <p class="text-xs font-semibold text-[var(--text-muted)] mt-1">{currentDayData.math.topic} • {currentDayData.physics.topic}</p>
            </div>

            <!-- Standardized 44px Height Dropdown Field -->
            <select bind:value={currentDay} on:change={saveState} class="neu-field text-xs font-extrabold cursor-pointer">
              {#each CURRICULUM_DATA as dayObj}
                <option value={dayObj.day}>Day {dayObj.day}: {dayObj.dateStr.split(' (')[0]}</option>
              {/each}
            </select>
          </div>

          <!-- Time Block Sessions Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each [
              { id: 0, title: '🧮 Mathematics Session', subject: currentDayData.math },
              { id: 1, title: '⚛️ Physics Session', subject: currentDayData.physics },
              { id: 2, title: '💻 C Programming', subject: currentDayData.prog },
              { id: 3, title: '🧠 DSA Foundations', subject: currentDayData.dsa },
              { id: 4, title: '🌐 Web Development', subject: currentDayData.web },
              { id: 5, title: '📖 Technical Systems Reading', subject: { topic: currentDayData.reading, subtopics: ["Read assigned chapter", "Take journal notes"] } }
            ] as slot}
              {@const taskKey = `day${currentDay}_slot${slot.id}`}
              {@const isChecked = !!completedTasks[taskKey]}
              <div class="neu-card flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{slot.title}</span>
                    <button on:click={() => toggleTask(taskKey)} class="neu-btn w-10 h-10 p-0 rounded-full flex items-center justify-center {isChecked ? 'active text-emerald-500' : 'text-[var(--text-muted)]'}">
                      <i class="fa-solid {isChecked ? 'fa-circle-check text-xl text-emerald-500' : 'fa-circle-check text-base opacity-40'}"></i>
                    </button>
                  </div>
                  <h4 class="text-base font-bold text-[var(--text-main)] {isChecked ? 'line-through opacity-50' : ''}">{slot.subject.topic}</h4>
                  <ul class="text-xs font-medium text-[var(--text-muted)] list-disc list-inside space-y-1">
                    {#each slot.subject.subtopics as st}
                      <li>{st}</li>
                    {/each}
                  </ul>
                </div>

                <!-- Video Lessons (Clean Typographic Links) -->
                {#if slot.subject.videos && slot.subject.videos.length > 0}
                  <div class="pt-3 border-t border-slate-700/10 space-y-2">
                    <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block"><i class="fa-brands fa-youtube text-red-500 mr-1"></i> Recommended Lessons:</span>
                    <div class="flex flex-col gap-1.5">
                      {#each slot.subject.videos as vid}
                        <a href="#video" on:click|preventDefault={() => openVideo(vid.title, vid.embedId)} class="lesson-link">
                          <i class="fa-solid fa-play-circle text-red-500 text-xs"></i> {vid.title}
                        </a>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

      <!-- TAB 2: C PLAYGROUND & STACK RAM INSPECTOR -->
      {:else if activeTab === 'snippets'}
        <div class="space-y-6">
          <div class="neu-card space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-extrabold text-[var(--text-main)]">{currentSnippet.title}</h3>
              <button on:click={handleRunCCode} class="neu-btn text-xs text-emerald-500 font-extrabold">
                <i class="fa-solid fa-play mr-1.5"></i> Run C Code (Client-Side WASM)
              </button>
            </div>
            <!-- Code Area Inset Carved -->
            <textarea id="c-app-editor" rows="12" class="w-full neu-field h-auto p-4 font-mono text-xs text-emerald-500 focus:outline-none">{currentSnippet.code}</textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="neu-card">
              <h4 class="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Terminal Output (stdout)</h4>
              <pre><code id="c-app-output" class="text-xs font-mono text-emerald-500">$ ready.</code></pre>
            </div>
            <div class="neu-card">
              <h4 class="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-2">Stack Variable RAM Inspector</h4>
              <div id="c-app-table"></div>
            </div>
          </div>
        </div>

      <!-- TAB 3: ANKI SM-2 FLASHCARDS -->
      {:else if activeTab === 'flashcards'}
        <div class="max-w-xl mx-auto space-y-6">
          <button type="button" class="perspective-1000 w-full min-h-[260px] cursor-pointer text-left" on:click={flipCard} aria-label="Flip flashcard">
            <div class="relative w-full h-full transform-style-3d transition-transform duration-500 neu-card flex flex-col justify-between text-center">
              <span class="text-xs font-black text-purple-500 uppercase tracking-widest">{currentCard.category}</span>
              <h3 class="text-xl font-bold text-[var(--text-main)] my-6">{isFlashcardFlipped ? currentCard.answer : currentCard.question}</h3>
              <span class="text-[11px] font-mono text-[var(--text-muted)]">{isFlashcardFlipped ? currentCard.exp : 'Click to flip card 🔄'}</span>
            </div>
          </button>
          <div class="grid grid-cols-4 gap-3">
            <button on:click={() => rateFlashcard(1)} class="neu-btn text-xs text-red-500">Again (1d)</button>
            <button on:click={() => rateFlashcard(2)} class="neu-btn text-xs text-amber-500">Hard (2d)</button>
            <button on:click={() => rateFlashcard(3)} class="neu-btn text-xs text-[var(--accent-color)]">Good (4d)</button>
            <button on:click={() => rateFlashcard(4)} class="neu-btn text-xs text-emerald-500">Easy (7d)</button>
          </div>
        </div>

      <!-- TAB 4: GAMIFICATION & BADGES -->
      {:else if activeTab === 'gamification'}
        <div class="space-y-6 max-w-4xl mx-auto">
          <div class="neu-card flex items-center justify-between gap-4">
            <div>
              <span class="text-xs font-black text-amber-500 uppercase tracking-widest">Level Progress</span>
              <h2 class="text-2xl font-black mt-1 text-[var(--text-main)]">{levelInfo.title}</h2>
              <p class="text-xs text-[var(--text-muted)]">Earn XP by completing time blocks, running C code, and passing quizzes.</p>
            </div>
            <div class="neu-panel-inset p-4 rounded-3xl text-center font-mono">
              <span class="text-2xl font-extrabold text-amber-500">{xp}</span>
              <span class="block text-[10px] text-[var(--text-muted)] uppercase font-bold">Total XP</span>
            </div>
          </div>

          <!-- Unlockable Badges Suite -->
          <div class="neu-card space-y-4">
            <h3 class="text-sm font-black text-[var(--text-muted)] uppercase tracking-wider">Achievement Badges</h3>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {#each ACHIEVEMENTS as badge}
                {@const isUnlocked = xp >= badge.xpRequired}
                <div class="neu-card p-4 text-center space-y-2 opacity-{isUnlocked ? '100' : '40'}">
                  <div class="w-12 h-12 rounded-2xl neu-card mx-auto flex items-center justify-center text-2xl text-amber-500">
                    <i class="fa-solid {badge.icon}"></i>
                  </div>
                  <h4 class="text-xs font-extrabold text-[var(--text-main)]">{badge.name}</h4>
                  <p class="text-[10px] text-[var(--text-muted)]">{badge.desc}</p>
                  <span class="text-[9px] font-mono px-2 py-0.5 rounded-full neu-panel-inset text-amber-500 block">{badge.xpRequired} XP</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

      <!-- TAB 5: GEMINI AI COACH -->
      {:else if activeTab === 'ai-mentor'}
        <div class="space-y-4 max-w-4xl mx-auto">
          <div class="neu-card flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl neu-panel-inset text-purple-500 flex items-center justify-center text-lg font-extrabold">
                <i class="fa-solid fa-robot"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-[var(--text-main)]">Context-Aware Gemini AI Coach</h3>
                <p class="text-xs text-[var(--text-muted)]">Context active: Day {currentDay} ({currentDayData.math.topic}), XP ({xp}).</p>
              </div>
            </div>
            <button on:click={() => showAIKeyModal = true} class="neu-btn text-xs text-purple-500">
              {geminiApiKey ? '🔑 Key Configured' : 'Set Gemini Key'}
            </button>
          </div>

          <!-- Quick Action Prompt Chips -->
          <div class="flex flex-wrap gap-2 text-xs">
            <button on:click={() => handleSendAiChat(`Explain Day ${currentDay} ${currentDayData.math.topic} with a simple step-by-step example.`)} class="neu-btn text-xs">💡 Explain Day {currentDay} Math Concept</button>
            <button on:click={() => handleSendAiChat("Debug my C playground code and suggest memory optimization tips.")} class="neu-btn text-xs">🐞 Debug My C Playground Code</button>
            <button on:click={() => handleSendAiChat("Evaluate my 20-day preparation progress and suggest high-yield revision topics.")} class="neu-btn text-xs">🏆 Evaluate My Study Progress</button>
          </div>

          <!-- Chat Stream Box -->
          <div class="neu-card space-y-4 max-h-[500px] overflow-y-auto font-sans">
            {#each chatMessages as msg}
              <div class="p-4 rounded-2xl text-xs leading-relaxed {msg.role === 'user' ? 'neu-card bg-purple-600 text-white ml-auto max-w-lg font-bold' : 'neu-panel-inset text-[var(--text-main)]'}">
                <strong class="block text-[10px] uppercase font-black mb-1 opacity-75">{msg.role === 'user' ? 'You' : 'Gemini AI Coach'}</strong>
                <div class="whitespace-pre-wrap">{msg.text}</div>
              </div>
            {/each}
            {#if isAiThinking}
              <div class="p-3 neu-panel-inset text-xs text-purple-500 font-mono animate-pulse">
                Gemini is thinking & analyzing context...
              </div>
            {/if}
          </div>

          <!-- Standardized 44px Input Field -->
          <div class="flex gap-3">
            <input type="text" bind:value={aiUserPrompt} on:keydown={(e) => e.key === 'Enter' && handleSendAiChat()} placeholder="Ask anything about Calculus, Physics, C Pointers, DSA, or study strategy..." class="flex-grow neu-field text-xs">
            <button on:click={() => handleSendAiChat()} class="neu-btn text-xs text-purple-500 flex items-center gap-2">
              <i class="fa-solid fa-paper-plane"></i> Send
            </button>
          </div>
        </div>
      {/if}
    </main>
  </div>

  <!-- MOBILE BOTTOM TOUCH DOCK BAR -->
  <nav class="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-[var(--bg-color)] flex justify-around text-[11px] font-bold z-50 border-t border-slate-700/10">
    <button on:click={() => activeTab = 'dashboard'} class="neu-btn p-2 h-auto flex flex-col items-center gap-1 {activeTab === 'dashboard' ? 'active' : ''}"><i class="fa-solid fa-calendar-day text-sm"></i>Schedule</button>
    <button on:click={() => activeTab = 'snippets'} class="neu-btn p-2 h-auto flex flex-col items-center gap-1 {activeTab === 'snippets' ? 'active' : ''}"><i class="fa-solid fa-terminal text-sm"></i>C Code</button>
    <button on:click={() => activeTab = 'flashcards'} class="neu-btn p-2 h-auto flex flex-col items-center gap-1 {activeTab === 'flashcards' ? 'active' : ''}"><i class="fa-solid fa-layer-group text-sm"></i>Anki</button>
    <button on:click={() => activeTab = 'gamification'} class="neu-btn p-2 h-auto flex flex-col items-center gap-1 {activeTab === 'gamification' ? 'active' : ''}"><i class="fa-solid fa-trophy text-sm"></i>Stats</button>
    <button on:click={() => activeTab = 'ai-mentor'} class="neu-btn p-2 h-auto flex flex-col items-center gap-1 {activeTab === 'ai-mentor' ? 'active' : ''}"><i class="fa-solid fa-robot text-sm"></i>AI Coach</button>
  </nav>

  <!-- SPOTIFY EMBEDDED PLAYER MODAL (FIXED 404 SPOTIFY EMBED URL) -->
  {#if showMusicModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div class="neu-card max-w-lg w-full space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-extrabold text-emerald-500 flex items-center gap-2"><i class="fa-brands fa-spotify"></i> Spotify Focus Player</h3>
          <button on:click={() => showMusicModal = false} class="neu-btn w-8 h-8 p-0 rounded-xl text-[var(--text-muted)]"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <!-- Preset Playlists -->
        <div class="flex gap-2 text-xs">
          <button on:click={() => setSpotifyPlaylist('37i9dQZF1DWWQR0awA2vA8')} class="neu-btn text-xs text-emerald-500">🎧 Focus Lofi</button>
          <button on:click={() => setSpotifyPlaylist('37i9dQZF1DXdLENHPmIOXM')} class="neu-btn text-xs text-emerald-500">🎹 Deep Focus</button>
          <button on:click={() => setSpotifyPlaylist('37i9dQZF1DX0smYrA8MsOG')} class="neu-btn text-xs text-emerald-500">🎻 Classical</button>
        </div>

        <!-- Custom Playlist URL Input -->
        <div class="flex gap-2">
          <input type="text" bind:value={customSpotifyUrl} placeholder="Paste public Spotify Playlist URL..." class="flex-grow neu-field text-xs">
          <button on:click={parseAndSetCustomSpotify} class="neu-btn text-xs text-emerald-500">Load</button>
        </div>

        <!-- Embedded Spotify Player Iframe (Correct Embed Format: https://open.spotify.com/embed/playlist/<ID>) -->
        <div class="rounded-2xl overflow-hidden neu-panel-inset p-1">
          <iframe title="Spotify Player Embed" style="border-radius:12px" src={`https://open.spotify.com/embed/playlist/${spotifyPlaylistId}?utm_source=generator&theme=0`} width="100%" height="240" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>
      </div>
    </div>
  {/if}

  <!-- P2P BLUETOOTH SYNC MODAL -->
  {#if showP2PModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div class="neu-card max-w-md w-full space-y-4 text-center">
        <div class="flex items-center justify-between border-b border-slate-700/10 pb-3">
          <h3 class="text-base font-extrabold text-cyan-500"><i class="fa-bluetooth text-cyan-500 mr-2"></i>P2P Sync</h3>
          <button on:click={() => showP2PModal = false} class="neu-btn w-8 h-8 p-0 rounded-xl text-[var(--text-muted)]"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-xs font-semibold text-[var(--text-muted)]">Share the current study state securely between devices with a sync code, QR payload, or clipboard import.</p>

        <div class="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div class="text-left">
              <p class="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">Sync code</p>
              <p class="text-2xl font-extrabold text-amber-500 tracking-[0.35em]">{syncCode}</p>
            </div>
            <div class="flex gap-2">
              <button on:click={handleCopySyncPayload} class="neu-btn text-[11px] px-3 py-2">Copy</button>
              <button on:click={handleShareSyncPayload} class="neu-btn text-[11px] px-3 py-2">Share</button>
            </div>
          </div>

          <div class="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(syncPayload)}`} alt="Sync payload QR code" class="w-44 h-44 mx-auto rounded-xl" />
          </div>

          <div class="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-left">
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">How it works</p>
            <p class="text-[11px] mt-1 text-[var(--text-muted)]">The app packages your current task progress, XP, badges, and notes into a compact sync payload. Scan the QR code, copy the payload, or paste it into another device to import it.</p>
          </div>

          <button on:click={handleBluetoothScan} disabled={syncBusy} class="w-full neu-btn text-xs text-cyan-500 font-extrabold disabled:opacity-60">
            {syncBusy ? 'Scanning...' : 'Scan Nearby Devices'}
          </button>

          <div class="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-left">
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">Status</p>
            <p class="text-[11px] mt-1 text-[var(--text-muted)]">{syncStatus}</p>
          </div>

          <textarea bind:value={syncImportText} rows="4" placeholder="Paste a sync payload or backup JSON here" class="w-full neu-field text-xs font-mono"></textarea>
          <button on:click={handleSyncImport} class="w-full neu-btn text-xs text-cyan-500 font-extrabold">Import Shared State</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- MASTER JSON IMPORT MODAL -->
  {#if showImportModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div class="neu-card max-w-md w-full space-y-4">
        <div class="flex items-center justify-between border-b border-slate-700/10 pb-3">
          <h3 class="text-base font-extrabold text-[var(--accent-color)]"><i class="fa-solid fa-upload text-[var(--accent-color)] mr-2"></i>Load Master State JSON</h3>
          <button on:click={() => showImportModal = false} class="neu-btn w-8 h-8 p-0 rounded-xl text-[var(--text-muted)]"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <input type="file" accept=".json" on:change={handleFileSelect} class="w-full text-xs text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[var(--accent-color)] file:text-white file:font-bold cursor-pointer">
        <div class="grid grid-cols-2 gap-2 text-xs font-bold text-[var(--text-muted)]">
          <label class="flex items-center gap-1.5"><input type="radio" bind:group={importStrategy} value="overwrite"> Overwrite</label>
          <label class="flex items-center gap-1.5"><input type="radio" bind:group={importStrategy} value="merge"> Merge</label>
        </div>
        <button on:click={executeImport} disabled={!pendingImportData} class="w-full neu-btn text-xs text-[var(--accent-color)] font-extrabold disabled:opacity-50">Load Master Backup Now</button>
      </div>
    </div>
  {/if}

  <!-- GEMINI API KEY MODAL -->
  {#if showAIKeyModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div class="neu-card max-w-lg w-full space-y-4">
        <div class="flex items-center justify-between border-b border-slate-700/10 pb-3">
          <h3 class="text-base font-extrabold text-purple-500"><i class="fa-solid fa-key text-purple-500 mr-2"></i>Set Gemini API Key (BYOK)</h3>
          <button on:click={() => showAIKeyModal = false} class="neu-btn w-8 h-8 p-0 rounded-xl text-[var(--text-muted)]"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="neu-panel-inset p-4 text-xs text-purple-500 space-y-2">
          <strong class="block font-bold">How to get your free Gemini API key:</strong>
          <ol class="list-decimal list-inside space-y-1 text-[11px]">
            <li>Go to <a href="https://aistudio.google.com/" target="_blank" class="underline font-bold">Google AI Studio (aistudio.google.com)</a></li>
            <li>Sign in with your Google Account & click <strong>Get API key</strong></li>
            <li>Create a key & paste it into the box below</li>
          </ol>
        </div>
        <div>
          <label for="gemini-api-key" class="text-xs font-bold block mb-1">Your Gemini API Key:</label>
          <input id="gemini-api-key" type="password" bind:value={geminiApiKey} placeholder="AIzaSy..." class="w-full neu-field text-xs font-mono text-purple-500">
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button on:click={() => showAIKeyModal = false} class="neu-btn text-xs text-[var(--text-muted)]">Cancel</button>
          <button on:click={saveGeminiKey} class="neu-btn text-xs text-purple-500 font-extrabold">Save Key Now</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- VIDEO PLAYER MODAL -->
  {#if showVideoModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div class="neu-card max-w-3xl w-full space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-extrabold truncate text-[var(--text-main)]"><i class="fa-brands fa-youtube text-red-500 mr-2"></i>{activeVideoTitle}</h3>
          <button on:click={() => showVideoModal = false} class="neu-btn w-8 h-8 p-0 rounded-xl text-[var(--text-muted)]"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="relative aspect-video w-full rounded-2xl overflow-hidden neu-panel-inset p-1">
          <iframe class="w-full h-full rounded-xl" src="https://www.youtube.com/embed/{activeVideoEmbedId}?autoplay=1" title="YouTube Video Player" frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  {/if}

</div>
