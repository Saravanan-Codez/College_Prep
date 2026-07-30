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
  import { 
    generateSyncPasscode, 
    getPairedDevices, 
    removePairedDevice, 
    executeUniversalP2PSync, 
    requestNativeBluetoothDevice, 
    initAutoSyncListener 
  } from './js/modules/bluetoothP2PSync.js';

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
  let showAIKeyModal = false;
  let showMusicModal = false;

  // Universal P2P Sync State
  let myPasscode = generateSyncPasscode();
  let pairedDevices = [];
  let inputPasscode = '';
  let isSyncing = false;
  let syncProgress = 0;
  let syncStatusMsg = '';

  let importStrategy = 'overwrite';
  let pendingImportData = null;

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
    pairedDevices = getPairedDevices();
    initAutoSyncListener((receivedState) => {
      if (receivedState) {
        currentDay = receivedState.currentDay || currentDay;
        completedTasks = { ...completedTasks, ...(receivedState.completedTasks || {}) };
        saveState();
        syncStatusMsg = "✅ Auto-Synced state file from paired device!";
      }
    });
  });

  function getFullStateObj() {
    return {
      currentDay, theme, completedTasks, customNotes, problemLogs, quizScores,
      xp, streakCount, unlockedBadges, soundMuted, flashcardsState, spotifyPlaylistId, geminiApiKey, chatMessages
    };
  }

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
    localStorage.setItem('college_prep_state', JSON.stringify(getFullStateObj()));
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

  function parseAndSetCustomSpotify() {
    if (!customSpotifyUrl.trim()) return;
    try {
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

  // --- UNIVERSAL CROSS-PLATFORM P2P SYNC ENGINE ---
  function handleStartUniversalP2PSync() {
    if (!inputPasscode.trim()) return;
    isSyncing = true;
    executeUniversalP2PSync(
      inputPasscode,
      getFullStateObj(),
      (pct, msg) => {
        syncProgress = pct;
        syncStatusMsg = msg;
      },
      (receivedData, updatedChain) => {
        isSyncing = false;
        if (updatedChain) pairedDevices = updatedChain;
        if (receivedData) {
          currentDay = receivedData.currentDay || currentDay;
          completedTasks = { ...completedTasks, ...(receivedData.completedTasks || {}) };
          saveState();
        }
        inputPasscode = '';
        addXP(30, "Universal P2P Sync");
      },
      (err) => {
        isSyncing = false;
        syncStatusMsg = `⚠️ ${err}`;
      }
    );
  }

  function handleNativeBluetoothScan() {
    syncStatusMsg = "Opening native Bluetooth scanner...";
    requestNativeBluetoothDevice(
      (connectedDev) => {
        pairedDevices = getPairedDevices();
        syncStatusMsg = `Connected to ${connectedDev.name}! Added to sync chain.`;
      },
      (err) => {
        syncStatusMsg = err;
      }
    );
  }

  function handleRemoveConnection(deviceId) {
    pairedDevices = removePairedDevice(deviceId);
    syncStatusMsg = "Connection removed from sync chain.";
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

  function exportJSON() {
    addXP(10, "JSON Export");
    const fullMasterState = {
      appVersion: "2.0.0",
      exportTimestamp: new Date().toISOString(),
      ...getFullStateObj()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullMasterState, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `engi_prep_master_state_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
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
</script>

<SplashScreen onFinish={() => splashFinished = true} />

<div class="app-shell">
  
  <!-- DESKTOP LEFT SIDEBAR NAVIGATION (ENGIPREP BY FALKON LABS) -->
  <aside class="sidebar-nav">
    <!-- App Brand Logo (Falkon Vector Emblem) -->
    <div class="neu-card" style="padding: 16px; display: flex; align-items: center; gap: 12px;">
      <div class="neu-card" style="width: 42px; height: 42px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--bg-color), rgba(59, 130, 246, 0.15)); padding: 0;">
        <svg width="26" height="26" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 25L50 85L85 25L65 25L50 60L35 25H15Z" fill="url(#brand_grad1)"/>
          <path d="M25 15L50 55L75 15H60L50 35L40 15H25Z" fill="url(#brand_grad2)"/>
          <defs>
            <linearGradient id="brand_grad1" x1="15" y1="25" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop stop-color="#3B82F6"/>
              <stop offset="1" stop-color="#06B6D4"/>
            </linearGradient>
            <linearGradient id="brand_grad2" x1="25" y1="15" x2="75" y2="55" gradientUnits="userSpaceOnUse">
              <stop stop-color="#60A5FA"/>
              <stop offset="1" stop-color="#3B82F6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div>
        <h1 style="font-size: 1.125rem; font-weight: 900; tracking-tight: -0.025em; color: var(--text-main);">EngiPrep</h1>
        <p style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">by Falkon Labs</p>
      </div>
    </div>

    <!-- Navigation Menu Items -->
    <nav style="display: flex; flex-direction: column; gap: 12px; flex-grow: 1;">
      <button on:click={() => activeTab = 'dashboard'} class="neu-btn {activeTab === 'dashboard' ? 'active' : ''}" style="justify-content: flex-start;">
        <i class="fa-solid fa-calendar-day" style="font-size: 0.875rem;"></i> 20-Day Schedule
      </button>
      <button on:click={() => activeTab = 'snippets'} class="neu-btn {activeTab === 'snippets' ? 'active' : ''}" style="justify-content: flex-start;">
        <i class="fa-solid fa-terminal" style="font-size: 0.875rem;"></i> C Playground
      </button>
      <button on:click={() => activeTab = 'flashcards'} class="neu-btn {activeTab === 'flashcards' ? 'active' : ''}" style="justify-content: flex-start;">
        <i class="fa-solid fa-layer-group" style="font-size: 0.875rem;"></i> Anki SM-2
      </button>
      <button on:click={() => activeTab = 'gamification'} class="neu-btn {activeTab === 'gamification' ? 'active' : ''}" style="justify-content: flex-start;">
        <i class="fa-solid fa-trophy" style="font-size: 0.875rem;"></i> Gamification & XP
      </button>
      <button on:click={() => activeTab = 'ai-mentor'} class="neu-btn {activeTab === 'ai-mentor' ? 'active' : ''}" style="justify-content: flex-start;">
        <i class="fa-solid fa-robot" style="font-size: 0.875rem;"></i> AI Study Coach
      </button>
    </nav>

    <!-- Sidebar Level Box -->
    <div class="neu-card" style="padding: 16px; text-align: center; display: flex; flex-direction: column; gap: 8px;">
      <span style="font-size: 0.75rem; font-weight: 800; color: var(--accent-amber); text-transform: uppercase; letter-spacing: 0.05em;">
        <i class="fa-solid fa-medal mr-1"></i> {levelInfo.title}
      </span>
      <div class="neu-panel-inset" style="padding: 2px; height: 10px; border-radius: 9999px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #f59e0b, #eab308); height: 100%; border-radius: 9999px; transition: width 0.5s ease; width: {(xp % 200) / 2}%"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.6875rem; font-family: monospace; font-weight: 700; color: var(--text-muted);">
        <span>{xp} XP</span>
        <span>{streakCount}d Streak 🔥</span>
      </div>
    </div>
  </aside>

  <!-- MAIN APP WORKSPACE CONTAINER -->
  <main class="main-workspace">

    <!-- TOP HEADER BAR -->
    <header class="top-header">
      <!-- Theme & Binaural Beat Controls -->
      <div class="header-left">
        <button on:click={toggleTheme} class="neu-btn">
          <i class="fa-solid {theme === 'dark' ? 'fa-sun' : 'fa-moon'}" style="color: {theme === 'dark' ? '#f59e0b' : '#4f46e5'};"></i>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div class="neu-panel-inset" style="padding: 4px; display: flex; gap: 6px; border-radius: 16px;">
          <button on:click={() => handleToggleSoundscape('alpha')} class="neu-btn {activeSoundscape === 'alpha' ? 'active' : ''}" style="height: 34px; padding: 0 12px; font-size: 0.75rem;">🧠 10Hz Alpha</button>
          <button on:click={() => handleToggleSoundscape('rain')} class="neu-btn {activeSoundscape === 'rain' ? 'active' : ''}" style="height: 34px; padding: 0 12px; font-size: 0.75rem;">🌧️ Rain</button>
          <button on:click={() => handleToggleSoundscape('off')} class="neu-btn {activeSoundscape === 'off' ? 'active' : ''}" style="height: 34px; padding: 0 12px; font-size: 0.75rem;">🔇 Off</button>
        </div>
      </div>

      <!-- Right Action Controls -->
      <div class="header-right">
        <button on:click={() => showMusicModal = true} class="neu-btn" style="color: var(--accent-green);">
          <i class="fa-brands fa-spotify"></i> Spotify Player
        </button>

        <button on:click={() => showP2PModal = true} class="neu-btn" style="color: var(--accent-cyan);">
          <i class="fa-bluetooth"></i> Universal P2P Sync ({pairedDevices.length})
        </button>

        <button on:click={() => showImportModal = true} class="neu-btn" style="color: var(--accent-color);">
          <i class="fa-solid fa-upload"></i> Load JSON
        </button>

        <button on:click={exportJSON} class="neu-btn" style="color: var(--accent-amber);">
          <i class="fa-solid fa-download"></i> Save JSON
        </button>
      </div>
    </header>

    <!-- TAB 1: 20-DAY SCHEDULE -->
    {#if activeTab === 'dashboard'}
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <!-- Day Selector Header Card -->
        <div class="neu-card" style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
          <div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
              <span class="neu-panel-inset" style="padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; color: var(--accent-color);">Day {currentDay}</span>
              <span class="neu-panel-inset" style="padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 800; color: var(--accent-purple);">{currentDayData.phase}</span>
            </div>
            <h2 style="font-size: 1.5rem; font-weight: 900; letter-spacing: -0.025em; margin-top: 8px; color: var(--text-main);">{currentDayData.dateStr}</h2>
            <p style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-top: 4px;">{currentDayData.math.topic} • {currentDayData.physics.topic}</p>
          </div>

          <select bind:value={currentDay} on:change={saveState} class="neu-field" style="font-weight: 800; cursor: pointer;">
            {#each CURRICULUM_DATA as dayObj}
              <option value={dayObj.day}>Day {dayObj.day}: {dayObj.dateStr.split(' (')[0]}</option>
            {/each}
          </select>
        </div>

        <!-- Time Block Sessions 2-Column Grid -->
        <div class="dashboard-grid">
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
            <div class="neu-card" style="justify-content: space-between; gap: 16px;">
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.625rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em;">{slot.title}</span>
                  <button aria-label={isChecked ? `Mark ${slot.title} as incomplete` : `Mark ${slot.title} as complete`} aria-pressed={isChecked} on:click={() => toggleTask(taskKey)} class="neu-btn neu-btn-icon {isChecked ? 'active' : ''}">
                    <i class="fa-solid {isChecked ? 'fa-circle-check' : 'fa-circle-check'}" style="font-size: 1.25rem; color: {isChecked ? 'var(--accent-green)' : 'var(--text-muted)'}; opacity: {isChecked ? '1' : '0.4'};"></i>
                  </button>
                </div>
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); text-decoration: {isChecked ? 'line-through' : 'none'}; opacity: {isChecked ? '0.5' : '1'};">{slot.subject.topic}</h4>
                <ul style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted); padding-left: 16px; display: flex; flex-direction: column; gap: 4px;">
                  {#each slot.subject.subtopics as st}
                    <li>{st}</li>
                  {/each}
                </ul>
              </div>

              <!-- Direct External YouTube Links (Opens directly in YT App / New Tab) -->
              {#if slot.subject.videos && slot.subject.videos.length > 0}
                <div style="padding-top: 12px; border-top: 1px solid rgba(113, 128, 150, 0.1); display: flex; flex-direction: column; gap: 6px;">
                  <span style="font-size: 0.625rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;"><i class="fa-brands fa-youtube" style="color: #ef4444; margin-right: 4px;"></i> Video Lessons:</span>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    {#each slot.subject.videos as vid}
                      <a href="https://www.youtube.com/results?search_query={encodeURIComponent(vid.title)}" target="_blank" rel="noopener noreferrer" class="lesson-link">
                        <i class="fa-solid fa-arrow-up-right-from-square" style="color: #ef4444; font-size: 0.75rem;"></i> {vid.title}
                      </a>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

    <!-- TAB 2: C PLAYGROUND -->
    {:else if activeTab === 'snippets'}
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div class="neu-card" style="gap: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-main);">{currentSnippet.title}</h3>
            <button on:click={handleRunCCode} class="neu-btn" style="color: var(--accent-green); font-weight: 800;">
              <i class="fa-solid fa-play"></i> Run C Code (Client-Side WASM)
            </button>
          </div>
          <textarea id="c-app-editor" rows="12" class="neu-field" style="height: auto; padding: 16px; font-family: monospace; font-size: 0.75rem; color: var(--accent-green); outline: none;">{currentSnippet.code}</textarea>
        </div>
        <div class="dashboard-grid">
          <div class="neu-card">
            <h4 style="font-size: 0.75rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Terminal Output (stdout)</h4>
            <pre><code id="c-app-output" style="font-size: 0.75rem; font-family: monospace; color: var(--accent-green);">$ ready.</code></pre>
          </div>
          <div class="neu-card">
            <h4 style="font-size: 0.75rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Stack Variable RAM Inspector</h4>
            <div id="c-app-table"></div>
          </div>
        </div>
      </div>

    <!-- TAB 3: ANKI SM-2 FLASHCARDS -->
    {:else if activeTab === 'flashcards'}
      <div style="max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
        <div class="perspective-1000" style="width: 100%; min-height: 260px; cursor: pointer;" on:click={flipCard}>
          <div class="neu-card transform-style-3d" style="width: 100%; height: 100%; min-height: 260px; justify-content: space-between; text-align: center; padding: 32px;">
            <span style="font-size: 0.75rem; font-weight: 900; color: var(--accent-purple); text-transform: uppercase; letter-spacing: 0.1em;">{currentCard.category}</span>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 24px 0;">{isFlashcardFlipped ? currentCard.answer : currentCard.question}</h3>
            <span style="font-size: 0.6875rem; font-family: monospace; color: var(--text-muted);">{isFlashcardFlipped ? currentCard.exp : 'Click to flip card 🔄'}</span>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
          <button on:click={() => rateFlashcard(1)} class="neu-btn" style="color: var(--accent-red);">Again (1d)</button>
          <button on:click={() => rateFlashcard(2)} class="neu-btn" style="color: var(--accent-amber);">Hard (2d)</button>
          <button on:click={() => rateFlashcard(3)} class="neu-btn" style="color: var(--accent-color);">Good (4d)</button>
          <button on:click={() => rateFlashcard(4)} class="neu-btn" style="color: var(--accent-green);">Easy (7d)</button>
        </div>
      </div>

    <!-- TAB 4: GAMIFICATION & BADGES -->
    {:else if activeTab === 'gamification'}
      <div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
        <div class="neu-card" style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 16px;">
          <div>
            <span style="font-size: 0.75rem; font-weight: 900; color: var(--accent-amber); text-transform: uppercase; letter-spacing: 0.1em;">Level Progress</span>
            <h2 style="font-size: 1.5rem; font-weight: 900; margin-top: 4px; color: var(--text-main);">{levelInfo.title}</h2>
            <p style="font-size: 0.75rem; color: var(--text-muted);">Earn XP by completing time blocks, running C code, and passing quizzes.</p>
          </div>
          <div class="neu-panel-inset" style="padding: 16px; text-align: center; font-family: monospace; border-radius: 20px;">
            <span style="font-size: 1.5rem; font-weight: 800; color: var(--accent-amber);">{xp}</span>
            <span style="display: block; font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total XP</span>
          </div>
        </div>

        <div class="neu-card" style="gap: 16px;">
          <h3 style="font-size: 0.875rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase;">Achievement Badges</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px;">
            {#each ACHIEVEMENTS as badge}
              {@const isUnlocked = xp >= badge.xpRequired}
              <div class="neu-card" style="padding: 16px; text-align: center; gap: 8px; opacity: {isUnlocked ? '1' : '0.4'};">
                <div class="neu-card" style="width: 48px; height: 48px; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--accent-amber);">
                  <i class="fa-solid {badge.icon}"></i>
                </div>
                <h4 style="font-size: 0.75rem; font-weight: 800; color: var(--text-main);">{badge.name}</h4>
                <p style="font-size: 0.625rem; color: var(--text-muted);">{badge.desc}</p>
                <span class="neu-panel-inset" style="font-size: 0.5625rem; font-family: monospace; padding: 2px 8px; border-radius: 9999px; color: var(--accent-amber); display: block;">{badge.xpRequired} XP</span>
              </div>
            {/each}
          </div>
        </div>
      </div>

    <!-- TAB 5: GEMINI AI COACH -->
    {:else if activeTab === 'ai-mentor'}
      <div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px;">
        <div class="neu-card" style="display: flex; flex-direction: row; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="neu-panel-inset" style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: var(--accent-purple); font-size: 1.25rem;">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-main);">Context-Aware Gemini AI Coach</h3>
              <p style="font-size: 0.75rem; color: var(--text-muted);">Context active: Day {currentDay} ({currentDayData.math.topic}), XP ({xp}).</p>
            </div>
          </div>
          <button on:click={() => showAIKeyModal = true} class="neu-btn" style="color: var(--accent-purple);">
            {geminiApiKey ? '🔑 Key Configured' : 'Set Gemini Key'}
          </button>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <button on:click={() => handleSendAiChat(`Explain Day ${currentDay} ${currentDayData.math.topic} with a simple step-by-step example.`)} class="neu-btn" style="font-size: 0.75rem; height: 36px;">💡 Explain Day {currentDay} Math Concept</button>
          <button on:click={() => handleSendAiChat("Debug my C playground code and suggest memory optimization tips.")} class="neu-btn" style="font-size: 0.75rem; height: 36px;">🐞 Debug My C Playground Code</button>
          <button on:click={() => handleSendAiChat("Evaluate my 20-day preparation progress and suggest high-yield revision topics.")} class="neu-btn" style="font-size: 0.75rem; height: 36px;">🏆 Evaluate My Study Progress</button>
        </div>

        <div class="neu-card" style="gap: 16px; max-height: 500px; overflow-y: auto;">
          {#each chatMessages as msg}
            <div class="{msg.role === 'user' ? 'neu-card' : 'neu-panel-inset'}" style="padding: 16px; border-radius: 16px; font-size: 0.75rem; line-height: 1.6; {msg.role === 'user' ? 'background-color: var(--accent-purple); color: white; margin-left: auto; max-width: 500px; font-weight: 700;' : ''}">
              <strong style="display: block; font-size: 0.625rem; text-transform: uppercase; font-weight: 900; margin-bottom: 4px; opacity: 0.75;">{msg.role === 'user' ? 'You' : 'Gemini AI Coach'}</strong>
              <div style="white-space: pre-wrap;">{msg.text}</div>
            </div>
          {/each}
          {#if isAiThinking}
            <div class="neu-panel-inset" style="padding: 12px; font-size: 0.75rem; color: var(--accent-purple); font-family: monospace;">
              Gemini is thinking & analyzing context...
            </div>
          {/if}
        </div>

        <div style="display: flex; gap: 12px;">
          <input type="text" bind:value={aiUserPrompt} on:keydown={(e) => e.key === 'Enter' && handleSendAiChat()} placeholder="Ask anything about Calculus, Physics, C Pointers, DSA, or study strategy..." class="neu-field" style="flex: 1;">
          <button on:click={() => handleSendAiChat()} class="neu-btn" style="color: var(--accent-purple);">
            <i class="fa-solid fa-paper-plane"></i> Send
          </button>
        </div>
      </div>
    {/if}
  </main>
</div>

<!-- MOBILE BOTTOM NAVIGATION DOCK -->
<nav class="mobile-nav">
  <button on:click={() => activeTab = 'dashboard'} class="neu-btn {activeTab === 'dashboard' ? 'active' : ''}" style="height: auto; padding: 6px 12px; flex-direction: column; gap: 4px; font-size: 0.625rem;"><i class="fa-solid fa-calendar-day"></i>Schedule</button>
  <button on:click={() => activeTab = 'snippets'} class="neu-btn {activeTab === 'snippets' ? 'active' : ''}" style="height: auto; padding: 6px 12px; flex-direction: column; gap: 4px; font-size: 0.625rem;"><i class="fa-solid fa-terminal"></i>C Code</button>
  <button on:click={() => activeTab = 'flashcards'} class="neu-btn {activeTab === 'flashcards' ? 'active' : ''}" style="height: auto; padding: 6px 12px; flex-direction: column; gap: 4px; font-size: 0.625rem;"><i class="fa-solid fa-layer-group"></i>Anki</button>
  <button on:click={() => activeTab = 'gamification'} class="neu-btn {activeTab === 'gamification' ? 'active' : ''}" style="height: auto; padding: 6px 12px; flex-direction: column; gap: 4px; font-size: 0.625rem;"><i class="fa-solid fa-trophy"></i>Stats</button>
  <button on:click={() => activeTab = 'ai-mentor'} class="neu-btn {activeTab === 'ai-mentor' ? 'active' : ''}" style="height: auto; padding: 6px 12px; flex-direction: column; gap: 4px; font-size: 0.625rem;"><i class="fa-solid fa-robot"></i>AI Coach</button>
</nav>

<!-- UNIVERSAL 100% CROSS-PLATFORM P2P SYNC MODAL -->
{#if showP2PModal}
  <div class="modal-overlay">
    <div class="modal-content" style="max-width: 560px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(113, 128, 150, 0.1); padding-bottom: 12px;">
        <h3 style="font-size: 1rem; font-weight: 800; color: var(--accent-cyan); display: flex; align-items: center; gap: 8px;"><i class="fa-bluetooth"></i> Universal P2P Sync Engine</h3>
        <button aria-label="Close P2P Sync modal" on:click={() => showP2PModal = false} class="neu-btn neu-btn-icon" style="width: 32px; height: 32px;"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <!-- Passcode Display Card -->
      <div class="neu-panel-inset" style="padding: 16px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <span style="font-size: 0.625rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block;">This Device's Sync Passcode</span>
          <div style="font-family: monospace; font-size: 1.5rem; font-weight: 900; color: var(--accent-amber); letter-spacing: 0.1em;">{myPasscode}</div>
        </div>
        <button on:click={handleNativeBluetoothScan} class="neu-btn" style="color: var(--accent-cyan);">
          <i class="fa-bluetooth"></i> Hardware BLE Scan
        </button>
      </div>

      <!-- User Instruction Note -->
      <div class="neu-panel-inset" style="padding: 12px; font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: flex-start; gap: 8px;">
        <i class="fa-solid fa-lightbulb" style="color: var(--accent-amber); font-size: 0.875rem; margin-top: 2px;"></i>
        <span>
          <strong>How to Pair PC & Mobile Instantly:</strong> Open EngiPrep on your other device, enter its 6-digit passcode below, and click <strong>Instant P2P Sync</strong>. State file transfers peer-to-peer with zero setup required!
        </span>
      </div>

      <!-- Universal Passcode Stream Form -->
      <div class="neu-card" style="padding: 16px; gap: 10px;">
        <h4 style="font-size: 0.8125rem; font-weight: 800; color: var(--text-main);">Connect to Target Device via Passcode:</h4>
        <div style="display: flex; gap: 8px;">
          <input type="text" bind:value={inputPasscode} placeholder="Enter 6-digit passcode (e.g. 798-002)" class="neu-field" style="flex: 1; font-family: monospace; font-size: 0.875rem; text-align: center;">
          <button on:click={handleStartUniversalP2PSync} disabled={isSyncing} class="neu-btn" style="color: var(--accent-green); font-weight: 800;">
            <i class="fa-solid fa-bolt"></i> {isSyncing ? 'Syncing...' : 'Instant P2P Sync'}
          </button>
        </div>
      </div>

      <!-- Sync Status & Progress Bar -->
      {#if isSyncing || syncStatusMsg}
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-family: monospace; font-weight: 700; color: var(--text-muted);">
            <span style="white-space: pre-wrap; word-break: break-word;">{syncStatusMsg}</span>
            {#if syncProgress > 0}<span>{syncProgress}%</span>{/if}
          </div>
          {#if isSyncing}
            <div class="neu-panel-inset" style="padding: 2px; height: 10px; border-radius: 9999px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, #06b6d4, #10b981); height: 100%; border-radius: 9999px; transition: width 0.3s ease; width: {syncProgress}%;"></div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Paired Devices Sync Chain -->
      <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(113, 128, 150, 0.1);">
        <span style="font-size: 0.6875rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Active Paired Sync Chain ({pairedDevices.length}):</span>
        {#if pairedDevices.length === 0}
          <div class="neu-panel-inset" style="padding: 12px; text-align: center; font-size: 0.75rem; color: var(--text-muted);">
            No paired devices. Enter passcode above to pair phone, PC, or tablet instantly.
          </div>
        {:else}
          {#each pairedDevices as pDev}
            <div class="neu-panel-inset" style="padding: 12px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-solid fa-laptop-mobile" style="font-size: 1.25rem; color: var(--accent-green);"></i>
                <div>
                  <strong style="font-size: 0.8125rem; color: var(--text-main); display: block;">{pDev.name}</strong>
                  <span style="font-size: 0.625rem; color: var(--text-muted); font-family: monospace;">Synced: {new Date(pDev.lastSynced).toLocaleTimeString()}</span>
                </div>
              </div>
              <button on:click={() => handleRemoveConnection(pDev.id)} class="neu-btn" style="height: 32px; padding: 0 10px; font-size: 0.6875rem; color: var(--accent-red);">
                <i class="fa-solid fa-trash"></i> Remove Connection
              </button>
            </div>
          {/each}
        {/if}
      </div>

    </div>
  </div>
{/if}

<!-- SPOTIFY EMBEDDED PLAYER MODAL -->
{#if showMusicModal}
  <div class="modal-overlay">
    <div class="modal-content">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <h3 style="font-size: 1rem; font-weight: 800; color: var(--accent-green); display: flex; align-items: center; gap: 8px;"><i class="fa-brands fa-spotify"></i> Spotify Focus Player</h3>
        <button aria-label="Close Spotify player modal" on:click={() => showMusicModal = false} class="neu-btn neu-btn-icon" style="width: 32px; height: 32px;"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div style="display: flex; gap: 8px; font-size: 0.75rem;">
        <button on:click={() => setSpotifyPlaylist('37i9dQZF1DWWQR0awA2vA8')} class="neu-btn" style="color: var(--accent-green); height: 36px; padding: 0 12px;">🎧 Focus Lofi</button>
        <button on:click={() => setSpotifyPlaylist('37i9dQZF1DXdLENHPmIOXM')} class="neu-btn" style="color: var(--accent-green); height: 36px; padding: 0 12px;">🎹 Deep Focus</button>
        <button on:click={() => setSpotifyPlaylist('37i9dQZF1DX0smYrA8MsOG')} class="neu-btn" style="color: var(--accent-green); height: 36px; padding: 0 12px;">🎻 Classical</button>
      </div>

      <div style="display: flex; gap: 8px;">
        <input type="text" bind:value={customSpotifyUrl} placeholder="Paste public Spotify Playlist URL..." class="neu-field" style="flex: 1;">
        <button on:click={parseAndSetCustomSpotify} class="neu-btn" style="color: var(--accent-green);">Load</button>
      </div>

      <div class="neu-panel-inset" style="padding: 4px; border-radius: 16px; overflow: hidden;">
        <iframe title="Spotify Player Embed" style="border-radius:12px" src="https://open.spotify.com/embed/playlist/{spotifyPlaylistId}?utm_source=generator&theme=0" width="100%" height="240" frameborder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
      </div>
    </div>
  </div>
{/if}

<!-- MASTER JSON IMPORT MODAL -->
{#if showImportModal}
  <div class="modal-overlay">
    <div class="modal-content">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(113, 128, 150, 0.1); padding-bottom: 12px;">
        <h3 style="font-size: 1rem; font-weight: 800; color: var(--accent-color);"><i class="fa-solid fa-upload mr-2"></i>Load Master State JSON</h3>
        <button aria-label="Close import modal" on:click={() => showImportModal = false} class="neu-btn neu-btn-icon" style="width: 32px; height: 32px;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <input type="file" accept=".json" on:change={handleFileSelect} style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">
        <label style="display: flex; align-items: center; gap: 6px;"><input type="radio" bind:group={importStrategy} value="overwrite"> Overwrite</label>
        <label style="display: flex; align-items: center; gap: 6px;"><input type="radio" bind:group={importStrategy} value="merge"> Merge</label>
      </div>
      <button on:click={executeImport} disabled={!pendingImportData} class="neu-btn" style="color: var(--accent-color); font-weight: 800;">Load Master Backup Now</button>
    </div>
  </div>
{/if}

<!-- GEMINI API KEY MODAL -->
{#if showAIKeyModal}
  <div class="modal-overlay">
    <div class="modal-content">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(113, 128, 150, 0.1); padding-bottom: 12px;">
        <h3 style="font-size: 1rem; font-weight: 800; color: var(--accent-purple);"><i class="fa-solid fa-key mr-2"></i>Set Gemini API Key (BYOK)</h3>
        <button aria-label="Close API key modal" on:click={() => showAIKeyModal = false} class="neu-btn neu-btn-icon" style="width: 32px; height: 32px;"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="neu-panel-inset" style="padding: 16px; font-size: 0.75rem; color: var(--accent-purple); display: flex; flex-direction: column; gap: 8px;">
        <strong style="font-weight: 800;">How to get your free Gemini API key:</strong>
        <ol style="padding-left: 16px; font-size: 0.6875rem; display: flex; flex-direction: column; gap: 4px;">
          <li>Go to <a href="https://aistudio.google.com/" target="_blank" class="lesson-link">Google AI Studio (aistudio.google.com)</a></li>
          <li>Sign in with your Google Account & click <strong>Get API key</strong></li>
          <li>Create a key & paste it into the box below</li>
        </ol>
      </div>
      <div>
        <label style="font-size: 0.75rem; font-weight: 700; display: block; margin-bottom: 4px;">Your Gemini API Key:</label>
        <input type="password" bind:value={geminiApiKey} placeholder="AIzaSy..." class="neu-field" style="width: 100%; font-family: monospace; color: var(--accent-purple);">
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px;">
        <button on:click={() => showAIKeyModal = false} class="neu-btn" style="color: var(--text-muted);">Cancel</button>
        <button on:click={saveGeminiKey} class="neu-btn" style="color: var(--accent-purple); font-weight: 800;">Save Key Now</button>
      </div>
    </div>
  </div>
{/if}
