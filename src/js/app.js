import { CURRICULUM_DATA } from './data/curriculum.js';
import { DAILY_QUIZZES } from './data/quizzes.js';
import { C_SNIPPETS } from './data/snippets.js';
import { FLASHCARDS } from './data/flashcards.js';
import { playPopSound, playLevelUpSound, toggleAmbientSound } from './modules/audio.js';
import { USER_LEVELS, ACHIEVEMENTS, getUserLevelInfo } from './modules/gamification.js';
import { calculateSM2 } from './modules/sm2Engine.js';
import { extractAndRenderMemoryTable, executeCCode } from './modules/cRunner.js';
import { renderQRMode, renderBluetoothMode } from './modules/p2pSync.js';

// Application State
let currentState = {
    currentDay: 1,
    activeTab: 'dashboard',
    completedTasks: {},
    customNotes: {},
    problemLogs: {},
    quizScores: {},
    energyLevels: {},
    completedFocusSessions: 0,
    xp: 0,
    streakCount: 1,
    lastStudiedDate: new Date().toDateString(),
    unlockedBadges: [],
    soundMuted: false,
    theme: 'slate',
    activeSubjectFilter: 'all',
    flashcardsState: {}
};

let currentFlashcardIndex = 0;
let isFlashcardFlipped = false;
let timerState = {
    durationMinutes: 90,
    remainingSeconds: 90 * 60,
    isRunning: false,
    intervalId: null,
    label: 'Math / Physics Block'
};

const START_DATE = new Date(2026, 6, 30);
const COLLEGE_REOPEN_DATE = new Date(2026, 7, 19, 9, 0, 0);

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    applyTheme(currentState.theme || 'slate');
    startCountdownClock();
    renderDaySelectors();
    renderMiniCalendar();
    renderScheduleForDay(currentState.currentDay);
    renderCurriculumRoadmap();
    loadCSnippetForDay(currentState.currentDay);
    renderFlashcard(0);
    renderProblemTrackerForDay(currentState.currentDay);
    renderAnalytics();
    updateGamificationUI();
    setupTimerDisplay();
    setupEventListeners();
});

function saveToLocalStorage() {
    localStorage.setItem('college_prep_state', JSON.stringify(currentState));
    updateGamificationUI();
    renderAnalytics();
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('college_prep_state');
    if (saved) {
        try {
            currentState = { ...currentState, ...JSON.parse(saved) };
        } catch(e) { console.error("Error parsing stored state", e); }
    }
    checkBadges();
}

function addXP(amount, reason = "") {
    const oldLvl = getUserLevelInfo(currentState.xp).level;
    currentState.xp = (currentState.xp || 0) + amount;
    saveToLocalStorage();
    
    const newLvlInfo = getUserLevelInfo(currentState.xp);
    if (newLvlInfo.level > oldLvl) {
        playLevelUpSound(currentState.soundMuted);
        showToast(`🎉 LEVEL UP! You reached Level ${newLvlInfo.level}: ${newLvlInfo.title}!`);
    } else if (reason) {
        playPopSound(currentState.soundMuted);
        showToast(`+${amount} XP: ${reason}! 🌟`);
    }
    checkBadges();
}

function updateGamificationUI() {
    const lvlInfo = getUserLevelInfo(currentState.xp);
    document.getElementById('user-level-badge').textContent = `Lvl ${lvlInfo.level}: ${lvlInfo.title}`;
    document.getElementById('user-xp-text').textContent = `${currentState.xp || 0} / ${lvlInfo.maxXp} XP`;
    document.getElementById('user-xp-bar').style.width = `${lvlInfo.percent}%`;
    document.getElementById('user-streak-text').textContent = `${currentState.streakCount || 1} Day Streak`;
    document.getElementById('unlocked-badges-count').textContent = (currentState.unlockedBadges || []).length;
}

function checkBadges() {
    if (!currentState.unlockedBadges) currentState.unlockedBadges = [];
    const unlocked = currentState.unlockedBadges;

    let completedTasksCount = 0, mathCount = 0, readingCount = 0;
    for (let k in currentState.completedTasks) {
        if (currentState.completedTasks[k]) {
            completedTasksCount++;
            if (k.includes('slot0')) mathCount++;
            if (k.includes('slot5')) readingCount++;
        }
    }

    let problemsSolved = 0;
    for (let k in currentState.problemLogs) if (currentState.problemLogs[k]) problemsSolved++;

    let quizzesPassed = 0;
    for (let k in currentState.quizScores) if (currentState.quizScores[k] !== undefined) quizzesPassed++;

    const unlock = (badgeId) => {
        if (!unlocked.includes(badgeId)) {
            unlocked.push(badgeId);
            const bObj = ACHIEVEMENTS.find(a => a.id === badgeId);
            if (bObj) showToast(`🏆 Badge Unlocked: ${bObj.title}!`);
            saveToLocalStorage();
        }
    };

    if (completedTasksCount >= 1) unlock("first_step");
    if (currentState.completedTasks["day6_slot2"]) unlock("pointer_wizard");
    if (mathCount >= 5) unlock("calculus_ninja");
    if (readingCount >= 3) unlock("night_reader");
    if (problemsSolved >= 10) unlock("problem_crusher");
    if ((currentState.completedFocusSessions || 0) >= 5) unlock("focus_master");
    if (quizzesPassed >= 3) unlock("quiz_whiz");
    if (completedTasksCount >= 60) unlock("college_ready");
}

function applyTheme(themeName) {
    const root = document.getElementById('app-html-root');
    root.className = "dark";
    if (themeName !== 'slate') {
        root.classList.add(`theme-${themeName}`);
    }
    const sel = document.getElementById('theme-selector');
    if (sel) sel.value = themeName;
}

function startCountdownClock() {
    function updateClock() {
        const now = new Date();
        const diff = COLLEGE_REOPEN_DATE - now;

        if (diff <= 0) {
            document.getElementById('countdown-clock').textContent = "College is Open! 🎉";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        document.getElementById('countdown-clock').textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
    }
    updateClock();
    setInterval(updateClock, 1000);
}

function renderDaySelectors() {
    const selects = [document.getElementById('day-select'), document.getElementById('c-snippet-day-select'), document.getElementById('problem-day-select')];
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '';
        CURRICULUM_DATA.forEach(dayData => {
            const opt = document.createElement('option');
            opt.value = dayData.day;
            opt.textContent = `Day ${dayData.day}: ${dayData.dateStr.split(' (')[0]}`;
            if (dayData.day === currentState.currentDay) opt.selected = true;
            select.appendChild(opt);
        });
    });
}

function renderMiniCalendar() {
    const grid = document.getElementById('mini-calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CURRICULUM_DATA.forEach(dayData => {
        const dayNum = dayData.day;
        const isCurrent = dayNum === currentState.currentDay;
        
        let completedCount = 0;
        for (let slot = 0; slot < 6; slot++) {
            if (currentState.completedTasks[`day${dayNum}_slot${slot}`]) completedCount++;
        }

        let statusBg = "bg-slate-900/80 text-slate-400 border-slate-800";
        if (completedCount === 6) {
            statusBg = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold";
        } else if (completedCount > 0) {
            statusBg = "bg-blue-500/20 text-blue-400 border-blue-500/40 font-medium";
        }

        if (isCurrent) {
            statusBg += " ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950 scale-105 z-10";
        }

        const dayBox = document.createElement('button');
        dayBox.onclick = () => selectDay(dayNum);
        dayBox.className = `p-1.5 rounded-xl border text-center transition-all hover:scale-105 text-xs flex flex-col items-center justify-center gap-0.5 ${statusBg}`;
        dayBox.innerHTML = `
            <span class="text-[11px]">D${dayNum}</span>
            <span class="text-[9px] opacity-75">${completedCount}/6</span>
        `;
        grid.appendChild(dayBox);
    });
}

function selectDay(dayNum) {
    currentState.currentDay = dayNum;
    document.querySelectorAll('#day-select, #c-snippet-day-select, #problem-day-select').forEach(sel => {
        if (sel) sel.value = dayNum;
    });
    renderMiniCalendar();
    renderScheduleForDay(dayNum);
    loadCSnippetForDay(dayNum);
    renderProblemTrackerForDay(dayNum);
    saveToLocalStorage();
}

function renderScheduleForDay(dayNum) {
    const data = CURRICULUM_DATA.find(d => d.day === dayNum);
    if (!data) return;

    document.getElementById('current-day-badge').textContent = `Day ${data.day} of 20`;
    document.getElementById('current-phase-badge').textContent = data.phase;
    document.getElementById('current-day-title').textContent = data.dateStr;
    document.getElementById('current-day-subtitle').textContent = `${data.math.topic} • ${data.physics.topic} • ${data.prog.topic}`;
    document.getElementById('journal-day-num').textContent = data.day;
    document.getElementById('quiz-day-num').textContent = data.day;

    const notesInput = document.getElementById('daily-notes-input');
    if (notesInput) notesInput.value = currentState.customNotes[dayNum] || '';

    const slots = [
        { id: 0, time: "07:30 AM – 09:00 AM", title: "🧮 Mathematics Session (90 min)", subject: "Math", topic: data.math.topic, subtopics: data.math.subtopics, color: "border-l-blue-500" },
        { id: 1, time: "10:00 AM – 11:30 AM", title: "⚛️ Physics Session (90 min)", subject: "Physics", topic: data.physics.topic, subtopics: data.physics.subtopics, color: "border-l-indigo-500" },
        { id: 2, time: "01:00 PM – 03:00 PM", title: "💻 C Programming & Practice (2 Hours)", subject: "C Programming", topic: data.prog.topic, subtopics: data.prog.subtopics, extra: data.prog.programs ? "Practice: " + data.prog.programs.join(" | ") : null, color: "border-l-emerald-500" },
        { id: 3, time: "03:30 PM – 04:30 PM", title: "🧠 DSA Foundations (60 min)", subject: "DSA", topic: data.dsa.topic, subtopics: data.dsa.subtopics, color: "border-l-purple-500" },
        { id: 4, time: "07:00 PM – 08:30 PM", title: "🌐 Web Development (90 min)", subject: "Web Dev", topic: data.web.topic, subtopics: data.web.subtopics, color: "border-l-amber-500" },
        { id: 5, time: "09:00 PM – 09:20 PM", title: "📖 Technical Systems Reading (20 min)", subject: "Reading", topic: data.reading, subtopics: ["Read chapter thoroughly", "Take notes in journal"], color: "border-l-rose-500" }
    ];

    const container = document.getElementById('schedule-slots-container');
    container.innerHTML = '';
    let doneCount = 0;

    slots.forEach(slot => {
        const taskKey = `day${dayNum}_slot${slot.id}`;
        const isChecked = !!currentState.completedTasks[taskKey];
        if (isChecked) doneCount++;

        const slotCard = document.createElement('div');
        slotCard.className = `glass-card glass-card-hover p-4 rounded-2xl border-l-4 ${slot.color} transition-all ${isChecked ? 'opacity-65 bg-slate-950/40' : ''}`;
        
        slotCard.innerHTML = `
            <div class="flex items-start justify-between gap-3">
                <div class="flex-grow">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-mono font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">${slot.time}</span>
                        <span class="text-xs font-semibold text-slate-300">${slot.title}</span>
                    </div>
                    <h4 class="text-sm font-bold text-white mb-1 ${isChecked ? 'line-through text-slate-400' : ''}">${slot.topic}</h4>
                    <ul class="text-xs text-slate-400 list-disc list-inside space-y-0.5">
                        ${slot.subtopics.map(st => `<li>${st}</li>`).join('')}
                    </ul>
                    ${slot.extra ? `<p class="mt-2 text-[11px] text-emerald-400 font-mono bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40 flex items-center gap-1.5"><i class="fa-solid fa-code"></i>${slot.extra}</p>` : ''}
                </div>
                <button onclick="window.app.toggleTask('${taskKey}')" class="mt-1 p-2.5 rounded-xl border transition-all ${isChecked ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-500 hover:text-white'}">
                    <i class="fa-solid ${isChecked ? 'fa-check-double text-base' : 'fa-check text-sm'}"></i>
                </button>
            </div>
        `;
        container.appendChild(slotCard);
    });

    document.getElementById('daily-completion-rate').textContent = `${doneCount} / 6 Sessions Completed`;
    renderDailyQuiz(dayNum);
}

function renderDailyQuiz(dayNum) {
    const quiz = DAILY_QUIZZES[dayNum] || DAILY_QUIZZES[1];
    const area = document.getElementById('quiz-content-area');
    const statusBadge = document.getElementById('quiz-status-badge');
    const isAnswered = currentState.quizScores[dayNum] !== undefined;

    if (isAnswered) {
        const userChoice = currentState.quizScores[dayNum];
        const isCorrect = userChoice === quiz.correct;
        statusBadge.className = isCorrect ? "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30";
        statusBadge.textContent = isCorrect ? "Passed (+40 XP)" : "Completed";

        area.innerHTML = `
            <p class="text-xs font-bold text-white mb-2">${quiz.question}</p>
            <div class="space-y-1.5 text-xs">
                ${quiz.options.map((opt, idx) => `
                    <div class="p-2.5 rounded-xl border text-xs flex items-center justify-between ${idx === quiz.correct ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-semibold' : (idx === userChoice ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 font-semibold' : 'bg-slate-900/60 border-slate-800 text-slate-400')}">
                        <span>${String.fromCharCode(65 + idx)}. ${opt}</span>
                        ${idx === quiz.correct ? '<i class="fa-solid fa-check text-emerald-400"></i>' : (idx === userChoice ? '<i class="fa-solid fa-xmark text-rose-400"></i>' : '')}
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        statusBadge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700";
        statusBadge.textContent = "Not Completed";

        area.innerHTML = `
            <p class="text-xs font-bold text-white mb-3">${quiz.question}</p>
            <div class="space-y-2 text-xs">
                ${quiz.options.map((opt, idx) => `
                    <button onclick="window.app.submitQuizAnswer(${dayNum}, ${idx})" class="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-indigo-900/30 hover:border-indigo-500/50 text-slate-200 text-left transition-all flex items-center gap-2">
                        <span class="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-400">${String.fromCharCode(65 + idx)}</span>
                        <span>${opt}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }
}

function submitQuizAnswer(dayNum, choiceIdx) {
    const quiz = DAILY_QUIZZES[dayNum] || DAILY_QUIZZES[1];
    currentState.quizScores[dayNum] = choiceIdx;
    
    if (choiceIdx === quiz.correct) {
        addXP(40, "Daily Quiz Passed");
    } else {
        showToast("Quiz submitted!");
    }
    saveToLocalStorage();
    renderDailyQuiz(dayNum);
}

function loadCSnippetForDay(dayNum) {
    const snippet = C_SNIPPETS[dayNum] || C_SNIPPETS[1];
    document.getElementById('snippet-day-tag').textContent = `Day ${dayNum} C Program`;
    document.getElementById('snippet-title').textContent = snippet.title;
    document.getElementById('c-code-editor').value = snippet.code;
    document.getElementById('snippet-explanation').innerHTML = `<p>${snippet.explanation}</p>`;
    document.getElementById('c-terminal-output').textContent = `$ ./program ready. Click 'Run Code' to execute.`;
    extractAndRenderMemoryTable(snippet.code, document.getElementById('c-memory-table-container'));
}

function renderFlashcard(index) {
    const card = FLASHCARDS[index] || FLASHCARDS[0];
    const cardState = (currentState.flashcardsState && currentState.flashcardsState[card.id]) || card;

    document.getElementById('card-category-badge').textContent = card.category.toUpperCase();
    document.getElementById('card-question-text').textContent = card.question;
    document.getElementById('card-answer-text').textContent = card.answer;
    document.getElementById('card-explanation-text').textContent = card.exp;
    document.getElementById('card-sm2-info').textContent = `Interval: ${cardState.interval}d | EF: ${cardState.easeFactor.toFixed(2)}`;
    document.getElementById('flashcard-counter').textContent = `Card ${index + 1} / ${FLASHCARDS.length}`;
    
    isFlashcardFlipped = false;
    document.getElementById('flashcard-inner').classList.remove('rotate-y-180');
}

function renderProblemTrackerForDay(dayNum) {
    document.getElementById('problem-tab-day-num').textContent = dayNum;
    const container = document.getElementById('daily-problems-container');
    if (!container) return;
    container.innerHTML = '';

    const dayData = CURRICULUM_DATA.find(d => d.day === dayNum);
    const defaultProblems = [
        { id: 0, title: `Easy 1: ${dayData.prog.topic} Warmup`, difficulty: "Easy", platform: "LeetCode" },
        { id: 1, title: `Easy 2: ${dayData.dsa.topic} Array Practice`, difficulty: "Easy", platform: "HackerRank" },
        { id: 2, title: `Medium 1: ${dayData.dsa.topic} Logic Puzzle`, difficulty: "Medium", platform: "LeetCode" },
        { id: 3, title: `Medium 2: ${dayData.prog.topic} Algorithmic Challenge`, difficulty: "Medium", platform: "Codeforces" }
    ];

    let totalSolvedOverall = 0;
    for (let k in currentState.problemLogs) if (currentState.problemLogs[k]) totalSolvedOverall++;
    document.getElementById('problem-solved-count').textContent = `${totalSolvedOverall} Solved`;

    defaultProblems.forEach(prob => {
        const probKey = `day${dayNum}_p${prob.id}`;
        const isSolved = !!currentState.problemLogs[probKey];

        const card = document.createElement('div');
        card.className = `p-4 rounded-xl border ${isSolved ? 'bg-purple-950/20 border-purple-500/40' : 'bg-slate-950/60 border-slate-800'} flex items-center justify-between gap-3`;
        card.innerHTML = `
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 text-[9px] font-bold rounded-md ${prob.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}">${prob.difficulty}</span>
                    <span class="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">${prob.platform}</span>
                </div>
                <h4 class="text-xs font-bold text-white">${prob.title}</h4>
            </div>
            <button onclick="window.app.toggleProblemLog('${probKey}')" class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isSolved ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-purple-500'}">
                ${isSolved ? '<i class="fa-solid fa-check mr-1"></i> Solved' : 'Mark Solved'}
            </button>
        `;
        container.appendChild(card);
    });
}

function renderAnalytics() {
    let totalTasksCompleted = 0;
    let mathDone = 0, physicsDone = 0, progDone = 0, dsaDone = 0, webDone = 0, readingDone = 0;

    for (let k in currentState.completedTasks) {
        if (currentState.completedTasks[k]) {
            totalTasksCompleted++;
            if (k.includes('slot0')) mathDone++;
            if (k.includes('slot1')) physicsDone++;
            if (k.includes('slot2')) progDone++;
            if (k.includes('slot3')) dsaDone++;
            if (k.includes('slot4')) webDone++;
            if (k.includes('slot5')) readingDone++;
        }
    }

    const estHours = Math.round((mathDone * 1.5) + (physicsDone * 1.5) + (progDone * 2.0) + (dsaDone * 1.0) + (webDone * 1.5) + (readingDone * 0.33));
    document.getElementById('analytics-total-hours').textContent = `${estHours} Hours`;

    const calcPercent = (count) => Math.round((count / 20) * 100);
    document.getElementById('meter-math-text').textContent = `${calcPercent(mathDone)}%`;
    document.getElementById('meter-math-bar').style.width = `${calcPercent(mathDone)}%`;

    document.getElementById('meter-physics-text').textContent = `${calcPercent(physicsDone)}%`;
    document.getElementById('meter-physics-bar').style.width = `${calcPercent(physicsDone)}%`;

    document.getElementById('meter-prog-text').textContent = `${calcPercent(progDone)}%`;
    document.getElementById('meter-prog-bar').style.width = `${calcPercent(progDone)}%`;

    document.getElementById('meter-dsa-text').textContent = `${calcPercent(dsaDone)}%`;
    document.getElementById('meter-dsa-bar').style.width = `${calcPercent(dsaDone)}%`;

    document.getElementById('meter-web-text').textContent = `${calcPercent(webDone)}%`;
    document.getElementById('meter-web-bar').style.width = `${calcPercent(webDone)}%`;

    document.getElementById('meter-reading-text').textContent = `${calcPercent(readingDone)}%`;
    document.getElementById('meter-reading-bar').style.width = `${calcPercent(readingDone)}%`;

    let quizzesPassed = 0;
    for (let k in currentState.quizScores) if (currentState.quizScores[k] !== undefined) quizzesPassed++;

    let problemsSolved = 0;
    for (let k in currentState.problemLogs) if (currentState.problemLogs[k]) problemsSolved++;

    document.getElementById('analytics-xp-val').textContent = `${currentState.xp || 0} XP`;
    document.getElementById('analytics-quizzes-val').textContent = `${quizzesPassed} / 20`;
    document.getElementById('analytics-focus-val').textContent = `${currentState.completedFocusSessions || 0} Blocks`;
    document.getElementById('analytics-problems-val').textContent = `${problemsSolved} / 80`;
}

function renderCurriculumRoadmap() {
    const container = document.getElementById('curriculum-roadmap-container');
    if (!container) return;
    container.innerHTML = '';

    const phases = [
        { title: "Phase 1: Foundations (Days 1–5)", range: [1, 5] },
        { title: "Phase 2: Core Concepts (Days 6–10)", range: [6, 10] },
        { title: "Phase 3: Applied Systems (Days 11–15)", range: [11, 15] },
        { title: "Phase 4: Advanced & Capstone (Days 16–20)", range: [16, 20] }
    ];

    phases.forEach(phase => {
        const phaseCard = document.createElement('div');
        phaseCard.className = "glass-card p-5 rounded-2xl border border-slate-800 space-y-4";
        
        let daysHtml = '';
        for (let d = phase.range[0]; d <= phase.range[1]; d++) {
            const dayData = CURRICULUM_DATA.find(item => item.day === d);
            if (!dayData) continue;

            daysHtml += `
                <div class="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-blue-400">Day ${dayData.day} • ${dayData.dateStr.split(' (')[0]}</span>
                        <button onclick="window.app.selectDay(${dayData.day}); window.app.switchTab('dashboard');" class="text-[10px] text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Jump to Day</button>
                    </div>
                </div>
            `;
        }

        phaseCard.innerHTML = `
            <h3 class="text-sm font-bold text-white border-b border-slate-800 pb-2">${phase.title}</h3>
            <div class="space-y-3">${daysHtml}</div>
        `;
        container.appendChild(phaseCard);
    });
}

function setupTimerDisplay() {
    const mins = Math.floor(timerState.remainingSeconds / 60);
    const secs = timerState.remainingSeconds % 60;
    document.getElementById('timer-display').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function showToast(message, isError = false) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `p-3.5 rounded-2xl ${isError ? 'bg-red-600 text-white' : 'bg-slate-900 border border-slate-700 text-slate-100 shadow-xl'} text-xs font-semibold flex items-center gap-2 pointer-events-auto transition-all transform translate-y-2 opacity-0 shadow-2xl`;
    toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-triangle-exclamation' : 'fa-circle-check text-emerald-400'} text-sm"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setupEventListeners() {
    // Event bindings for modular architecture
}

// Global App Namespace
window.app = {
    selectDay,
    switchTab: (tabId) => {
        currentState.activeTab = tabId;
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    },
    toggleTask: (taskKey) => {
        currentState.completedTasks[taskKey] = !currentState.completedTasks[taskKey];
        if (currentState.completedTasks[taskKey]) addXP(50, "Session Completed");
        renderScheduleForDay(currentState.currentDay);
        renderMiniCalendar();
    },
    toggleProblemLog: (probKey) => {
        currentState.problemLogs[probKey] = !currentState.problemLogs[probKey];
        if (currentState.problemLogs[probKey]) addXP(20, "Problem Solved");
        renderProblemTrackerForDay(currentState.currentDay);
    },
    submitQuizAnswer,
    rateFlashcardSM2: (q) => {
        const card = FLASHCARDS[currentFlashcardIndex];
        if (!currentState.flashcardsState) currentState.flashcardsState = {};
        let cState = currentState.flashcardsState[card.id] || { ...card };
        const updatedState = calculateSM2(cState, q);
        currentState.flashcardsState[card.id] = updatedState;
        addXP(15, "Flashcard SM-2 Rated");
        currentFlashcardIndex = (currentFlashcardIndex + 1) % FLASHCARDS.length;
        renderFlashcard(currentFlashcardIndex);
    },
    flipFlashcard: () => {
        isFlashcardFlipped = !isFlashcardFlipped;
        const inner = document.getElementById('flashcard-inner');
        if (isFlashcardFlipped) {
            inner.classList.add('rotate-y-180');
            playPopSound(currentState.soundMuted);
        } else {
            inner.classList.remove('rotate-y-180');
        }
    },
    runCCode: () => {
        const code = document.getElementById('c-code-editor').value;
        executeCCode(code, document.getElementById('c-terminal-output'), document.getElementById('c-memory-table-container'));
        addXP(25, "C Code Executed");
    },
    toggleAmbient: (type) => toggleAmbientSound(type, showToast)
};
