export const CURRICULUM_DATA = [
    {
        day: 1,
        phase: "Phase 1: Foundations",
        dateStr: "July 30, 2026 (Thursday)",
        math: {
            topic: "Functions, Domain & Range",
            subtopics: ["Types of Functions (One-to-One, Onto)", "Algebra of Functions", "Domain & Range Determination"],
            docsUrl: "https://ocw.mit.edu/courses/18-01-single-variable-calculus/",
            videos: [
                { title: "3Blue1Brown - What is a Function?", embedId: "kvGlZuUveCg", url: "https://www.youtube.com/watch?v=kvGlZuUveCg" },
                { title: "Khan Academy - Functions Domain & Range", embedId: "hVimVzgtD6w", url: "https://www.youtube.com/watch?v=hVimVzgtD6w" },
                { title: "Professor Leonard - Calculus 1 Functions", embedId: "riXcZT2ICjA", url: "https://www.youtube.com/watch?v=riXcZT2ICjA" }
            ]
        },
        physics: {
            topic: "Units, Dimensions & Vector Addition",
            subtopics: ["SI Base & Derived Quantities", "Dimensional Formula Analysis", "Vector Components & Dot Product"],
            docsUrl: "https://openstax.org/details/books/university-physics-volume-1",
            videos: [
                { title: "Flipping Physics - Vectors Introduction", embedId: "A3805m-e-uA", url: "https://www.youtube.com/watch?v=A3805m-e-uA" },
                { title: "Physics Galaxy - Vectors & Scalars", embedId: "g4S3sZ3vK5o", url: "https://www.youtube.com/watch?v=g4S3sZ3vK5o" },
                { title: "Walter Lewin MIT - Physics Vectors", embedId: "wWnfJ0-smB8", url: "https://www.youtube.com/watch?v=wWnfJ0-smB8" }
            ]
        },
        chem: {
            topic: "Atomic Structure & Quantum Numbers",
            subtopics: ["Bohr Atomic Model", "Principal & Azimuthal Quantum Numbers", "Aufbau Principle & Hund's Rule"],
            docsUrl: "https://chem.libretexts.org/",
            videos: [
                { title: "CrashCourse - Atomic Structure", embedId: "FSyAehMdpyI", url: "https://www.youtube.com/watch?v=FSyAehMdpyI" },
                { title: "Organic Chemistry Tutor - Quantum Numbers", embedId: "A3805m-e-uA", url: "https://www.youtube.com/watch?v=A3805m-e-uA" }
            ]
        },
        prog: {
            topic: "C Setup, Variables & Basic I/O",
            subtopics: ["Memory Layout of C Program", "Data Types (int, float, char)", "printf() & scanf() Format Specifiers"],
            docsUrl: "https://en.cppreference.com/w/c",
            programs: ["Hello World", "Simple Calculator", "Area of Circle", "Swap Two Variables"],
            snippetTitle: "Day 1: Hello World & Basic Calculator",
            videos: [
                { title: "freeCodeCamp - C Programming Course", embedId: "KJgsSFOSQv0", url: "https://www.youtube.com/watch?v=KJgsSFOSQv0" },
                { title: "Neso Academy - C Variables & Datatypes", embedId: "2n7l91W2W94", url: "https://www.youtube.com/watch?v=2n7l91W2W94" },
                { title: "CodeWithHarry - C Language Setup", embedId: "aA4vM0sH1yY", url: "https://www.youtube.com/watch?v=aA4vM0sH1yY" }
            ]
        },
        dsa: {
            topic: "Arrays & Contiguous Memory Layout",
            subtopics: ["Array Indexing & Offset Math", "Contiguous Memory Address Calculation", "Time Complexity of Traversal"],
            docsUrl: "https://visualgo.net/en/array",
            videos: [
                { title: "CS50 - Arrays & Memory", embedId: "LfaMVlDaQ4g", url: "https://www.youtube.com/watch?v=LfaMVlDaQ4g" },
                { title: "MyCodeSchool - Arrays Data Structure", embedId: "gDqQfQ_A_c8", url: "https://www.youtube.com/watch?v=gDqQfQ_A_c8" }
            ]
        },
        web: {
            topic: "HTML5 Semantic Structure & Forms",
            subtopics: ["HTML5 Document Structure", "Semantic Tags (<header>, <main>, <article>)", "Form Inputs & Action Attributes"],
            docsUrl: "https://developer.mozilla.org/en-US/docs/Web/HTML",
            videos: [
                { title: "Net Ninja - HTML Tutorial", embedId: "ub36ffRNAqA", url: "https://www.youtube.com/watch?v=ub36ffRNAqA" },
                { title: "Traversy Media - HTML5 Crash Course", embedId: "UB1O30fR-EE", url: "https://www.youtube.com/watch?v=UB1O30fR-EE" }
            ]
        },
        reading: "Clean Code - Chapter 1: Clean Code Principles"
    },
    {
        day: 2,
        phase: "Phase 1: Foundations",
        dateStr: "July 31, 2026 (Friday)",
        math: {
            topic: "Limits & Continuity",
            subtopics: ["Left & Right Hand Limits", "L'Hôpital's Rule Intuition", "Continuity at a Point"],
            docsUrl: "https://ocw.mit.edu/courses/18-01-single-variable-calculus/",
            videos: [
                { title: "3Blue1Brown - Essence of Calculus Limits", embedId: "kfF40MiXwge", url: "https://www.youtube.com/watch?v=kfF40MiXwge" },
                { title: "Professor Leonard - Calculus Limits", embedId: "riXcZT2ICjA", url: "https://www.youtube.com/watch?v=riXcZT2ICjA" }
            ]
        },
        physics: {
            topic: "Kinematics in 1D & 2D",
            subtopics: ["Displacement, Velocity & Acceleration Equations", "Projectile Motion Trajectory", "Relative Motion"],
            docsUrl: "https://openstax.org/details/books/university-physics-volume-1",
            videos: [
                { title: "Physics Galaxy - Motion in 1D", embedId: "rA97bWJ_h-Y", url: "https://www.youtube.com/watch?v=rA97bWJ_h-Y" },
                { title: "Flipping Physics - Kinematics 2D", embedId: "kKKM8Y-u7ds", url: "https://www.youtube.com/watch?v=kKKM8Y-u7ds" }
            ]
        },
        chem: {
            topic: "Chemical Bonding & VSEPR Theory",
            subtopics: ["Ionic vs Covalent Bonds", "VSEPR Molecular Geometry", "Dipole Moment"],
            docsUrl: "https://chem.libretexts.org/",
            videos: [
                { title: "Organic Chemistry Tutor - Chemical Bonding", embedId: "CGA8sRwqIFg", url: "https://www.youtube.com/watch?v=CGA8sRwqIFg" }
            ]
        },
        prog: {
            topic: "C Conditionals & Switch Case",
            subtopics: ["if / else if / else Logic", "Switch-Case Jump Tables", "Ternary Conditional Operator"],
            docsUrl: "https://en.cppreference.com/w/c",
            programs: ["Odd or Even", "Find Largest of 3 Numbers", "Leap Year Checker"],
            snippetTitle: "Day 2: Conditionals & Leap Year Checker",
            videos: [
                { title: "Neso Academy - C Control Statements", embedId: "2n7l91W2W94", url: "https://www.youtube.com/watch?v=2n7l91W2W94" },
                { title: "CodeWithHarry - C If Else", embedId: "aA4vM0sH1yY", url: "https://www.youtube.com/watch?v=aA4vM0sH1yY" }
            ]
        },
        dsa: {
            topic: "Linear Search vs Binary Search",
            subtopics: ["Linear Search O(N) Algorithm", "Binary Search O(log N) Divide & Conquer", "Midpoint Calculation Avoid Overflow"],
            docsUrl: "https://visualgo.net/en/sorting",
            videos: [
                { title: "CS50 - Linear and Binary Search", embedId: "n0vJ_iB7Vvg", url: "https://www.youtube.com/watch?v=n0vJ_iB7Vvg" }
            ]
        },
        web: {
            topic: "CSS Fundamentals & Box Model",
            subtopics: ["CSS Selectors & Specificity", "Margin, Border, Padding & Content Box", "box-sizing: border-box"],
            docsUrl: "https://developer.mozilla.org/en-US/docs/Web/CSS",
            videos: [
                { title: "Web Dev Simplified - CSS Box Model", embedId: "rIO5326FgPE", url: "https://www.youtube.com/watch?v=rIO5326FgPE" }
            ]
        },
        reading: "Clean Code - Chapter 2: Meaningful Names"
    },
    ...Array.from({ length: 18 }, (_, i) => {
        const dayNum = i + 3;
        return {
            day: dayNum,
            phase: dayNum <= 5 ? "Phase 1: Foundations" : (dayNum <= 10 ? "Phase 2: Core Concepts" : (dayNum <= 15 ? "Phase 3: Applied Systems" : "Phase 4: Advanced & Capstone")),
            dateStr: `August ${dayNum - 2}, 2026`,
            math: {
                topic: `Day ${dayNum} Advanced Calculus & Matrix Algebra`,
                subtopics: ["Derivative / Integral Rules", "Matrix Transformations & Determinants"],
                docsUrl: "https://ocw.mit.edu/courses/18-01-single-variable-calculus/",
                videos: [
                    { title: `3Blue1Brown - Day ${dayNum} Math`, embedId: "fNk_zzaMoSs", url: "https://www.youtube.com/watch?v=fNk_zzaMoSs" },
                    { title: `Professor Leonard - Day ${dayNum} Calculus`, embedId: "riXcZT2ICjA", url: "https://www.youtube.com/watch?v=riXcZT2ICjA" }
                ]
            },
            physics: {
                topic: `Day ${dayNum} Physics for Computer Science`,
                subtopics: ["Newton's Laws / Electromagnetism", "Circuit Analysis & Wave Equations"],
                docsUrl: "https://openstax.org/details/books/university-physics-volume-1",
                videos: [
                    { title: `Flipping Physics - Day ${dayNum} Physics`, embedId: "kKKM8Y-u7ds", url: "https://www.youtube.com/watch?v=kKKM8Y-u7ds" },
                    { title: `Physics Galaxy - Day ${dayNum}`, embedId: "A3805m-e-uA", url: "https://www.youtube.com/watch?v=A3805m-e-uA" }
                ]
            },
            chem: {
                topic: `Day ${dayNum} Chemistry & Materials Science`,
                subtopics: ["Reaction Kinetics / Thermodynamics", "Electrochemistry & Semiconductors"],
                docsUrl: "https://chem.libretexts.org/",
                videos: [
                    { title: `CrashCourse - Day ${dayNum} Chemistry`, embedId: "FSyAehMdpyI", url: "https://www.youtube.com/watch?v=FSyAehMdpyI" }
                ]
            },
            prog: {
                topic: `Day ${dayNum} C Programming & Systems Memory`,
                subtopics: ["Pointers, Structs, File I/O & Dynamic Allocation", "Stack & Heap RAM Management"],
                docsUrl: "https://en.cppreference.com/w/c",
                programs: [`Day ${dayNum} Program 1`, `Day ${dayNum} Program 2`],
                snippetTitle: `Day ${dayNum}: C Systems Program Example`,
                videos: [
                    { title: `freeCodeCamp - Day ${dayNum} C Lessons`, embedId: "KJgsSFOSQv0", url: "https://www.youtube.com/watch?v=KJgsSFOSQv0" },
                    { title: `Neso Academy - Day ${dayNum} C Module`, embedId: "2n7l91W2W94", url: "https://www.youtube.com/watch?v=2n7l91W2W94" }
                ]
            },
            dsa: {
                topic: `Day ${dayNum} Data Structures & Algorithms`,
                subtopics: ["Trees, Graphs, Sorting & Searching", "Time & Space Complexity Analysis"],
                docsUrl: "https://visualgo.net/en",
                videos: [
                    { title: `CS50 - Day ${dayNum} Data Structures`, embedId: "5nsKTtrBFdQ", url: "https://www.youtube.com/watch?v=5nsKTtrBFdQ" },
                    { title: `MyCodeSchool - Day ${dayNum} Algorithms`, embedId: "gDqQfQ_A_c8", url: "https://www.youtube.com/watch?v=gDqQfQ_A_c8" }
                ]
            },
            web: {
                topic: `Day ${dayNum} Web Design & Developer CLI Tools`,
                subtopics: ["HTML5, CSS Flexbox/Grid, JS DOM, Linux CLI & Git"],
                docsUrl: "https://developer.mozilla.org/en-US/",
                videos: [
                    { title: `Fireship - Day ${dayNum} Web & Linux Tools`, embedId: "DHjsxUQ-M9Y", url: "https://www.youtube.com/watch?v=DHjsxUQ-M9Y" },
                    { title: `Web Dev Simplified - Day ${dayNum} Web`, embedId: "rIO5326FgPE", url: "https://www.youtube.com/watch?v=rIO5326FgPE" }
                ]
            },
            reading: `Computer Systems (CSAPP) / Clean Code - Day ${dayNum} Reading`
        };
    })
];
