export const DAILY_QUIZZES = {
    1: {
        question: "In C, which format specifier is used to read/print a floating point number (`float`)?",
        options: ["%d", "%f", "%c", "%s"],
        correct: 1,
        explanation: "%f is used for single-precision floats. %d is for integers, %c for characters, and %s for strings."
    },
    2: {
        question: "Which of the following condition checks if a variable `year` is a leap year?",
        options: [
            "year % 4 == 0",
            "(year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)",
            "year % 100 == 0",
            "year % 400 == 0"
        ],
        correct: 1,
        explanation: "A leap year is divisible by 4 AND not 100, unless it is also divisible by 400."
    },
    ...Object.fromEntries(Array.from({ length: 18 }, (_, i) => {
        const dayNum = i + 3;
        return [dayNum, {
            question: `Day ${dayNum} Practice Check: Which C function dynamically releases heap memory?`,
            options: ["free()", "delete()", "drop()", "release()"],
            correct: 0,
            explanation: "In C, free(pointer) releases memory allocated by malloc/calloc/realloc back to heap."
        }];
    }))
};
