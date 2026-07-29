export function calculateSM2(cardState, q) {
    let interval = cardState.interval || 1;
    let repetitions = cardState.repetitions || 0;
    let easeFactor = cardState.easeFactor || 2.5;

    if (q >= 2) {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);
        repetitions += 1;
    } else {
        repetitions = 0;
        interval = 1;
    }

    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    return {
        ...cardState,
        interval,
        repetitions,
        easeFactor,
        nextReview: nextDate.toDateString()
    };
}
