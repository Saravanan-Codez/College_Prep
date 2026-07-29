export const USER_LEVELS = [
    { level: 1, title: "Novice Coder", minXp: 0, maxXp: 200 },
    { level: 2, title: "Syntax Apprentice", minXp: 200, maxXp: 500 },
    { level: 3, title: "Logic Builder", minXp: 500, maxXp: 1000 },
    { level: 4, title: "Pointer Specialist", minXp: 1000, maxXp: 1800 },
    { level: 5, title: "Data Structures Scholar", minXp: 1800, maxXp: 2800 },
    { level: 6, title: "Algorithm Analyst", minXp: 2800, maxXp: 4000 },
    { level: 7, title: "Systems Hacker", minXp: 4000, maxXp: 5500 },
    { level: 8, title: "Low-Level Engineer", minXp: 5500, maxXp: 7500 },
    { level: 9, title: "Compiler Architect", minXp: 7500, maxXp: 10000 },
    { level: 10, title: "CS Prep Titan", minXp: 10000, maxXp: 99999 }
];

export const ACHIEVEMENTS = [
    { id: "first_step", title: "First Step", icon: "fa-seedling", desc: "Completed your first study session", color: "text-emerald-400" },
    { id: "pointer_wizard", title: "Pointer Wizard", icon: "fa-wand-magic-sparkles", desc: "Completed Day 6 Pointers & Memory", color: "text-purple-400" },
    { id: "calculus_ninja", title: "Calculus Ninja", icon: "fa-calculator", desc: "Completed 5 Mathematics sessions", color: "text-blue-400" },
    { id: "night_reader", title: "Night Reader", icon: "fa-book-open", desc: "Completed 3 Technical Reading blocks", color: "text-rose-400" },
    { id: "problem_crusher", title: "Problem Crusher", icon: "fa-laptop-code", desc: "Solved 10 algorithm problems", color: "text-amber-400" },
    { id: "focus_master", title: "Focus Master", icon: "fa-stopwatch", desc: "Completed 5 Focus Timer blocks", color: "text-cyan-400" },
    { id: "quiz_whiz", title: "Quiz Whiz", icon: "fa-brain", desc: "Passed 3 Daily Quizzes", color: "text-indigo-400" },
    { id: "json_explorer", title: "JSON Explorer", icon: "fa-file-code", desc: "Exported or Loaded a JSON backup", color: "text-emerald-400" },
    { id: "p2p_synced", title: "P2P Bluetooth Master", icon: "fa-bluetooth", desc: "Synced progress offline over P2P/Bluetooth", color: "text-cyan-400" },
    { id: "college_ready", title: "College Ready", icon: "fa-graduation-cap", desc: "Reached 50% overall completion", color: "text-yellow-400" }
];

export function getUserLevelInfo(xp) {
    const userXp = xp || 0;
    let currentLvl = USER_LEVELS[0];
    for (let lvl of USER_LEVELS) {
        if (userXp >= lvl.minXp) currentLvl = lvl;
    }
    const progressInLvl = userXp - currentLvl.minXp;
    const lvlRange = currentLvl.maxXp - currentLvl.minXp;
    const percent = Math.min(100, Math.round((progressInLvl / lvlRange) * 100));

    return { ...currentLvl, progressInLvl, lvlRange, percent };
}
