<script>
  import { onMount } from 'svelte';
  import { CURRICULUM_DATA } from './js/data/curriculum.js';
  import { DAILY_QUIZZES } from './js/data/quizzes.js';
  import { C_SNIPPETS } from './js/data/snippets.js';
  import { FLASHCARDS } from './js/data/flashcards.js';
  import { playPopSound, playLevelUpSound } from './js/modules/audio.js';
  import { getUserLevelInfo, ACHIEVEMENTS } from './js/modules/gamification.js';
  import { calculateSM2 } from './js/modules/sm2Engine.js';
  import { extractAndRenderMemoryTable, executeCCode } from './js/modules/cRunner.js';
  import { sendGeminiPrompt } from './js/modules/aiMentor.js';

  let currentDay = 1;
  let activeTab = 'dashboard';
  let completedTasks = {};
  let customNotes = {};
  let problemLogs = {};
  let quizScores = {};
  let energyLevels = {};
  let completedFocusSessions = 0;
  let xp = 0;
  let streakCount = 1;
  let unlockedBadges = [];
  let soundMuted = false;
  let theme = 'slate';
  let flashcardsState = {};

  let currentFlashcardIndex = 0;
  let isFlashcardFlipped = false;

  let showP2PModal = false;
  let showImportModal = false;
  let showVideoModal = false;
  let showAIKeyModal = false;

  let activeVideoTitle = '';
  let activeVideoEmbedId = '';

  let importStrategy = 'overwrite';
  let pendingImportData = null;

  // AI Mentor State
  let geminiApiKey = '';
  let aiUserPrompt = '';
  let isAiThinking = false;
  let chatMessages = [
    { role: 'assistant', text: "👋 Hello! I'm your Context-Aware Gemini AI Study Coach. I automatically track your daily progress, active subjects, and C playground code. How can I help you excel today?" }
  ];

  $: levelInfo = getUserLevelInfo(xp);
  $: currentDayData = CURRICULUM_DATA.find(d => d.day === currentDay) || CURRICULUM_DATA[0];
  $: currentSnippet = C_SNIPPETS[currentDay] || C_SNIPPETS[1];
  $: currentQuiz = DAILY_QUIZZES[currentDay] || DAILY_QUIZZES[1];
  $: currentCard = FLASHCARDS[currentFlashcardIndex] || FLASHCARDS[0];

  onMount(() => {
    loadState();
    geminiApiKey = localStorage.getItem('gemini_api_key') || '';
  });

  function loadState() {
    const saved = localStorage.getItem('college_prep_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        currentDay = parsed.currentDay || 1;
        completedTasks = parsed.completedTasks || {};
        customNotes = parsed.customNotes || {};
        problemLogs = parsed.problemLogs || {};
        quizScores = parsed.quizScores || {};
        energyLevels = parsed.energyLevels || {};
        completedFocusSessions = parsed.completedFocusSessions || 0;
        xp = parsed.xp || 0;
        streakCount = parsed.streakCount || 1;
        unlockedBadges = parsed.unlockedBadges || [];
        soundMuted = parsed.soundMuted || false;
        theme = parsed.theme || 'slate';
        flashcardsState = parsed.flashcardsState || {};
      } catch(e){}
    }
  }

  function saveState() {
    localStorage.setItem('college_prep_state', JSON.stringify({
      currentDay, completedTasks, customNotes, problemLogs, quizScores,
      energyLevels, completedFocusSessions, xp, streakCount, unlockedBadges, soundMuted, theme, flashcardsState
    }));
  }

  function saveGeminiKey() {
    localStorage.setItem('gemini_api_key', geminiApiKey.trim());
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
    const editor = document.getElementById('svelte-c-editor');
    const output = document.getElementById('svelte-c-output');
    const table = document.getElementById('svelte-c-table');
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

    try {
      const activeCode = document.getElementById('svelte-c-editor') ? document.getElementById('svelte-c-editor').value : '';
      const reply = await sendGeminiPrompt(promptToSend, geminiApiKey, {
        currentDay,
        currentDayData,
        levelInfo,
        xp,
        activeCode
      });
      chatMessages = [...chatMessages, { role: 'assistant', text: reply }];
      addXP(20, "AI Assistance Used");
    } catch(err) {
      chatMessages = [...chatMessages, { role: 'assistant', text: `⚠️ Error: ${err.message}` }];
    } finally {
      isAiThinking = false;
    }
  }

  function exportJSON() {
    addXP(10, "JSON Export");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      currentDay, completedTasks, customNotes, problemLogs, quizScores,
      energyLevels, completedFocusSessions, xp, streakCount, unlockedBadges, theme, flashcardsState
    }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `college_prep_progress_backup_${new Date().toISOString().slice(0, 10)}.json`);
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
      completedTasks = pendingImportData.completedTasks || {};
      customNotes = pendingImportData.customNotes || {};
      problemLogs = pendingImportData.problemLogs || {};
      quizScores = pendingImportData.quizScores || {};
      energyLevels = pendingImportData.energyLevels || {};
      completedFocusSessions = pendingImportData.completedFocusSessions || 0;
      xp = pendingImportData.xp || 0;
      streakCount = pendingImportData.streakCount || 1;
      unlockedBadges = pendingImportData.unlockedBadges || [];
      flashcardsState = pendingImportData.flashcardsState || {};
    } else {
      completedTasks = { ...completedTasks, ...(pendingImportData.completedTasks || {}) };
      customNotes = { ...customNotes, ...(pendingImportData.customNotes || {}) };
      problemLogs = { ...problemLogs, ...(pendingImportData.problemLogs || {}) };
      quizScores = { ...quizScores, ...(pendingImportData.quizScores || {}) };
      xp += (pendingImportData.xp || 0);
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

<main class="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex flex-col pb-16 lg:pb-0">
  
  <!-- Top App Navigation Header -->
  <header class="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-40 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
        <i class="fa-solid fa-graduation-cap text-lg"></i>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="font-extrabold text-base sm:text-lg text-white">CS College Prep OS v2.0</h1>
          <span class="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">Gemini AI Inside</span>
        </div>
        <p class="text-xs text-slate-400 hidden sm:block">Computer Science & Engineering Prep OS</p>
      </div>
    </div>

    <!-- Controls: AI Key, Bluetooth, JSON Load/Export -->
    <div class="flex items-center gap-2">
      <!-- AI Key Settings Button -->
      <button on:click={() => showAIKeyModal = true} class="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center gap-1.5 transition-colors">
        <i class="fa-solid fa-key text-purple-400"></i>
        <span class="hidden md:inline">{geminiApiKey ? 'Gemini Key Configured' : 'Set Gemini Key'}</span>
      </button>

      <!-- P2P Bluetooth Sync Button -->
      <button on:click={() => showP2PModal = true} class="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-colors">
        <i class="fa-bluetooth text-cyan-400"></i>
        <span class="hidden md:inline">Bluetooth Sync</span>
      </button>

      <!-- JSON Load Button -->
      <button on:click={() => showImportModal = true} class="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-colors">
        <i class="fa-solid fa-upload text-emerald-400"></i>
        <span class="hidden md:inline">Load JSON</span>
      </button>

      <!-- JSON Export Button -->
      <button on:click={exportJSON} class="px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-colors">
        <i class="fa-solid fa-download text-blue-400"></i>
        <span class="hidden md:inline">Export JSON</span>
      </button>
    </div>
  </header>

  <!-- Desktop Tab Navigation -->
  <nav class="hidden lg:flex border-b border-slate-800 bg-slate-950 px-6 py-2 gap-2 text-xs font-semibold">
    <button on:click={() => activeTab = 'dashboard'} class="px-4 py-2 rounded-xl transition-all {activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900'}"><i class="fa-solid fa-calendar-day mr-1.5"></i>Schedule</button>
    <button on:click={() => activeTab = 'snippets'} class="px-4 py-2 rounded-xl transition-all {activeTab === 'snippets' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900'}"><i class="fa-solid fa-terminal mr-1.5"></i>C Playground</button>
    <button on:click={() => activeTab = 'flashcards'} class="px-4 py-2 rounded-xl transition-all {activeTab === 'flashcards' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white bg-slate-900'}"><i class="fa-solid fa-layer-group mr-1.5"></i>Anki SM-2</button>
    <button on:click={() => activeTab = 'ai-mentor'} class="px-4 py-2 rounded-xl transition-all {activeTab === 'ai-mentor' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-400 hover:text-white bg-slate-900 border border-purple-500/30'}"><i class="fa-solid fa-robot mr-1.5"></i>AI Study Coach</button>
  </nav>

  <!-- Content Workspace -->
  <div class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
    {#if activeTab === 'dashboard'}
      <div class="space-y-6">
        <!-- Day Selector Header -->
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Day {currentDay} of 20</span>
            <h2 class="text-2xl font-extrabold text-white mt-1">{currentDayData.dateStr}</h2>
            <p class="text-xs text-slate-400">{currentDayData.math.topic} • {currentDayData.physics.topic} • {currentDayData.prog.topic}</p>
          </div>
          <select bind:value={currentDay} on:change={saveState} class="bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl px-4 py-2">
            {#each CURRICULUM_DATA as dayObj}
              <option value={dayObj.day}>Day {dayObj.day}: {dayObj.dateStr.split(' (')[0]}</option>
            {/each}
          </select>
        </div>

        <!-- Schedule Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {#each [
            { id: 0, title: '🧮 Mathematics Session', subject: currentDayData.math, color: 'border-l-blue-500' },
            { id: 1, title: '⚛️ Physics Session', subject: currentDayData.physics, color: 'border-l-indigo-500' },
            { id: 2, title: '💻 C Programming', subject: currentDayData.prog, color: 'border-l-emerald-500' },
            { id: 3, title: '🧠 DSA Foundations', subject: currentDayData.dsa, color: 'border-l-purple-500' },
            { id: 4, title: '🌐 Web Development', subject: currentDayData.web, color: 'border-l-amber-500' },
            { id: 5, title: '📖 Technical Systems Reading', subject: { topic: currentDayData.reading, subtopics: ["Read assigned chapter", "Take journal notes"] }, color: 'border-l-rose-500' }
          ] as slot}
            {@const taskKey = `day${currentDay}_slot${slot.id}`}
            {@const isChecked = !!completedTasks[taskKey]}
            <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 border-l-4 {slot.color} space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase">{slot.title}</span>
                  <h4 class="text-sm font-bold text-white {isChecked ? 'line-through opacity-50' : ''}">{slot.subject.topic}</h4>
                </div>
                <button on:click={() => toggleTask(taskKey)} class="p-3 rounded-xl border transition-all {isChecked ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'}">
                  <i class="fa-solid {isChecked ? 'fa-check-double' : 'fa-check'}"></i>
                </button>
              </div>

              {#if slot.subject.videos && slot.subject.videos.length > 0}
                <div class="pt-2 border-t border-slate-800 space-y-1.5">
                  <span class="text-[10px] font-bold text-slate-400 uppercase"><i class="fa-brands fa-youtube text-red-500 mr-1"></i> Videos:</span>
                  <div class="flex flex-wrap gap-1.5">
                    {#each slot.subject.videos as vid}
                      <button on:click={() => openVideo(vid.title, vid.embedId)} class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5">
                        <i class="fa-solid fa-circle-play text-red-400 text-xs"></i> {vid.title}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

    {:else if activeTab === 'snippets'}
      <div class="space-y-6">
        <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-bold text-white">{currentSnippet.title}</h3>
            <button on:click={handleRunCCode} class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white">
              <i class="fa-solid fa-play mr-1.5"></i> Run C Code
            </button>
          </div>
          <textarea id="svelte-c-editor" rows="12" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none">{currentSnippet.code}</textarea>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h4 class="text-xs font-bold text-slate-400 mb-2">Terminal stdout</h4>
            <pre><code id="svelte-c-output" class="text-xs font-mono text-emerald-400">$ ready.</code></pre>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h4 class="text-xs font-bold text-slate-400 mb-2">Stack Variable RAM Inspector</h4>
            <div id="svelte-c-table"></div>
          </div>
        </div>
      </div>

    {:else if activeTab === 'flashcards'}
      <div class="max-w-xl mx-auto space-y-6">
        <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 cursor-pointer text-center min-h-[220px] flex flex-col justify-between" on:click={flipCard}>
          <span class="text-xs font-bold text-purple-400 uppercase">{currentCard.category}</span>
          <h3 class="text-lg font-bold text-white">{isFlashcardFlipped ? currentCard.answer : currentCard.question}</h3>
          <span class="text-[10px] text-slate-500">{isFlashcardFlipped ? currentCard.exp : 'Click to flip 🔄'}</span>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button on:click={() => rateFlashcard(1)} class="p-2.5 rounded-xl bg-red-950 border border-red-500/40 text-red-300 text-xs font-bold">Again (1d)</button>
          <button on:click={() => rateFlashcard(2)} class="p-2.5 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-300 text-xs font-bold">Hard (2d)</button>
          <button on:click={() => rateFlashcard(3)} class="p-2.5 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-300 text-xs font-bold">Good (4d)</button>
          <button on:click={() => rateFlashcard(4)} class="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold">Easy (7d)</button>
        </div>
      </div>

    {:else if activeTab === 'ai-mentor'}
      <div class="space-y-4 max-w-4xl mx-auto">
        <!-- AI Header & Key Check -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-lg font-bold">
              <i class="fa-solid fa-robot"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">Context-Aware Gemini AI Coach</h3>
              <p class="text-xs text-slate-400">Automatically aware of Day {currentDay} ({currentDayData.math.topic}), your XP ({xp}), and active C Playground code.</p>
            </div>
          </div>
          <button on:click={() => showAIKeyModal = true} class="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold">
            {geminiApiKey ? '🔑 Key Active' : 'Set Gemini Key'}
          </button>
        </div>

        <!-- Quick Action Prompt Chips -->
        <div class="flex flex-wrap gap-2 text-xs">
          <button on:click={() => handleSendAiChat(`Explain Day ${currentDay} ${currentDayData.math.topic} with a simple step-by-step example.`)} class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-purple-950/60 border border-slate-800 text-slate-300">💡 Explain Day {currentDay} Math Concept</button>
          <button on:click={() => handleSendAiChat("Debug my C playground code and suggest memory optimization tips.")} class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-purple-950/60 border border-slate-800 text-slate-300">🐞 Debug My C Playground Code</button>
          <button on:click={() => handleSendAiChat("Evaluate my 20-day preparation progress and suggest high-yield revision topics.")} class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-purple-950/60 border border-slate-800 text-slate-300">🏆 Evaluate My Study Progress</button>
        </div>

        <!-- Chat Stream Box -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-h-[500px] overflow-y-auto font-sans">
          {#each chatMessages as msg}
            <div class="p-3.5 rounded-2xl text-xs leading-relaxed {msg.role === 'user' ? 'bg-purple-600 text-white ml-auto max-w-lg' : 'bg-slate-950 border border-slate-800 text-slate-200'}">
              <strong class="block text-[10px] uppercase font-bold mb-1 opacity-75">{msg.role === 'user' ? 'You' : 'Gemini AI Coach'}</strong>
              <div class="whitespace-pre-wrap">{msg.text}</div>
            </div>
          {/each}
          {#if isAiThinking}
            <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-purple-400 font-mono animate-pulse">
              Gemini is thinking & analyzing context...
            </div>
          {/if}
        </div>

        <!-- Prompt Input Bar -->
        <div class="flex gap-2">
          <input type="text" bind:value={aiUserPrompt} on:keydown={(e) => e.key === 'Enter' && handleSendAiChat()} placeholder="Ask anything about Calculus, Physics, C Pointers, DSA, or your study plan..." class="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500">
          <button on:click={() => handleSendAiChat()} class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30">
            <i class="fa-solid fa-paper-plane"></i> Send
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Mobile Bottom Touch Bar -->
  <nav class="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-2 py-2 flex justify-around text-[11px] font-semibold text-slate-400 z-50">
    <button on:click={() => activeTab = 'dashboard'} class="flex flex-col items-center gap-1 {activeTab === 'dashboard' ? 'text-blue-400 font-bold' : ''}"><i class="fa-solid fa-calendar-day text-sm"></i>Schedule</button>
    <button on:click={() => activeTab = 'snippets'} class="flex flex-col items-center gap-1 {activeTab === 'snippets' ? 'text-blue-400 font-bold' : ''}"><i class="fa-solid fa-terminal text-sm"></i>C Code</button>
    <button on:click={() => activeTab = 'flashcards'} class="flex flex-col items-center gap-1 {activeTab === 'flashcards' ? 'text-blue-400 font-bold' : ''}"><i class="fa-solid fa-layer-group text-sm"></i>Anki</button>
    <button on:click={() => activeTab = 'ai-mentor'} class="flex flex-col items-center gap-1 {activeTab === 'ai-mentor' ? 'text-purple-400 font-bold' : ''}"><i class="fa-solid fa-robot text-sm"></i>AI Coach</button>
  </nav>

  <!-- GEMINI API KEY BYOK MODAL -->
  {#if showAIKeyModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="p-6 rounded-3xl bg-slate-900 border border-purple-500/40 max-w-lg w-full space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white"><i class="fa-solid fa-key text-purple-400 mr-2"></i>Configure Google AI Studio Key (BYOK)</h3>
          <button on:click={() => showAIKeyModal = false} class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs text-purple-200 space-y-2">
          <strong class="block font-bold">How to get your free Gemini API key:</strong>
          <ol class="list-decimal list-inside space-y-1 text-[11px] text-purple-300">
            <li>Go to <a href="https://aistudio.google.com/" target="_blank" class="underline font-bold text-white">Google AI Studio (aistudio.google.com)</a></li>
            <li>Sign in with your Google Account & click <strong>Get API key</strong></li>
            <li>Create a key & paste it into the box below</li>
          </ol>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-300 block mb-1">Your Gemini API Key:</label>
          <input type="password" bind:value={geminiApiKey} placeholder="AIzaSy..." class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-purple-300 focus:outline-none">
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button on:click={() => showAIKeyModal = false} class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancel</button>
          <button on:click={saveGeminiKey} class="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30">Save Key Now</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- P2P BLUETOOTH SYNC MODAL -->
  {#if showP2PModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="p-6 rounded-3xl bg-slate-900 border border-cyan-500/40 max-w-md w-full space-y-4 text-center">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white"><i class="fa-bluetooth text-cyan-400 mr-2"></i>P2P Bluetooth Sync</h3>
          <button on:click={() => showP2PModal = false} class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-xs text-slate-300">Pair phone and laptop offline over Web Bluetooth or QR code.</p>
        <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xl font-extrabold text-amber-400 tracking-widest">
          {Math.floor(100000 + Math.random() * 900000)}
        </div>
        <button on:click={() => showP2PModal = false} class="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs">Close Sync</button>
      </div>
    </div>
  {/if}

  <!-- JSON IMPORT MODAL -->
  {#if showImportModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="p-6 rounded-3xl bg-slate-900 border border-emerald-500/40 max-w-md w-full space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white"><i class="fa-solid fa-upload text-emerald-400 mr-2"></i>Load Progress JSON</h3>
          <button on:click={() => showImportModal = false} class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <input type="file" accept=".json" on:change={handleFileSelect} class="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white file:font-bold">
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <label class="flex items-center gap-1.5"><input type="radio" bind:group={importStrategy} value="overwrite"> Overwrite</label>
          <label class="flex items-center gap-1.5"><input type="radio" bind:group={importStrategy} value="merge"> Merge</label>
        </div>
        <button on:click={executeImport} disabled={!pendingImportData} class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs disabled:opacity-50">Load Backup Now</button>
      </div>
    </div>
  {/if}

  <!-- VIDEO PLAYER MODAL -->
  {#if showVideoModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="p-5 rounded-3xl bg-slate-900 border border-slate-800 max-w-3xl w-full space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 class="text-sm font-bold text-white truncate"><i class="fa-brands fa-youtube text-red-500 mr-2"></i>{activeVideoTitle}</h3>
          <button on:click={() => showVideoModal = false} class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
          <iframe class="w-full h-full" src="https://www.youtube.com/embed/{activeVideoEmbedId}?autoplay=1" title="YouTube Video Player" frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  {/if}

</main>
