export const C_SNIPPETS = {
    1: {
        title: "Day 1: Hello World & Simple Calculator",
        code: `#include <stdio.h>\n\nint main() {\n    printf("=== Welcome to CS College Prep OS ===\\n");\n    float num1 = 15.5, num2 = 4.5;\n    printf("Num1: %.2f | Num2: %.2f\\n", num1, num2);\n    printf("Sum        : %.2f\\n", num1 + num2);\n    printf("Difference : %.2f\\n", num1 - num2);\n    printf("Product    : %.2f\\n", num1 * num2);\n    printf("Quotient   : %.2f\\n", num1 / num2);\n    return 0;\n}`,
        explanation: "Covered concepts: Standard Output (printf), floating point formatting (%.2f), basic arithmetic operators."
    },
    ...Object.fromEntries(Array.from({ length: 19 }, (_, i) => {
        const d = i + 2;
        return [d, {
            title: `Day ${d}: C Systems Program Example`,
            code: `#include <stdio.h>\n\nint main() {\n    printf("=== Day ${d} C Execution ===\\n");\n    int val = ${d} * 10;\n    printf("Memory address simulated: %p | Value: %d\\n", &val, val);\n    return 0;\n}`,
            explanation: `Day ${d} C program demonstrates pointers, address simulation, and structured output.`
        }];
    }))
};
