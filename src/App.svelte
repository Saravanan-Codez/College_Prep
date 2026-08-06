<script>
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import SplashScreen from './components/SplashScreen.svelte';
  import falkonLogo from './resources/images/Falkon Labs.png';
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

  // ── Core State ─────────────────────────────────────────────────────
  let splashFinished = false;
  let activeTab = 'home';
  let currentDay = 1;
  let theme = 'dark';
  let completedTasks = {};
  let completedSubtasks = {};
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
  let activeSoundscape = 'off';
  let spotifyPlaylistId = '37i9dQZF1DWWQR0awA2vA8';
  let customSpotifyUrl = '';

  // ── WiFi LAN Sync ──────────────────────────────────────────────────
  let myPasscode = generateSyncPasscode();
  let pairedDevices = [];
  let isSyncing = false;
  let syncProgress = 0;
  let syncStatusMsg = '';

  // WiFi server state
  let wifiServerRunning = false;
  let wifiServerIPs = [];
  let wifiServerPort = 7842;
  let wifiConnectIP = '';
  let wifiConnectPort = 7842;
  let wifiSyncMode = 'pull'; // 'pull' = get from server, 'push' = send to server
  let isTauriApp = false;

  // ── Import ─────────────────────────────────────────────────────────
  let showImportModal = false;
  let importStrategy = 'overwrite';
  let pendingImportData = null;

  // ── AI Coach ───────────────────────────────────────────────────────
  let geminiApiKey = '';
  let aiUserPrompt = '';
  let isAiThinking = false;
  let chatMessages = [
    { role: 'assistant', text: "👋 Hello! I'm your Context-Aware Gemini AI Study Coach. I monitor your active day, topics, and C code to help you excel. How can I help?" }
  ];

  const sessionStartTime = Date.now();

  // ── Derived ────────────────────────────────────────────────────────
  $: levelInfo = getUserLevelInfo(xp);
  $: currentDayData = CURRICULUM_DATA.find(d => d.day === currentDay) || CURRICULUM_DATA[0];
  $: currentSnippet = C_SNIPPETS[currentDay] || C_SNIPPETS[1];
  $: currentQuiz = DAILY_QUIZZES[currentDay] || DAILY_QUIZZES[1];
  $: currentCard = FLASHCARDS[currentFlashcardIndex] || FLASHCARDS[0];
  $: completedTodayCount = [0,1,2,3,4,5].filter(id => !!completedTasks[`day${currentDay}_slot${id}`]).length;

  // ── Theme Reactivity ───────────────────────────────────────────────
  $: {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
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
        syncStatusMsg = "✅ Auto-synced from paired device!";
      }
    });

    const handleBeforeUnload = () => {
      if (pendingSave) performSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingSave) {
        performSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // Detect Tauri environment
    isTauriApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  });

  // ── Persistence ────────────────────────────────────────────────────
  function getFullStateObj() {
    return {
      currentDay, theme, completedTasks, completedSubtasks, customNotes, problemLogs, quizScores,
      xp, streakCount, unlockedBadges, soundMuted, flashcardsState,
      spotifyPlaylistId, geminiApiKey, chatMessages
    };
  }

  let saveTimeoutId = null;
  let pendingSave = false;

  function loadState() {
    const saved = localStorage.getItem('college_prep_state');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        currentDay           = p.currentDay || 1;
        theme                = p.theme || 'dark';
        completedTasks       = p.completedTasks || {};
        completedSubtasks    = p.completedSubtasks || {};
        customNotes          = p.customNotes || {};
        problemLogs          = p.problemLogs || {};
        quizScores           = p.quizScores || {};
        xp                   = p.xp || 0;
        streakCount          = p.streakCount || 1;
        unlockedBadges       = p.unlockedBadges || [];
        soundMuted           = p.soundMuted || false;
        flashcardsState      = p.flashcardsState || {};
        spotifyPlaylistId    = p.spotifyPlaylistId || '37i9dQZF1DWWQR0awA2vA8';
        geminiApiKey         = p.geminiApiKey || localStorage.getItem('gemini_api_key') || '';
        chatMessages         = p.chatMessages || chatMessages;
      } catch(e) {}
    }
  }

  function performSave() {
    if (!pendingSave) return;
    localStorage.setItem('college_prep_state', JSON.stringify(getFullStateObj()));
    if (geminiApiKey) localStorage.setItem('gemini_api_key', geminiApiKey);
  }

  // ── XP & Gamification ──────────────────────────────────────────────
  function addXP(amount, reason) {
    const oldLvl = getUserLevelInfo(xp).level;
    xp += amount;
    saveState();
    const newLvl = getUserLevelInfo(xp).level;
    if (newLvl > oldLvl) playLevelUpSound(soundMuted);
    else if (reason) playPopSound(soundMuted);
  }

  function toggleTask(taskKey) {
    completedTasks[taskKey] = !completedTasks[taskKey];
    if (completedTasks[taskKey]) addXP(50, "Session Completed");
    completedTasks = completedTasks;
    saveState();
  }

  // ── Flashcards ─────────────────────────────────────────────────────
  function flipCard() {
    isFlashcardFlipped = !isFlashcardFlipped;
    if (isFlashcardFlipped) playPopSound(soundMuted);
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

  // ── C Playground ───────────────────────────────────────────────────
  function handleRunCCode() {
    const editor = document.getElementById('c-app-editor');
    const output = document.getElementById('c-app-output');
    const table  = document.getElementById('c-app-table');
    if (editor && output && table) {
      executeCCode(editor.value, output, table);
      addXP(25, "C Code Executed");
    }
  }

  // ── AI Coach ───────────────────────────────────────────────────────
  async function handleSendAiChat(customPromptText) {
    const promptToSend = customPromptText || aiUserPrompt;
    if (!promptToSend.trim()) return;
    if (!geminiApiKey) { activeTab = 'settings'; return; }
    chatMessages = [...chatMessages, { role: 'user', text: promptToSend }];
    aiUserPrompt = '';
    isAiThinking = true;
    saveState();
    try {
      const activeCode = document.getElementById('c-app-editor')?.value || '';
      const reply = await sendGeminiPrompt(promptToSend, geminiApiKey, {
        currentDay, currentDayData, levelInfo, xp, activeCode, completedToday: completedTodayCount
      });
      chatMessages = [...chatMessages, { role: 'assistant', text: reply }];
      saveState();
      addXP(20, "AI Consulted");
    } catch(err) {
      chatMessages = [...chatMessages, { role: 'assistant', text: `⚠️ Error: ${err.message}` }];
      saveState();
    } finally {
      isAiThinking = false;
    }
  }

  // ── WiFi LAN Sync ──────────────────────────────────────────────────
  async function startWifiServer() {
    if (!isTauriApp) {
      syncStatusMsg = "⚠️ WiFi Sync only works in the installed app, not the browser.";
      return;
    }
    try {
      syncStatusMsg = "Starting server...";
      const stateJson = JSON.stringify(getFullStateObj());
      const ip = await invoke('start_sync_server', {
        port: wifiServerPort,
        initialState: stateJson
      });
      const allIPs = await invoke('get_local_network_ips');
      wifiServerIPs = allIPs;
      wifiServerRunning = true;
      syncStatusMsg = `✅ Server running — share your IP with the other device`;
    } catch(e) {
      syncStatusMsg = `⚠️ ${e}`;
    }
  }

  async function stopWifiServer() {
    if (!isTauriApp) return;
    try {
      await invoke('stop_sync_server');
      wifiServerRunning = false;
      wifiServerIPs = [];
      syncStatusMsg = 'Server stopped.';
    } catch(e) {
      syncStatusMsg = `⚠️ ${e}`;
    }
  }

  async function updateServerWithLatestState() {
    if (!isTauriApp || !wifiServerRunning) return;
    try {
      await invoke('update_server_state', { stateJson: JSON.stringify(getFullStateObj()) });
    } catch(e) {}
  }

  async function connectToDevice() {
    if (!wifiConnectIP.trim()) {
      syncStatusMsg = '⚠️ Enter the other device IP first.';
      return;
    }
    isSyncing = true;
    const base = `http://${wifiConnectIP.trim()}:${wifiConnectPort}`;
    try {
      // Check the other device is reachable
      syncStatusMsg = `Connecting to ${base}...`;
      syncProgress = 20;
      const pingResp = await fetch(`${base}/ping`);
      if (!pingResp.ok) throw new Error('Device not responding');
      syncProgress = 50;

      if (wifiSyncMode === 'pull') {
        // Pull state from other device
        syncStatusMsg = 'Pulling state from other device...';
        const resp = await fetch(`${base}/state`);
        if (!resp.ok) throw new Error('Failed to get state from device');
        const remoteState = await resp.json();
        syncProgress = 80;
        // Merge remote state
        currentDay      = remoteState.currentDay || currentDay;
        completedTasks  = { ...completedTasks, ...(remoteState.completedTasks || {}) };
        customNotes     = { ...customNotes,    ...(remoteState.customNotes || {}) };
        problemLogs     = { ...problemLogs,    ...(remoteState.problemLogs || {}) };
        quizScores      = { ...quizScores,     ...(remoteState.quizScores || {}) };
        xp              = Math.max(xp, remoteState.xp || 0);
        flashcardsState = { ...flashcardsState, ...(remoteState.flashcardsState || {}) };
        saveState();
        addXP(30, 'WiFi Sync');
        syncProgress = 100;
        syncStatusMsg = '✅ State pulled and merged from other device!';
      } else {
        // Push our state to other device
        syncStatusMsg = 'Pushing state to other device...';
        const resp = await fetch(`${base}/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getFullStateObj())
        });
        if (!resp.ok) throw new Error('Failed to push state');
        syncProgress = 100;
        syncStatusMsg = '✅ State pushed to other device!';
        addXP(20, 'WiFi Sync');
      }
    } catch(e) {
      syncStatusMsg = `⚠️ ${e.message || e}`;
      syncProgress = 0;
    } finally {
      isSyncing = false;
    }
  }

  function handleRemoveConnection(deviceId) {
    pairedDevices = removePairedDevice(deviceId);
    syncStatusMsg = 'Connection removed.';
  }

  // ── Spotify ────────────────────────────────────────────────────────
  function setSpotifyPlaylist(id) { spotifyPlaylistId = id; saveState(); }

  function parseAndSetCustomSpotify() {
    if (!customSpotifyUrl.trim()) return;
    try {
      const match = customSpotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/i);
      spotifyPlaylistId = (match && match[1]) ? match[1] : customSpotifyUrl.trim();
      customSpotifyUrl = '';
      saveState();
    } catch(e) {}
  }


  // ── Toast & Notifications ──────────────────────────────────────────
  let toastMsg = '';
  let toastTimeout = null;
  function showToast(msg) {
    toastMsg = msg;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toastMsg = ''; }, 3200);
  }

  function toggleSubtask(subKey, taskKey, totalSubcount) {
    completedSubtasks[subKey] = !completedSubtasks[subKey];
    completedSubtasks = completedSubtasks;

    let finishedCount = 0;
    for (let i = 0; i < totalSubcount; i++) {
      if (completedSubtasks[`${taskKey}_sub${i}`]) finishedCount++;
    }

    if (finishedCount === totalSubcount) {
      if (!completedTasks[taskKey]) {
        completedTasks[taskKey] = true;
        addXP(50, "All Subtopics Mastered!");
      }
    } else {
      if (completedSubtasks[subKey]) {
        addXP(15, "Subtopic Mastered");
      }
    }
    completedTasks = completedTasks;
    saveState();
  }

  function handleOpenVideo(vid) {
    const url = vid.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(vid.title || vid)}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && vid.embedId) {
      window.location.href = `vnd.youtube:${vid.embedId}`;
      setTimeout(() => { window.open(url, '_blank'); }, 600);
    } else {
      window.open(url, '_blank');
    }
  }

  function handleCopyVideoLink(vid) {
    const url = vid.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(vid.title || vid)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Exact YouTube link copied to clipboard! 📋");
    }
  }

  // ── Soundscape ─────────────────────────────────────────────────────
  function handleToggleSoundscape(type) {
    activeSoundscape = type;
    toggleAmbientSound(type, showToast);
  }


  // ── JSON Export ────────────────────────────────────────────────────
  function exportJSON() {
    addXP(10, "JSON Export");
    const sessionDuration = Math.round((Date.now() - sessionStartTime) / 1000);
    const allDaysProgress = CURRICULUM_DATA.map(d => ({
      day: d.day, title: d.title, topics: d.topics || [],
      slotsCompleted: [0,1,2,3,4,5].filter(id => !!completedTasks[`day${d.day}_slot${id}`]).length,
      totalSlots: 6,
      fullyCompleted: [0,1,2,3,4,5].every(id => !!completedTasks[`day${d.day}_slot${id}`]),
      notes: customNotes[`day${d.day}`] || null,
      problemLog: problemLogs[`day${d.day}`] || null,
      quizScore: quizScores[`day${d.day}`] || null
    }));
    const totalSlotsCompleted = Object.keys(completedTasks).filter(k => completedTasks[k]).length;
    const totalPossibleSlots = CURRICULUM_DATA.length * 6;
    const fullMasterState = {
      meta: {
        appName: "EngiPrep by Falkon Labs", appVersion: "2.0.0",
        exportedAt: new Date().toISOString(),
        exportedAtHuman: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        sessionDurationSeconds: sessionDuration,
        sessionDurationHuman: `${Math.floor(sessionDuration/3600)}h ${Math.floor((sessionDuration%3600)/60)}m ${sessionDuration%60}s`,
        platform: navigator.platform || 'unknown', userAgent: navigator.userAgent,
        language: navigator.language, screenResolution: `${screen.width}x${screen.height}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, online: navigator.onLine
      },
      progress: {
        currentDay, totalDays: CURRICULUM_DATA.length,
        completedDays: CURRICULUM_DATA.filter(d => [0,1,2,3,4,5].every(id => !!completedTasks[`day${d.day}_slot${id}`])).length,
        totalSlotsCompleted, totalPossibleSlots,
        overallCompletionPercent: Math.round((totalSlotsCompleted / totalPossibleSlots) * 100),
        streakCount, xp, level: levelInfo.level, levelTitle: levelInfo.title,
        xpToNextLevel: levelInfo.xpToNext, unlockedBadges,
        totalBadgesAvailable: ACHIEVEMENTS.length,
        flashcardsStudied: Object.keys(flashcardsState).length, currentFlashcardIndex
      },
      activityLog: allDaysProgress,
      completedTasks, completedSubtasks, customNotes, problemLogs, quizScores, flashcardsState,
      syncChain: { pairedDevices, myPasscode },
      aiChatHistory: chatMessages.map((m, i) => ({ index: i, role: m.role, text: m.text })),
      settings: { theme, soundMuted, spotifyPlaylistId, hasGeminiKey: !!geminiApiKey }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullMasterState, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "engi_prep_state.json");
    document.body.appendChild(a); a.click(); a.remove();
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try { pendingImportData = JSON.parse(ev.target.result); } catch(err) {}
      };
      reader.readAsText(files[0]);
    }
  }

  function executeImport() {
    if (!pendingImportData) return;
    if (importStrategy === 'overwrite') {
      currentDay    = pendingImportData.currentDay || 1;
      theme         = pendingImportData.theme || theme;
      completedTasks = pendingImportData.completedTasks || {};
      customNotes   = pendingImportData.customNotes || {};
      problemLogs   = pendingImportData.problemLogs || {};
      quizScores    = pendingImportData.quizScores || {};
      xp            = pendingImportData.xp || 0;
      streakCount   = pendingImportData.streakCount || 1;
      unlockedBadges = pendingImportData.unlockedBadges || [];
      flashcardsState = pendingImportData.flashcardsState || {};
      spotifyPlaylistId = pendingImportData.spotifyPlaylistId || spotifyPlaylistId;
      geminiApiKey  = pendingImportData.geminiApiKey || geminiApiKey;
      chatMessages  = pendingImportData.chatMessages || chatMessages;
    } else {
      completedTasks = { ...completedTasks, ...(pendingImportData.completedTasks || {}) };
      customNotes   = { ...customNotes,   ...(pendingImportData.customNotes || {}) };
      problemLogs   = { ...problemLogs,   ...(pendingImportData.problemLogs || {}) };
      quizScores    = { ...quizScores,    ...(pendingImportData.quizScores || {}) };
      xp += (pendingImportData.xp || 0);
      if (pendingImportData.geminiApiKey) geminiApiKey = pendingImportData.geminiApiKey;
    }
    saveState();
    showImportModal = false;
    pendingImportData = null;
  }

  // ── Page meta per tab ──────────────────────────────────────────────
  const tabMeta = {
    'home':         { icon: 'fa-house',          label: 'Dashboard'        },
    'dashboard':    { icon: 'fa-calendar-day',  label: '20-Day Schedule'  },
    'snippets':     { icon: 'fa-terminal',       label: 'C Playground'     },
    'flashcards':   { icon: 'fa-layer-group',    label: 'Anki SM-2'        },
    'gamification': { icon: 'fa-trophy',         label: 'XP & Achievements'},
    'ai-mentor':    { icon: 'fa-robot',          label: 'AI Study Coach'   },
    'settings':     { icon: 'fa-gear',           label: 'Settings'         },
  };

  $: currentTabMeta = tabMeta[activeTab] || tabMeta['home'];
</script>

<SplashScreen onFinish={() => splashFinished = true} />

<!-- ═══════════════════════════════════════════════════════ APP SHELL -->
<div class="app-shell">

  <!-- ─────────────────────────────────────── SIDEBAR (DESKTOP) -->
  <aside class="sidebar-nav">
    <!-- Brand -->
    <div class="sidebar-brand">
      <img src={falkonLogo} alt="Falkon Labs" class="sidebar-brand-logo" />
      <div class="sidebar-brand-text">
        <h1>EngiPrep</h1>
        <span>by Falkon Labs</span>
      </div>
    </div>

    <!-- Nav Items -->
    <nav aria-label="Main Navigation" class="sidebar-nav-items">
      <button class="nav-item {activeTab === 'home' ? 'active' : ''}"
              on:click={() => activeTab = 'home'}>
        <i class="fa-solid fa-house"></i> Dashboard
      </button>

      <span class="nav-section-label">Study</span>

      <button class="nav-item {activeTab === 'dashboard' ? 'active' : ''}"
              on:click={() => activeTab = 'dashboard'}>
        <i class="fa-solid fa-calendar-day"></i> 20-Day Schedule
      </button>

      <button class="nav-item {activeTab === 'snippets' ? 'active' : ''}"
              on:click={() => activeTab = 'snippets'}>
        <i class="fa-solid fa-terminal"></i> C Playground
      </button>

      <button class="nav-item {activeTab === 'flashcards' ? 'active' : ''}"
              on:click={() => activeTab = 'flashcards'}>
        <i class="fa-solid fa-layer-group"></i> Anki SM-2
      </button>

      <button class="nav-item {activeTab === 'gamification' ? 'active' : ''}"
              on:click={() => activeTab = 'gamification'}>
        <i class="fa-solid fa-trophy"></i> XP & Achievements
      </button>

      <button class="nav-item {activeTab === 'ai-mentor' ? 'active' : ''}"
              on:click={() => activeTab = 'ai-mentor'}>
        <i class="fa-solid fa-robot"></i> AI Study Coach
      </button>

      <div class="divider" style="margin: 8px 0;"></div>
      <span class="nav-section-label">App</span>

      <button class="nav-item {activeTab === 'settings' ? 'active' : ''}"
              on:click={() => activeTab = 'settings'}>
        <i class="fa-solid fa-gear"></i> Settings
      </button>
    </nav>

    <!-- XP Box -->
    <div class="sidebar-xp-box">
      <div class="xp-label">
        <i class="fa-solid fa-medal"></i> {levelInfo.title}
      </div>
      <div class="xp-bar-track">
        <div class="xp-bar-fill" style="width: {(xp % 200) / 2}%"></div>
      </div>
      <div class="xp-stats">
        <span>{xp} XP</span>
        <span>{streakCount}d 🔥</span>
      </div>
    </div>
  </aside>

  <!-- ─────────────────────────────────────── MAIN WORKSPACE -->
  <main class="main-workspace">

    <!-- Top Header -->
    <header class="top-header">
      <div class="header-page-title">
        <i class="fa-solid {currentTabMeta.icon}"></i>
        {currentTabMeta.label}
      </div>
      <div class="header-right">
        <span class="header-chip">
          <i class="fa-solid fa-star" style="color: var(--accent-amber);"></i>
          {xp} XP
        </span>
        <span class="header-chip">
          <i class="fa-solid fa-fire" style="color: var(--accent-red);"></i>
          {streakCount}d
        </span>
        <span class="header-chip" style="color: var(--accent-blue);">
          Day {currentDay} / {CURRICULUM_DATA.length}
        </span>
      </div>
    </header>

    <!-- Page Content -->
    <div class="page-content">

      <!-- ═══════════════════ TAB: HOME DASHBOARD -->
      {#if activeTab === 'home'}
        {@const totalDone = Object.keys(completedTasks).filter(k => completedTasks[k]).length}
        {@const totalSlots = CURRICULUM_DATA.length * 6}
        {@const pct = Math.round((totalDone / totalSlots) * 100)}
        {@const hour = new Date().getHours()}
        {@const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}

        <!-- Greeting Hero -->
        <div class="card" style="background: linear-gradient(135deg, rgba(56,139,253,0.12), rgba(163,113,247,0.08)); border-color: rgba(56,139,253,0.2); gap: 14px; padding: 28px;">
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: space-between;">
            <div>
              <p style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">{greeting} 👋</p>
              <h2 style="font-size: 1.75rem; font-weight: 900; letter-spacing: -0.03em; color: var(--text-main); line-height: 1.2;">
                Ready to grind,<br/>Engineer?
              </h2>
              <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 8px;">
                Day {currentDay} of {CURRICULUM_DATA.length} · {currentDayData.phase}
              </p>
            </div>
            <div style="text-align: center; background: rgba(56,139,253,0.1); border: 1px solid rgba(56,139,253,0.2); border-radius: 20px; padding: 20px 28px; min-width: 120px;">
              <div style="font-size: 2.25rem; font-weight: 900; color: var(--accent-blue); font-family: 'JetBrains Mono', monospace; line-height: 1;">{pct}%</div>
              <div style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px;">Complete</div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; color: var(--text-muted);">
              <span>Overall Progress</span>
              <span>{totalDone} / {totalSlots} sessions</span>
            </div>
            <div class="progress-track" style="height: 8px;">
              <div class="progress-fill" style="width: {pct}%;"></div>
            </div>
          </div>
        </div>

        <!-- Stats Row -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
          {#each [
            { label: 'XP Earned',   value: xp,                  icon: 'fa-bolt',           color: 'var(--accent-blue)',   mono: true },
            { label: 'Streak',      value: streakCount + 'd',   icon: 'fa-fire',            color: 'var(--accent-red)',    mono: false },
            { label: 'Level',       value: levelInfo.level,      icon: 'fa-medal',          color: 'var(--accent-amber)',  mono: true },
            { label: "Today's Done",value: completedTodayCount + '/6', icon: 'fa-check-circle', color: 'var(--accent-green)', mono: false },
          ] as s}
            <div class="card" style="align-items: center; text-align: center; gap: 8px; padding: 18px 12px; cursor: default;">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: color-mix(in srgb, {s.color} 15%, transparent); display: flex; align-items: center; justify-content: center; color: {s.color};">
                <i class="fa-solid {s.icon}"></i>
              </div>
              <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-main); {s.mono ? "font-family: 'JetBrains Mono', monospace;" : ''}">{s.value}</div>
              <div style="font-size: 0.65rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">{s.label}</div>
            </div>
          {/each}
        </div>

        <!-- Today's Focus -->
        <div class="card" style="gap: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div class="card-title">
              <i class="fa-solid fa-calendar-day" style="color: var(--accent-blue);"></i>
              Today's Focus — Day {currentDay}
            </div>
            <button on:click={() => activeTab = 'dashboard'} class="btn btn-sm btn-primary">
              Open Schedule <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            {#each [
              { icon: 'fa-calculator',     color: 'var(--accent-blue)',   label: 'Math',    topic: currentDayData.math?.topic,    id: 0 },
              { icon: 'fa-atom',           color: 'var(--accent-purple)', label: 'Physics', topic: currentDayData.physics?.topic,  id: 1 },
              { icon: 'fa-code',           color: 'var(--accent-green)',  label: 'C Prog',  topic: currentDayData.prog?.topic,     id: 2 },
              { icon: 'fa-diagram-project',color: 'var(--accent-amber)',  label: 'DSA',     topic: currentDayData.dsa?.topic,      id: 3 },
            ] as s}
              {@const done = !!completedTasks[`day${currentDay}_slot${s.id}`]}
              <div class="card-inset" style="display: flex; align-items: center; gap: 10px; padding: 12px; opacity: {done ? 0.5 : 1};">
                <div style="width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px; background: color-mix(in srgb, {s.color} 15%, transparent); display: flex; align-items: center; justify-content: center; color: {s.color}; font-size: 0.85rem;">
                  <i class="fa-solid {s.icon}"></i>
                </div>
                <div style="min-width: 0;">
                  <div style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">{s.label}</div>
                  <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; {done ? 'text-decoration: line-through;' : ''}">{s.topic || '—'}</div>
                </div>
                {#if done}<i class="fa-solid fa-circle-check" style="color: var(--accent-green); flex-shrink: 0; margin-left: auto;"></i>{/if}
              </div>
            {/each}
          </div>
        </div>

        <!-- Quick Actions -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          {#each [
            { icon: 'fa-layer-group',  color: 'var(--accent-purple)', tab: 'flashcards',   label: 'Practice Flashcards', sub: `${Object.keys(flashcardsState).length} cards studied` },
            { icon: 'fa-terminal',     color: 'var(--accent-green)',  tab: 'snippets',     label: 'C Playground',         sub: 'Write & run C code'  },
            { icon: 'fa-robot',        color: 'var(--accent-purple)', tab: 'ai-mentor',    label: 'AI Study Coach',        sub: geminiApiKey ? 'API key active' : 'Set up Gemini key' },
            { icon: 'fa-trophy',       color: 'var(--accent-amber)',  tab: 'gamification', label: 'XP & Badges',           sub: `${unlockedBadges.length}/${ACHIEVEMENTS.length} unlocked` },
          ] as a}
            <button on:click={() => activeTab = a.tab}
                    class="card" style="text-align: left; cursor: pointer; gap: 10px; padding: 18px; border: none; background: var(--bg-surface); transition: all 0.2s ease;"
                    on:mouseenter={(e) => e.currentTarget.style.borderColor = a.color.replace('var(', '').replace(')', '')}
                    on:mouseleave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style="width: 40px; height: 40px; border-radius: 11px; background: color-mix(in srgb, {a.color} 15%, transparent); display: flex; align-items: center; justify-content: center; color: {a.color}; font-size: 1rem;">
                <i class="fa-solid {a.icon}"></i>
              </div>
              <div>
                <div style="font-size: 0.875rem; font-weight: 700; color: var(--text-main);">{a.label}</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">{a.sub}</div>
              </div>
              <i class="fa-solid fa-arrow-right" style="color: var(--text-muted); font-size: 0.75rem; margin-left: auto; margin-top: auto;"></i>
            </button>
          {/each}
        </div>

      <!-- ═══════════════════ TAB: 20-DAY SCHEDULE -->
      {:else if activeTab === 'dashboard'}

        <!-- Day Selector -->
        <div class="card" style="flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
              <span class="pill pill-blue">Day {currentDay}</span>
              <span class="pill pill-purple">{currentDayData.phase}</span>
              <span class="pill pill-green">{completedTodayCount}/6 Done</span>
            </div>
            <h2 style="font-size: 1.375rem; font-weight: 800; letter-spacing: -0.025em; color: var(--text-main);">{currentDayData.dateStr}</h2>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">{currentDayData.math.topic} · {currentDayData.physics.topic}</p>
          </div>
          <select aria-label="Select study day" bind:value={currentDay} on:change={saveState} class="field" style="width: auto; min-width: 200px; cursor: pointer;">
            {#each CURRICULUM_DATA as dayObj}
              <option value={dayObj.day}>Day {dayObj.day}: {dayObj.dateStr.split(' (')[0]}</option>
            {/each}
          </select>
        </div>

        <!-- Progress Bar -->
        <div style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 600; color: var(--text-muted);">
            <span>Today's Progress</span>
            <span>{completedTodayCount}/6 sessions</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: {(completedTodayCount / 6) * 100}%"></div>
          </div>
        </div>

        <!-- Task Grid -->
        <div class="dashboard-grid">
          {#each [
            { id: 0, icon: 'fa-calculator',      title: 'Mathematics',         subject: currentDayData.math   },
            { id: 1, icon: 'fa-atom',             title: 'Physics',             subject: currentDayData.physics},
            { id: 2, icon: 'fa-code',             title: 'C Programming',       subject: currentDayData.prog   },
            { id: 3, icon: 'fa-diagram-project',  title: 'DSA Foundations',     subject: currentDayData.dsa    },
            { id: 4, icon: 'fa-globe',            title: 'Web Development',     subject: currentDayData.web    },
            { id: 5, icon: 'fa-book-open',        title: 'Technical Reading',   subject: { topic: currentDayData.reading, subtopics: ["Read assigned chapter", "Take journal notes"] } }
          ] as slot}
            {@const taskKey = `day${currentDay}_slot${slot.id}`}
            {@const isDone  = !!completedTasks[taskKey]}
            <div class="task-card {isDone ? 'completed' : ''}">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--bg-elevated); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--accent-blue); font-size: 0.8rem;">
                    <i class="fa-solid {slot.icon}"></i>
                  </div>
                  <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">{slot.title}</span>
                </div>
                <button on:click={() => toggleTask(taskKey)}
                        aria-label={isDone ? "Mark task as incomplete" : "Mark task as complete"}
                        style="background: none; border: none; cursor: pointer; padding: 4px; color: {isDone ? 'var(--accent-green)' : 'var(--text-muted)'}; font-size: 1.25rem; opacity: {isDone ? 1 : 0.35}; transition: all 0.2s ease;">
                  <i class="fa-solid fa-circle-check"></i>
                </button>
              </div>

              <div>
                <h4 class="task-title" style="font-size: 0.9375rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">{slot.subject.topic}</h4>

                <!-- Subtopic Checkbox Markers -->
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
                  {#each slot.subject.subtopics as st, stIdx}
                    {@const subKey = `${taskKey}_sub${stIdx}`}
                    {@const isSubDone = !!completedSubtasks[subKey]}
                    <button on:click={() => toggleSubtask(subKey, taskKey, slot.subject.subtopics.length)}
                            role="checkbox"
                            aria-checked={isSubDone}
                            style="display: flex; align-items: flex-start; gap: 8px; background: var(--bg-elevated); border: 1px solid {isSubDone ? 'rgba(63,185,80,0.3)' : 'var(--border)'}; padding: 6px 10px; border-radius: var(--radius-sm); text-align: left; cursor: pointer; transition: all 0.2s ease; width: 100%;">
                      <i class="fa-solid {isSubDone ? 'fa-square-check' : 'fa-square'}"
                         style="color: {isSubDone ? 'var(--accent-green)' : 'var(--text-muted)'}; font-size: 0.9rem; margin-top: 2px; flex-shrink: 0;"></i>
                      <span style="font-size: 0.775rem; color: {isSubDone ? 'var(--text-muted)' : 'var(--text-main)'}; {isSubDone ? 'text-decoration: line-through;' : ''} line-height: 1.4;">
                        {st}
                      </span>
                    </button>
                  {/each}
                </div>
              </div>

              {#if slot.subject.videos && slot.subject.videos.length > 0}
                <div style="border-top: 1px solid var(--border); padding-top: 10px; display: flex; flex-direction: column; gap: 6px;">
                  <span style="font-size: 0.6rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 5px;">
                    <i class="fa-brands fa-youtube" style="color: #f85149;"></i> Video Lessons
                  </span>
                  {#each slot.subject.videos as vid}
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                      <button on:click={() => handleOpenVideo(vid)} class="lesson-link" style="background: none; border: none; cursor: pointer; text-align: left; padding: 0; flex: 1; min-width: 0;">
                        <i class="fa-brands fa-youtube" style="font-size: 0.85rem; color: #f85149; margin-right: 4px;"></i>
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 100%;">{vid.title}</span>
                      </button>
                      <button on:click={() => handleCopyVideoLink(vid)} class="btn btn-sm" style="font-size: 0.65rem; height: 26px; padding: 0 8px; color: var(--text-muted);">
                        <i class="fa-solid fa-copy"></i> Copy
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>

      <!-- ═══════════════════ TAB: C PLAYGROUND -->
      {:else if activeTab === 'snippets'}
        <div class="card" style="gap: 14px;">
          <div class="card-header" style="margin-bottom: 0;">
            <div class="card-title">
              <i class="fa-solid fa-terminal"></i> {currentSnippet.title}
            </div>
            <button on:click={handleRunCCode} class="btn btn-success">
              <i class="fa-solid fa-play"></i> Run C Code
            </button>
          </div>
          <textarea id="c-app-editor" aria-label="C code editor" rows="14" class="field field-mono"
                    style="height: auto; resize: vertical; color: var(--accent-green); line-height: 1.6;"
          >{currentSnippet.code}</textarea>
        </div>

        <div class="dashboard-grid">
          <div class="card" style="gap: 10px;">
            <div class="card-title" style="margin-bottom: 4px;">
              <i class="fa-solid fa-square-terminal" style="color: var(--accent-green);"></i> Terminal Output
            </div>
            <div class="card-inset" style="min-height: 120px;">
              <pre><code id="c-app-output" style="font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; color: var(--accent-green); white-space: pre-wrap;">$ ready.</code></pre>
            </div>
          </div>
          <div class="card" style="gap: 10px;">
            <div class="card-title" style="margin-bottom: 4px;">
              <i class="fa-solid fa-memory" style="color: var(--accent-purple);"></i> Stack RAM Inspector
            </div>
            <div class="card-inset" style="min-height: 120px;">
              <div id="c-app-table"></div>
            </div>
          </div>
        </div>

      <!-- ═══════════════════ TAB: ANKI SM-2 -->
      {:else if activeTab === 'flashcards'}
        <div style="max-width: 580px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 20px;">
          <div class="card" style="align-items: center; text-align: center; gap: 8px; padding: 12px 16px;">
            <span class="pill pill-blue">{currentFlashcardIndex + 1} / {FLASHCARDS.length}</span>
            <span class="pill pill-purple">{currentCard.category}</span>
          </div>

          <!-- Flashcard -->
          <div class="perspective-1000" style="width: 100%; min-height: 240px; cursor: pointer;"
               role="button" tabindex="0"
               on:click={flipCard} on:keypress={(e) => e.key === 'Enter' && flipCard()}>
            <div class="card transform-style-3d"
                 style="min-height: 240px; align-items: center; justify-content: center; text-align: center; gap: 16px; padding: 32px; background: linear-gradient(135deg, var(--bg-surface), var(--bg-elevated));">
              <div style="font-size: 0.65rem; font-weight: 700; color: var(--accent-purple); text-transform: uppercase; letter-spacing: 0.1em;">
                {isFlashcardFlipped ? 'Answer' : 'Question'}
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-main); line-height: 1.5;">
                {isFlashcardFlipped ? currentCard.answer : currentCard.question}
              </h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">
                {isFlashcardFlipped ? currentCard.exp : 'Tap to reveal answer 🔄'}
              </p>
            </div>
          </div>

          {#if isFlashcardFlipped}
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
              <button on:click={() => rateFlashcard(1)} class="btn" style="color: var(--accent-red); flex-direction: column; height: auto; padding: 10px 0; gap: 3px;">
                <span style="font-size: 1rem;">😖</span><span style="font-size: 0.7rem; font-weight: 700;">Again</span><span style="font-size: 0.6rem; color: var(--text-muted);">1d</span>
              </button>
              <button on:click={() => rateFlashcard(2)} class="btn" style="color: var(--accent-amber); flex-direction: column; height: auto; padding: 10px 0; gap: 3px;">
                <span style="font-size: 1rem;">😐</span><span style="font-size: 0.7rem; font-weight: 700;">Hard</span><span style="font-size: 0.6rem; color: var(--text-muted);">2d</span>
              </button>
              <button on:click={() => rateFlashcard(3)} class="btn" style="color: var(--accent-blue); flex-direction: column; height: auto; padding: 10px 0; gap: 3px;">
                <span style="font-size: 1rem;">🙂</span><span style="font-size: 0.7rem; font-weight: 700;">Good</span><span style="font-size: 0.6rem; color: var(--text-muted);">4d</span>
              </button>
              <button on:click={() => rateFlashcard(4)} class="btn" style="color: var(--accent-green); flex-direction: column; height: auto; padding: 10px 0; gap: 3px;">
                <span style="font-size: 1rem;">😄</span><span style="font-size: 0.7rem; font-weight: 700;">Easy</span><span style="font-size: 0.6rem; color: var(--text-muted);">7d</span>
              </button>
            </div>
          {:else}
            <div style="text-align: center;">
              <p style="font-size: 0.78rem; color: var(--text-muted);">Tap the card to reveal the answer, then rate your recall</p>
            </div>
          {/if}
        </div>

      <!-- ═══════════════════ TAB: GAMIFICATION -->
      {:else if activeTab === 'gamification'}
        <div style="max-width: 900px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 20px;">

          <!-- Level Card -->
          <div class="card" style="flex-direction: row; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
               background: linear-gradient(135deg, var(--bg-surface), var(--bg-elevated));
               border-color: rgba(227,179,65,0.2);">
            <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
              <span class="pill pill-amber" style="width: fit-content;">
                <i class="fa-solid fa-medal"></i> Level {levelInfo.level}
              </span>
              <h2 style="font-size: 1.5rem; font-weight: 900; color: var(--text-main);">{levelInfo.title}</h2>
              <div class="progress-track">
                <div class="progress-fill" style="width: {(xp % 200) / 2}%; background: linear-gradient(90deg, #e3b341, #f59e0b);"></div>
              </div>
              <p style="font-size: 0.75rem; color: var(--text-muted);">Earn XP completing sessions, running C code, and rating flashcards.</p>
            </div>
            <div style="text-align: center; background: var(--bg-elevated); border: 1px solid rgba(227,179,65,0.25); border-radius: var(--radius-lg); padding: 20px 28px;">
              <div style="font-size: 2rem; font-weight: 900; color: var(--accent-amber); font-family: 'JetBrains Mono', monospace;">{xp}</div>
              <div style="font-size: 0.6rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-top: 2px;">Total XP</div>
            </div>
          </div>

          <!-- Stats Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
            {#each [
              { label: 'Streak',     value: `${streakCount}d`,                                   icon: 'fa-fire',         color: 'var(--accent-red)'   },
              { label: 'Days Done',  value: CURRICULUM_DATA.filter(d => [0,1,2,3,4,5].every(id => !!completedTasks[`day${d.day}_slot${id}`])).length, icon: 'fa-calendar-check', color: 'var(--accent-green)' },
              { label: 'Flashcards', value: Object.keys(flashcardsState).length,                 icon: 'fa-layer-group',  color: 'var(--accent-purple)' },
              { label: 'Badges',     value: `${unlockedBadges.length}/${ACHIEVEMENTS.length}`,   icon: 'fa-award',        color: 'var(--accent-amber)' },
            ] as stat}
              <div class="card" style="align-items: center; text-align: center; gap: 6px; padding: 16px;">
                <i class="fa-solid {stat.icon}" style="font-size: 1.25rem; color: {stat.color};"></i>
                <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); font-family: 'JetBrains Mono', monospace;">{stat.value}</div>
                <div style="font-size: 0.65rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">{stat.label}</div>
              </div>
            {/each}
          </div>

          <!-- Badges -->
          <div class="card" style="gap: 16px;">
            <div class="card-title">
              <i class="fa-solid fa-award" style="color: var(--accent-amber);"></i> Achievement Badges
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px;">
              {#each ACHIEVEMENTS as badge}
                {@const isUnlocked = xp >= badge.xpRequired}
                <div class="card-inset" style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding: 16px; opacity: {isUnlocked ? 1 : 0.35}; transition: opacity 0.3s ease;">
                  <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--bg-overlay); border: 1px solid {isUnlocked ? 'rgba(227,179,65,0.4)' : 'var(--border)'}; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: {isUnlocked ? 'var(--accent-amber)' : 'var(--text-muted)'};">
                    <i class="fa-solid {badge.icon}"></i>
                  </div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-main);">{badge.name}</div>
                  <div style="font-size: 0.65rem; color: var(--text-muted); line-height: 1.4;">{badge.desc}</div>
                  <span class="pill {isUnlocked ? 'pill-amber' : ''}" style="{!isUnlocked ? 'background: var(--bg-overlay); color: var(--text-muted); border-color: var(--border);' : ''}">{badge.xpRequired} XP</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

      <!-- ═══════════════════ TAB: AI STUDY COACH -->
      {:else if activeTab === 'ai-mentor'}
        <div style="max-width: 860px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 16px;">

          <!-- Header -->
          <div class="card" style="flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
               background: linear-gradient(135deg, var(--bg-surface), rgba(163,113,247,0.06));
               border-color: rgba(163,113,247,0.2);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(163,113,247,0.15); border: 1px solid rgba(163,113,247,0.3); display: flex; align-items: center; justify-content: center; color: var(--accent-purple); font-size: 1.2rem;">
                <i class="fa-solid fa-robot"></i>
              </div>
              <div>
                <div style="font-size: 0.9375rem; font-weight: 700; color: var(--text-main);">Gemini AI Study Coach</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Context: Day {currentDay} · {currentDayData.math.topic} · {xp} XP</div>
              </div>
            </div>
            {#if !geminiApiKey}
              <button on:click={() => activeTab = 'settings'} class="btn" style="color: var(--accent-purple); border-color: rgba(163,113,247,0.3);">
                <i class="fa-solid fa-key"></i> Set API Key in Settings
              </button>
            {:else}
              <span class="pill pill-purple"><i class="fa-solid fa-circle-check"></i> Key Active</span>
            {/if}
          </div>

          <!-- Quick Prompts -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button on:click={() => handleSendAiChat(`Explain Day ${currentDay} ${currentDayData.math.topic} with a simple step-by-step example.`)}
                    class="btn btn-sm" style="color: var(--accent-blue);">
              💡 Explain Today's Math
            </button>
            <button on:click={() => handleSendAiChat('Debug my C playground code and suggest memory optimization tips.')}
                    class="btn btn-sm" style="color: var(--accent-green);">
              🐞 Debug My C Code
            </button>
            <button on:click={() => handleSendAiChat('Evaluate my 20-day preparation progress and suggest high-yield revision topics.')}
                    class="btn btn-sm" style="color: var(--accent-amber);">
              🏆 Evaluate Progress
            </button>
          </div>

          <!-- Chat Window -->
          <div class="card" style="gap: 12px; max-height: 460px; overflow-y: auto; padding: 16px;">
            {#each chatMessages as msg}
              <div style="display: flex; flex-direction: column; gap: 3px; align-items: {msg.role === 'user' ? 'flex-end' : 'flex-start'};">
                <span class="chat-role-label">{msg.role === 'user' ? 'You' : 'Gemini AI'}</span>
                <div class="{msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}">
                  <div style="white-space: pre-wrap;">{msg.text}</div>
                </div>
              </div>
            {/each}
            {#if isAiThinking}
              <div class="chat-msg-ai" style="color: var(--accent-purple);">
                <i class="fa-solid fa-circle-notch" style="animation: spin 1s linear infinite; margin-right: 8px;"></i>
                Gemini is thinking...
              </div>
            {/if}
          </div>

          <!-- Input -->
          <div style="display: flex; gap: 10px;">
            <input type="text" aria-label="AI Coach prompt" bind:value={aiUserPrompt}
                   on:keydown={(e) => e.key === 'Enter' && handleSendAiChat()}
                   placeholder="Ask about Calculus, Physics, C pointers, DSA, or study strategy..."
                   class="field" style="flex: 1;" />
            <button on:click={() => handleSendAiChat()} class="btn btn-primary" disabled={isAiThinking} aria-busy={isAiThinking}>
              {#if isAiThinking}
                <i class="fa-solid fa-spinner fa-spin"></i> Sending...
              {:else}
                <i class="fa-solid fa-paper-plane"></i> Send
              {/if}
            </button>
          </div>
        </div>

      <!-- ═══════════════════ TAB: SETTINGS -->
      {:else if activeTab === 'settings'}
        <div style="max-width: 720px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 20px;">

          <!-- About Card -->
          <div class="card" style="flex-direction: row; align-items: center; gap: 16px;
               background: linear-gradient(135deg, var(--bg-surface), var(--bg-elevated));
               border-color: rgba(56,139,253,0.2);">
            <img src={falkonLogo} alt="Falkon Labs" style="width: 52px; height: 52px; object-fit: contain; border-radius: 12px; background: rgba(56,139,253,0.1); padding: 8px; border: 1px solid rgba(56,139,253,0.2);" />
            <div>
              <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); letter-spacing: -0.02em;">EngiPrep</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">by Falkon Labs · Version 2.0.0</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">20-Day Engineering Mastery System</div>
            </div>
          </div>

          <!-- Appearance -->
          <div class="card" style="gap: 18px;">
            <div class="settings-section-title">🎨 Appearance</div>

            <div class="settings-row">
              <div>
                <div class="settings-row-label">Theme</div>
                <div class="settings-row-sub">Switch between dark and light mode</div>
              </div>
              <div class="toggle-group">
                <button class="btn {theme === 'dark' ? 'active' : ''}" on:click={() => { theme = 'dark'; saveState(); }}>
                  <i class="fa-solid fa-moon"></i> Dark
                </button>
                <button class="btn {theme === 'light' ? 'active' : ''}" on:click={() => { theme = 'light'; saveState(); }}>
                  <i class="fa-solid fa-sun"></i> Light
                </button>
              </div>
            </div>
          </div>

          <!-- Soundscape -->
          <div class="card" style="gap: 18px;">
            <div class="settings-section-title">🔊 Focus Soundscape & Ambient Noises</div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div class="settings-row-label">Select Ambient Track / Beat:</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn {activeSoundscape === 'alpha' ? 'active' : ''}" on:click={() => handleToggleSoundscape('alpha')}>🧠 10Hz Alpha</button>
                <button class="btn {activeSoundscape === 'rain' ? 'active' : ''}" on:click={() => handleToggleSoundscape('rain')}>🌧️ Soft Rain</button>
                <button class="btn {activeSoundscape === 'pink' ? 'active' : ''}" on:click={() => handleToggleSoundscape('pink')}>📻 Focus Noise</button>
                <button class="btn {activeSoundscape === 'lofi' ? 'active' : ''}" on:click={() => handleToggleSoundscape('lofi')}>🎧 Live Lofi Stream</button>
                <button class="btn {activeSoundscape === 'off' ? 'active' : ''}" on:click={() => handleToggleSoundscape('off')}>🔇 Off</button>
              </div>
            </div>
          </div>

          <!-- Spotify -->
          <div class="card" style="gap: 18px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div class="settings-section-title" style="border: none; padding: 0;">🎵 Spotify Focus Player</div>
              <a href="https://open.spotify.com/playlist/{spotifyPlaylistId}" target="_blank" rel="noopener noreferrer"
                 class="btn btn-sm" style="color: var(--accent-green); border-color: rgba(63,185,80,0.3);">
                <i class="fa-brands fa-spotify"></i> Open in Spotify App
              </a>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button on:click={() => setSpotifyPlaylist('37i9dQZF1DWWQR0awA2vA8')} class="btn btn-sm" style="color: var(--accent-green);">🎧 Focus Lofi</button>
              <button on:click={() => setSpotifyPlaylist('37i9dQZF1DXdLENHPmIOXM')} class="btn btn-sm" style="color: var(--accent-green);">🎹 Deep Focus</button>
              <button on:click={() => setSpotifyPlaylist('37i9dQZF1DX0smYrA8MsOG')} class="btn btn-sm" style="color: var(--accent-green);">🎻 Classical</button>
            </div>
            <div style="display: flex; gap: 8px;">
              <input type="text" aria-label="Custom Spotify playlist URL" bind:value={customSpotifyUrl} placeholder="Paste Spotify playlist URL..." class="field" style="flex: 1;" />
              <button on:click={parseAndSetCustomSpotify} class="btn" style="color: var(--accent-green);">Load</button>
            </div>
            <div class="card-inset" style="padding: 4px; border-radius: 14px; overflow: hidden;">
              <iframe title="Spotify Player" style="border-radius: 10px;"
                      src="https://open.spotify.com/embed/playlist/{spotifyPlaylistId}?utm_source=generator&theme=0"
                      width="100%" height="200" frameborder="0" allowfullscreen=""
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy">
              </iframe>
            </div>
          </div>

          <!-- Gemini API Key -->
          <div class="card" style="gap: 18px; border-color: rgba(163,113,247,0.2);">
            <div class="settings-section-title">🤖 Gemini AI Coach</div>
            <div class="card-inset" style="font-size: 0.8rem; color: var(--text-sub); line-height: 1.6;">
              <strong style="color: var(--accent-purple);">Get your free API key:</strong>
              Go to <a href="https://aistudio.google.com/" target="_blank" class="lesson-link" style="color: var(--accent-purple);">aistudio.google.com</a>,
              sign in, click <strong>Get API Key</strong>, and paste it below.
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <label for="gemini-key-input" style="font-size: 0.8rem; font-weight: 600; color: var(--text-main); white-space: nowrap;">API Key:</label>
              <input id="gemini-key-input" type="password" bind:value={geminiApiKey}
                     placeholder="AIzaSy..." class="field field-mono" style="color: var(--accent-purple);" />
              <button on:click={saveState} class="btn btn-sm" style="color: var(--accent-purple); white-space: nowrap;">
                <i class="fa-solid fa-floppy-disk"></i> Save
              </button>
            </div>
            {#if geminiApiKey}
              <span class="pill pill-purple" style="width: fit-content;"><i class="fa-solid fa-circle-check"></i> Key Saved</span>
            {/if}
          </div>

          <!-- WiFi LAN Sync (Tauri app only) -->
          {#if isTauriApp}
          <div class="card" style="gap: 18px; border-color: rgba(57,208,216,0.2);">
            <div class="settings-section-title">📡 WiFi LAN Sync</div>

            <div class="card-inset" style="font-size: 0.8rem; color: var(--text-sub); line-height: 1.7;">
              <strong style="color: var(--accent-cyan);">How it works:</strong>
              Both devices must be on the same network (mobile hotspot works perfectly).
              One device starts the server and shares its IP. The other enters that IP and syncs.
            </div>

            <!-- Step 1: This device as server -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;">
                Step 1 — Host: Start server on this device
              </div>

              {#if !wifiServerRunning}
                <button on:click={startWifiServer} class="btn btn-success" style="height: 44px;">
                  <i class="fa-solid fa-server"></i> Start Sync Server (port {wifiServerPort})
                </button>
              {:else}
                <div class="card-inset" style="border-color: rgba(63,185,80,0.3);">
                  <div style="font-size: 0.65rem; font-weight: 700; color: var(--accent-green); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
                    <i class="fa-solid fa-circle"></i> Server Running on port {wifiServerPort}
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 10px;">Share one of these IPs with the other device:</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    {#each wifiServerIPs as ip}
                      <button on:click={() => navigator.clipboard?.writeText(ip)}
                              class="btn btn-sm" style="font-family: 'JetBrains Mono', monospace; color: var(--accent-cyan); letter-spacing: 0.05em; border-color: rgba(57,208,216,0.3);">
                        <i class="fa-solid fa-copy"></i> {ip}
                      </button>
                    {/each}
                  </div>
                </div>
                <button on:click={stopWifiServer} class="btn btn-sm" style="color: var(--accent-red); border-color: rgba(248,81,73,0.3); width: fit-content;">
                  <i class="fa-solid fa-stop"></i> Stop Server
                </button>
              {/if}
            </div>

            <div class="divider"></div>

            <!-- Step 2: This device as client -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;">
                Step 2 — Client: Connect to the other device
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <input type="text" aria-label="WiFi Connect IP" bind:value={wifiConnectIP}
                       placeholder="Enter IP (e.g. 192.168.43.5)"
                       class="field field-mono" style="flex: 1; min-width: 160px;" />
                <span style="font-size: 0.8rem; color: var(--text-muted);">:</span>
                <input type="number" aria-label="WiFi Connect Port" bind:value={wifiConnectPort}
                       class="field field-mono" style="width: 80px;" min="1024" max="65535" />
              </div>

              <div class="toggle-group">
                <button class="btn {wifiSyncMode === 'pull' ? 'active' : ''}"
                        on:click={() => wifiSyncMode = 'pull'}>
                  <i class="fa-solid fa-download"></i> Pull from server
                </button>
                <button class="btn {wifiSyncMode === 'push' ? 'active' : ''}"
                        on:click={() => wifiSyncMode = 'push'}>
                  <i class="fa-solid fa-upload"></i> Push to server
                </button>
              </div>

              <div class="card-inset" style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.5;">
                {#if wifiSyncMode === 'pull'}
                  <i class="fa-solid fa-download" style="color: var(--accent-blue); margin-right: 5px;"></i>
                  <strong>Pull</strong>: Downloads and merges the server state into this device. XP keeps the higher value.
                {:else}
                  <i class="fa-solid fa-upload" style="color: var(--accent-amber); margin-right: 5px;"></i>
                  <strong>Push</strong>: Uploads this device state to the server, overwriting it.
                {/if}
              </div>

              <button on:click={connectToDevice} disabled={isSyncing} class="btn btn-primary" aria-busy={isSyncing}>
                {#if isSyncing}
                  <i class="fa-solid fa-spinner fa-spin"></i> Syncing...
                {:else}
                  <i class="fa-solid fa-bolt"></i>
                  {wifiSyncMode === 'pull' ? 'Pull State' : 'Push State'}
                {/if}
              </button>
            </div>

            {#if syncStatusMsg}
              <div class="card-inset" style="font-size: 0.78rem; color: var(--text-sub); font-family: 'JetBrains Mono', monospace;">
                {syncStatusMsg}
                {#if isSyncing || syncProgress > 0}
                  <div class="progress-track" style="margin-top: 8px;">
                    <div class="progress-fill" style="width: {syncProgress}%; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));"></div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>


          {/if}<!-- /isTauriApp -->

          <!-- Data Management -->
          <div class="card" style="gap: 18px;">
            <div class="settings-section-title">💾 Data Management</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <button on:click={exportJSON} class="btn" style="color: var(--accent-amber); border-color: rgba(227,179,65,0.3); height: 48px;">
                <i class="fa-solid fa-download"></i> Export State JSON
              </button>
              <button on:click={() => showImportModal = true} class="btn" style="color: var(--accent-blue); border-color: rgba(56,139,253,0.3); height: 48px;">
                <i class="fa-solid fa-upload"></i> Import State JSON
              </button>
            </div>
            <div class="card-inset" style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.6;">
              Export saves your full progress, XP, flashcard states, notes, AI chat history, and all settings to <code style="font-family: 'JetBrains Mono', monospace; color: var(--accent-amber);">engi_prep_state.json</code>.
              Import to restore on another device.
            </div>
          </div>

        </div>
      {/if}

    </div><!-- /page-content -->
  </main>
</div>

{#if toastMsg}
  <div style="position: fixed; bottom: 85px; right: 20px; z-index: 99999; background: var(--bg-elevated); border: 1px solid var(--accent-blue); color: var(--text-main); font-size: 0.8rem; font-weight: 600; padding: 10px 18px; border-radius: var(--radius-md); box-shadow: var(--shadow-hover); display: flex; align-items: center; gap: 8px; animation: slideUp 0.25s ease;">
    {toastMsg}
  </div>
{/if}


<!-- ════════════════════════════════════════ MOBILE BOTTOM NAV -->
<nav aria-label="Mobile Navigation" class="mobile-nav">
  <button class="mobile-nav-item {activeTab === 'home' ? 'active' : ''}"
          on:click={() => activeTab = 'home'}>
    <i class="fa-solid fa-house"></i> Home
  </button>
  <button class="mobile-nav-item {activeTab === 'dashboard' ? 'active' : ''}"
          on:click={() => activeTab = 'dashboard'}>
    <i class="fa-solid fa-calendar-day"></i> Schedule
  </button>
  <button class="mobile-nav-item {activeTab === 'snippets' ? 'active' : ''}"
          on:click={() => activeTab = 'snippets'}>
    <i class="fa-solid fa-terminal"></i> C Code
  </button>
  <button class="mobile-nav-item {activeTab === 'flashcards' ? 'active' : ''}"
          on:click={() => activeTab = 'flashcards'}>
    <i class="fa-solid fa-layer-group"></i> Anki
  </button>
  <button class="mobile-nav-item {activeTab === 'gamification' ? 'active' : ''}"
          on:click={() => activeTab = 'gamification'}>
    <i class="fa-solid fa-trophy"></i> XP
  </button>
  <button class="mobile-nav-item {activeTab === 'ai-mentor' ? 'active' : ''}"
          on:click={() => activeTab = 'ai-mentor'}>
    <i class="fa-solid fa-robot"></i> AI
  </button>
  <button class="mobile-nav-item {activeTab === 'settings' ? 'active' : ''}"
          on:click={() => activeTab = 'settings'}>
    <i class="fa-solid fa-gear"></i> Settings
  </button>
</nav>

<!-- ════════════════════════════════════════ IMPORT MODAL -->
{#if showImportModal}
  <div class="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <div class="modal-title"><i class="fa-solid fa-upload" style="color: var(--accent-blue);"></i> Import State JSON</div>
        <button on:click={() => showImportModal = false} class="btn btn-icon" aria-label="Close import modal">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <input type="file" aria-label="Select state JSON file" accept=".json" on:change={handleFileSelect}
             style="font-size: 0.8rem; color: var(--text-sub); cursor: pointer;" />
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; color: var(--text-main); cursor: pointer;">
          <input type="radio" bind:group={importStrategy} value="overwrite" /> Overwrite all
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 600; color: var(--text-main); cursor: pointer;">
          <input type="radio" bind:group={importStrategy} value="merge" /> Merge with current
        </label>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button on:click={() => showImportModal = false} class="btn">Cancel</button>
        <button on:click={executeImport} disabled={!pendingImportData} class="btn btn-primary">
          <i class="fa-solid fa-file-import"></i> Load Backup
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
</style>
