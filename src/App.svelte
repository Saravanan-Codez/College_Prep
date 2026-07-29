<script>
  import { onMount } from 'svelte';
  import { CURRICULUM_DATA } from './js/data/curriculum.js';
  import { DAILY_QUIZZES } from './js/data/quizzes.js';
  import { C_SNIPPETS } from './js/data/snippets.js';
  import { FLASHCARDS } from './js/data/flashcards.js';
  import { playPopSound, playLevelUpSound } from './js/modules/audio.js';
  import { getUserLevelInfo, ACHIEVEMENTS } from './js/modules/gamification.js';
  import { calculateSM2 } from './js/modules/sm2Engine.js';
  import { executeCCode } from './js/modules/cRunner.js';
  import { sendGeminiPrompt } from './js/modules/aiMentor.js';

  let currentDay = 1;
  let activeTab = 'dashboard';
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

  // Modals
  let showP2PModal = false;
  let showImportModal = false;
  let showVideoModal = false;
  let showAIKeyModal = false;

  let activeVideoTitle = '';
  let activeVideoEmbedId = '';

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
        xp = parsed.xp || 0;
        streakCount = parsed.streakCount || 1;
        unlockedBadges = parsed.unlockedBadges || [];
        soundMuted = parsed.soundMuted || false;
        flashcardsState = parsed.flashcardsState || {};
      } catch(e){}
    }
  }

  function saveState() {
    localStorage.setItem('college_prep_state', JSON.stringify({
      currentDay, completedTasks, customNotes, problemLogs, quizScores,
      xp, streakCount, unlockedBadges, soundMuted, flashcardsState
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
      addXP(20, "AI Assistant Consulted");
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
      xp, streakCount, unlockedBadges, flashcardsState
    }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `cs_prep_progress_backup_${new Date().toISOString().slice(0, 10)}.json`);
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

<!-- Native App Layout Frame -->
<div class="min-h-screen flex flex-col lg:flex-row bg-[#070a12] text-slate-100 antialiased font-sans">
  
  <!-- DESKTOP LEFT SIDEBAR NAVIGATION -->
  <aside class="hidden lg:flex w-64 flex-col bg-[#090e1a] border-r border-slate-800 p-5 space-y-6 flex-shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
        <i class="fa-solid fa-graduation-cap text-lg"></i>
      </div>
      <div>
        <h1 class="font-extrabold text-base text-white tracking-tight">CS Prep OS</h1>
        <span class="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Native App v2.0</span>
      </div>
    </div>

    <!-- Navigation Items -->
    <nav class="space-y-1.5 flex-grow">
      <button on:click={() => activeTab = 'dashboard'} class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all active-press {activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
        <i class="fa-solid fa-calendar-day text-sm"></i> 20-Day Schedule
      </button>
      <button on:click={() => activeTab = 'snippets'} class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all active-press {activeTab === 'snippets' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
        <i class="fa-solid fa-terminal text-sm"></i> C Playground
      </button>
      <button on:click={() => activeTab = 'flashcards'} class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all active-press {activeTab === 'flashcards' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}">
        <i class="fa-solid fa-layer-group text-sm"></i> Anki SM-2
      </button>
      <button on:click={() => activeTab = 'ai-mentor'} class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all active-press {activeTab === 'ai-mentor' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-purple-400 hover:text-white hover:bg-purple-950/40 border border-purple-500/20'}">
        <i class="fa-solid fa-robot text-sm"></i> AI Study Coach
      </button>
    </nav>

    <!-- Sidebar Footer Gamification Card -->
    <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
      <div class="flex items-center justify-between text-xs font-bold text-amber-400">
        <span><i class="fa-solid fa-trophy mr-1"></i> {levelInfo.title}</span>
      </div>
      <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
        <div class="bg-gradient-to-r from-amber-400 to-yellow-500 h-full transition-all duration-500" style="width: {(xp % 200) / 2}%"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-400 font-mono">
        <span>{xp} XP</span>
        <span>Streak: {streakCount}d 🔥</span>
      </div>
    </div>
  </aside>

  <!-- MAIN APP CONTAINER -->
  <div class="flex-grow flex flex-col min-w-0 pb-16 lg:pb-0">

    <!-- TOP CONTROL HEADER BAR -->
    <header class="border-b border-slate-800 bg-[#090e1a]/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-400">Day {currentDay} of 20</span>
        <span class="text-slate-600">•</span>
        <span class="text-xs font-semibold text-blue-400">{completedTodayCount} / 6 Sessions Done</span>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-2">
        <button on:click={() => showP2PModal = true} class="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all active-press">
          <i class="fa-bluetooth text-cyan-400"></i>
          <span class="hidden sm:inline">Bluetooth Sync</span>
        </button>

        <button on:click={() => showImportModal = true} class="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all active-press">
          <i class="fa-solid fa-upload"></i>
          <span class="hidden sm:inline">Load Progress</span>
        </button>

        <button on:click={exportJSON} class="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-all active-press">
          <i class="fa-solid fa-download"></i>
          <span class="hidden sm:inline">Save Progress</span>
        </button>
      </div>
    </header>

    <!-- MAIN APP WORKSPACE -->
    <main class="flex-grow p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">

      <!-- TAB 1: 20-DAY SCHEDULE -->
      {#if activeTab === 'dashboard'}
        <div class="space-y-6">
          <!-- Day Header & Selector -->
          <div class="app-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Day {currentDay}</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">{currentDayData.phase}</span>
              </div>
              <h2 class="text-2xl font-extrabold text-white mt-1">{currentDayData.dateStr}</h2>
              <p class="text-xs text-slate-400">{currentDayData.math.topic} • {currentDayData.physics.topic} • {currentDayData.prog.topic}</p>
            </div>
            <select bind:value={currentDay} on:change={saveState} class="bg-slate-950 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl px-4 py-2 cursor-pointer focus:outline-none focus:border-blue-500">
              {#each CURRICULUM_DATA as dayObj}
                <option value={dayObj.day}>Day {dayObj.day}: {dayObj.dateStr.split(' (')[0]}</option>
              {/each}
            </select>
          </div>

          <!-- Time Block Sessions Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each [
              { id: 0, title: '🧮 Mathematics Session', subject: currentDayData.math, color: 'border-l-blue-500' },
              { id: 1, title: '⚛️ Physics Session', subject: currentDayData.physics, color: 'border-l-indigo-500' },
              { id: 2, title: '💻 C Programming', subject: currentDayData.prog, color: 'border-l-emerald-500' },
              { id: 3, title: '🧠 DSA Foundations', subject: currentDayData.dsa, color: 'border-l-purple-500' },
              { id: 4, title: '🌐 Web Development', subject: currentDayData.web, color: 'border-l-amber-500' },
              { id: 5, title: '📖 Systems Technical Reading', subject: { topic: currentDayData.reading, subtopics: ["Read chapter thoroughly", "Take notes in journal"], docsUrl: "https://csapp.cs.cmu.edu/" }, color: 'border-l-rose-500' }
            ] as slot}
              {@const taskKey = `day${currentDay}_slot${slot.id}`}
              {@const isChecked = !!completedTasks[taskKey]}
              <div class="app-card p-5 border-l-4 {slot.color} space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{slot.title}</span>
                    <h4 class="text-sm font-bold text-white {isChecked ? 'line-through opacity-50' : ''}">{slot.subject.topic}</h4>
                    <ul class="text-xs text-slate-400 list-disc list-inside mt-1 space-y-0.5">
                      {#each slot.subject.subtopics as st}
                        <li>{st}</li>
                      {/each}
                    </ul>
                  </div>
                  <button on:click={() => toggleTask(taskKey)} class="p-3 rounded-xl border transition-all active-press {isChecked ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-blue-500'}">
                    <i class="fa-solid {isChecked ? 'fa-check-double text-base' : 'fa-check text-sm'}"></i>
                  </button>
                </div>

                <!-- Video Lessons & Study Materials Drawer -->
                {#if slot.subject.videos && slot.subject.videos.length > 0}
                  <div class="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    <span class="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><i class="fa-brands fa-youtube text-red-500"></i> Video Lessons & Resources:</span>
                    <div class="flex flex-wrap gap-1.5">
                      {#each slot.subject.videos as vid}
                        <button on:click={() => openVideo(vid.title, vid.embedId)} class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 active-press">
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

      <!-- TAB 2: C PLAYGROUND & STACK RAM INSPECTOR -->
      {:else if activeTab === 'snippets'}
        <div class="space-y-6">
          <div class="app-card p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-base font-bold text-white">{currentSnippet.title}</h3>
              <button on:click={handleRunCCode} class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg active-press">
                <i class="fa-solid fa-play mr-1.5"></i> Run C Code
              </button>
            </div>
            <textarea id="c-app-editor" rows="12" class="w-full bg-[#070a12] border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500">{currentSnippet.code}</textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="app-card p-4">
              <h4 class="text-xs font-bold text-slate-400 mb-2">Terminal Output (stdout)</h4>
              <pre><code id="c-app-output" class="text-xs font-mono text-emerald-400">$ ready.</code></pre>
            </div>
            <div class="app-card p-4">
              <h4 class="text-xs font-bold text-slate-400 mb-2">Stack Variable RAM Inspector</h4>
              <div id="c-app-table"></div>
            </div>
          </div>
        </div>

      <!-- TAB 3: ANKI SM-2 FLASHCARDS -->
      {:else if activeTab === 'flashcards'}
        <div class="max-w-xl mx-auto space-y-6">
          <div class="perspective-1000 w-full min-h-[240px] cursor-pointer" on:click={flipCard}>
            <div class="relative w-full h-full transform-style-3d transition-transform duration-500 app-card p-8 flex flex-col justify-between text-center">
              <span class="text-xs font-bold text-purple-400 uppercase">{currentCard.category}</span>
              <h3 class="text-lg font-bold text-white my-6">{isFlashcardFlipped ? currentCard.answer : currentCard.question}</h3>
              <span class="text-[10px] text-slate-500">{isFlashcardFlipped ? currentCard.exp : 'Click to flip card 🔄'}</span>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <button on:click={() => rateFlashcard(1)} class="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold active-press">Again (1d)</button>
            <button on:click={() => rateFlashcard(2)} class="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold active-press">Hard (2d)</button>
            <button on:click={() => rateFlashcard(3)} class="p-2.5 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-300 text-xs font-bold active-press">Good (4d)</button>
            <button on:click={() => rateFlashcard(4)} class="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold active-press">Easy (7d)</button>
          </div>
        </div>

      <!-- TAB 4: GEMINI AI COACH -->
      {:else if activeTab === 'ai-mentor'}
        <div class="space-y-4 max-w-4xl mx-auto">
          <div class="app-card p-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-lg font-bold">
                <i class="fa-solid fa-robot"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-white">Context-Aware Gemini AI Coach</h3>
                <p class="text-xs text-slate-400">Context active: Day {currentDay} ({currentDayData.math.topic}), XP ({xp}).</p>
              </div>
            </div>
            <button on:click={() => showAIKeyModal = true} class="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold active-press">
              {geminiApiKey ? '🔑 Key Configured' : 'Set Gemini Key'}
            </button>
          </div>

          <div class="flex flex-wrap gap-2 text-xs">
            <button on:click={() => handleSendAiChat(`Explain Day ${currentDay} ${currentDayData.math.topic} with a simple step-by-step example.`)} class="px-3 py-1.5 rounded-xl bg-[#090e1a] hover:bg-purple-950/60 border border-slate-800 text-slate-300 active-press">💡 Explain Day {currentDay} Math Concept</button>
            <button on:click={() => handleSendAiChat("Debug my C playground code and suggest memory optimization tips.")} class="px-3 py-1.5 rounded-xl bg-[#090e1a] hover:bg-purple-950/60 border border-slate-800 text-slate-300 active-press">🐞 Debug My C Playground Code</button>
            <button on:click={() => handleSendAiChat("Evaluate my 20-day preparation progress and suggest high-yield revision topics.")} class="px-3 py-1.5 rounded-xl bg-[#090e1a] hover:bg-purple-950/60 border border-slate-800 text-slate-300 active-press">🏆 Evaluate My Study Progress</button>
          </div>

          <div class="app-card p-5 space-y-4 max-h-[500px] overflow-y-auto font-sans">
            {#each chatMessages as msg}
              <div class="p-3.5 rounded-2xl text-xs leading-relaxed {msg.role === 'user' ? 'bg-purple-600 text-white ml-auto max-w-lg shadow-md' : 'bg-[#070a12] border border-slate-800 text-slate-200'}">
                <strong class="block text-[10px] uppercase font-bold mb-1 opacity-75">{msg.role === 'user' ? 'You' : 'Gemini AI Coach'}</strong>
                <div class="whitespace-pre-wrap">{msg.text}</div>
              </div>
            {/each}
            {#if isAiThinking}
              <div class="p-3 rounded-2xl bg-[#070a12] border border-slate-800 text-xs text-purple-400 font-mono animate-pulse">
                Gemini is thinking & analyzing context...
              </div>
            {/if}
          </div>

          <div class="flex gap-2">
            <input type="text" bind:value={aiUserPrompt} on:keydown={(e) => e.key === 'Enter' && handleSendAiChat()} placeholder="Ask anything about Calculus, Physics, C Pointers, DSA, or study strategy..." class="flex-grow bg-[#090e1a] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500">
            <button on:click={() => handleSendAiChat()} class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 active-press">
              <i class="fa-solid fa-paper-plane"></i> Send
            </button>
          </div>
        </div>
      {/if}
    </main>
  </div>

  <!-- MOBILE BOTTOM TOUCH DOCK BAR -->
  <nav class="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-[#090e1a]/95 backdrop-blur-md px-2 py-2.5 flex justify-around text-[11px] font-semibold text-slate-400 z-50">
    <button on:click={() => activeTab = 'dashboard'} class="flex flex-col items-center gap-1 active-press {activeTab === 'dashboard' ? 'text-blue-400 font-bold' : ''}"><i class="fa-solid fa-calendar-day text-sm"></i>Schedule</button>
    <button on:click={() => activeTab = 'snippets'} class="flex flex-col items-center gap-1 active-press {activeTab === 'snippets' ? 'text-blue-400 font-bold' : ''}"><i class="fa-solid fa-terminal text-sm"></i>C Code</button>
    <button on:click={() => activeTab = 'flashcards'} class="flex flex-col items-center gap-1 active-press {activeTab === 'flashcards' ? 'text-blue-400 font-bold' : ''}"><i class="fa-solid fa-layer-group text-sm"></i>Anki</button>
    <button on:click={() => activeTab = 'ai-mentor'} class="flex flex-col items-center gap-1 active-press {activeTab === 'ai-mentor' ? 'text-purple-400 font-bold' : ''}"><i class="fa-solid fa-robot text-sm"></i>AI Coach</button>
  </nav>

  <!-- P2P BLUETOOTH SYNC MODAL -->
  {#if showP2PModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="app-card p-6 max-w-md w-full space-y-4 text-center border-cyan-500/40">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white"><i class="fa-bluetooth text-cyan-400 mr-2"></i>P2P Bluetooth Sync</h3>
          <button on:click={() => showP2PModal = false} class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <p class="text-xs text-slate-300">Pair phone and laptop offline over Web Bluetooth or QR code.</p>
        <div class="p-4 bg-[#070a12] rounded-xl border border-slate-800 font-mono text-xl font-extrabold text-amber-400 tracking-widest">
          {Math.floor(100000 + Math.random() * 900000)}
        </div>
        <button on:click={() => showP2PModal = false} class="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs active-press">Close Sync</button>
      </div>
    </div>
  {/if}

  <!-- JSON IMPORT MODAL -->
  {#if showImportModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="app-card p-6 max-w-md w-full space-y-4 border-emerald-500/40">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white"><i class="fa-solid fa-upload text-emerald-400 mr-2"></i>Load Progress JSON</h3>
          <button on:click={() => showImportModal = false} class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <input type="file" accept=".json" on:change={handleFileSelect} class="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white file:font-bold cursor-pointer">
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <label class="flex items-center gap-1.5"><input type="radio" bind:group={importStrategy} value="overwrite"> Overwrite</label>
          <label class="flex items-center gap-1.5"><input type="radio" bind:group={importStrategy} value="merge"> Merge</label>
        </div>
        <button on:click={executeImport} disabled={!pendingImportData} class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs disabled:opacity-50 active-press">Load Backup Now</button>
      </div>
    </div>
  {/if}

  <!-- GEMINI API KEY MODAL -->
  {#if showAIKeyModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="app-card p-6 max-w-lg w-full space-y-4 border-purple-500/40">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-base font-bold text-white"><i class="fa-solid fa-key text-purple-400 mr-2"></i>Set Gemini API Key (BYOK)</h3>
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
          <input type="password" bind:value={geminiApiKey} placeholder="AIzaSy..." class="w-full bg-[#070a12] border border-slate-800 rounded-xl p-3 text-xs font-mono text-purple-300 focus:outline-none">
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button on:click={() => showAIKeyModal = false} class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancel</button>
          <button on:click={saveGeminiKey} class="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 active-press">Save Key Now</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- VIDEO PLAYER MODAL -->
  {#if showVideoModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="app-card p-5 max-w-3xl w-full space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 class="text-sm font-bold text-white truncate"><i class="fa-brands fa-youtube text-red-500 mr-2"></i>{activeVideoTitle}</h3>
          <button on:click={() => showVideoModal = false} class="text-slate-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#070a12] border border-slate-800">
          <iframe class="w-full h-full" src="https://www.youtube.com/embed/{activeVideoEmbedId}?autoplay=1" title="YouTube Video Player" frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  {/if}

</div>
