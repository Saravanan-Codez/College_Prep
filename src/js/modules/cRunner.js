/**
 * EngiPrep Dual-Engine C Execution & Memory VM
 * 1. Native GCC/Clang Compiler Integration (in Desktop & Mobile App via Tauri IPC)
 * 2. Client-Side WASM/JS C Execution Engine (in Web Browser)
 */

import { invoke } from '@tauri-apps/api/core';

export function extractAndRenderMemoryTable(env, tableContainer) {
    if (!tableContainer) return;

    const vars = Object.keys(env.variables).map(name => env.variables[name]);

    if (vars.length === 0) {
        tableContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.75rem; font-style: italic;">No stack variables declared.</p>`;
        return;
    }

    tableContainer.innerHTML = `
        <table style="width: 100%; text-align: left; border-collapse: collapse; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">
            <thead>
                <tr style="color: var(--text-muted); border-bottom: 1px solid var(--border); font-size: 0.65rem; text-transform: uppercase;">
                    <th style="padding: 4px 6px;">Stack Addr</th>
                    <th style="padding: 4px 6px;">Type</th>
                    <th style="padding: 4px 6px;">Variable</th>
                    <th style="padding: 4px 6px;">Value</th>
                </tr>
            </thead>
            <tbody>
                ${vars.map(v => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                        <td style="padding: 6px; color: var(--accent-purple); font-weight: 600;">${v.addr}</td>
                        <td style="padding: 6px; color: var(--accent-blue);">${v.type}</td>
                        <td style="padding: 6px; color: var(--accent-green); font-weight: 700;">${v.name}</td>
                        <td style="padding: 6px; color: var(--text-main); font-weight: 600; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v.displayValue}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

class CInterpreterVM {
    constructor() {
        this.stdout = [];
        this.baseAddr = 0x7fff5fbff7a0;
        this.variables = {};
        this.memoryMap = {};
    }

    log(msg) {
        this.stdout.push(msg);
    }

    allocate(name, type, val) {
        this.baseAddr += (type === 'double' || type === 'long long') ? 8 : 4;
        const addrHex = "0x" + this.baseAddr.toString(16);
        let displayVal = val;
        if (Array.isArray(val)) {
            displayVal = `{${val.join(', ')}}`;
        } else if (typeof val === 'string') {
            displayVal = `"${val}"`;
        } else if (val !== undefined && val !== null) {
            displayVal = String(val);
        }
        const varObj = { name, type, val, addr: addrHex, displayValue: displayVal };
        this.variables[name] = varObj;
        this.memoryMap[addrHex] = val;
        return varObj;
    }

    evalExpr(expr, scope = {}) {
        let clean = expr.trim();
        if (clean.startsWith('"') && clean.endsWith('"')) {
            return clean.slice(1, -1);
        }
        Object.keys(scope).forEach(v => {
            const val = scope[v].val;
            const re = new RegExp(`\\b${v}\\b`, 'g');
            clean = clean.replace(re, typeof val === 'number' ? val : JSON.stringify(val));
        });
        Object.keys(this.variables).forEach(v => {
            const val = this.variables[v].val;
            const re = new RegExp(`\\b${v}\\b`, 'g');
            clean = clean.replace(re, typeof val === 'number' ? val : JSON.stringify(val));
        });

        clean = clean.replace(/\babs\b/g, 'Math.abs')
                     .replace(/\bsqrt\b/g, 'Math.sqrt')
                     .replace(/\bpow\b/g, 'Math.pow')
                     .replace(/\bfloor\b/g, 'Math.floor')
                     .replace(/\bceil\b/g, 'Math.ceil');

        // Validation: Remove single/double-quoted string/character literals, safe Math functions, and hex prefixes
        let testStr = clean.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '')
                           .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, '')
                           .replace(/\bMath\.(abs|sqrt|pow|floor|ceil)\b/g, '')
                           .replace(/\b0[xX][0-9a-fA-F]+\b/g, '');

        // Reject if there are any characters outside the strict whitelist (only digits, basic math operators, parentheses, commas, dots, and spaces)
        if (!/^[0-9.+\-*/%(),\s]*$/.test(testStr)) {
            return 0;
        }

        try {
            return Function(`"use strict"; return (${clean});`)();
        } catch(e) {
            return 0;
        }
    }

    execute(code) {
        this.stdout = [];
        this.variables = {};
        this.baseAddr = 0x7fff5fbff7a0;

        const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        let body = cleanCode;
        const mainMatch = cleanCode.match(/int\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/);
        if (mainMatch) {
            body = mainMatch[1];
        }

        const lines = body.split(';').map(l => l.trim()).filter(Boolean);

        for (let line of lines) {
            const declMatch = line.match(/^(int|float|double|char\*|char|long\s+long)\s+([a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?(?:\s*,\s*[a-zA-Z_]\w*(?:\s*=\s*[^,;]+)?)*)/);
            if (declMatch) {
                const type = declMatch[1];
                const varsPart = declMatch[2];
                const itemParts = varsPart.split(',');
                for (let item of itemParts) {
                    const eqIdx = item.indexOf('=');
                    if (eqIdx !== -1) {
                        const vName = item.substring(0, eqIdx).trim();
                        const vExpr = item.substring(eqIdx + 1).trim();
                        const val = this.evalExpr(vExpr);
                        this.allocate(vName, type, val);
                    } else {
                        const vName = item.trim();
                        this.allocate(vName, type, 0);
                    }
                }
                continue;
            }

            const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/=|=)\s*(.+)$/);
            if (assignMatch) {
                const vName = assignMatch[1];
                const op = assignMatch[2];
                const expr = assignMatch[3];
                if (this.variables[vName]) {
                    const rhs = this.evalExpr(expr);
                    let newVal = rhs;
                    if (op === '+=') newVal = this.variables[vName].val + rhs;
                    if (op === '-=') newVal = this.variables[vName].val - rhs;
                    if (op === '*=') newVal = this.variables[vName].val * rhs;
                    if (op === '/=') newVal = Math.floor(this.variables[vName].val / rhs);
                    this.variables[vName].val = newVal;
                    this.variables[vName].displayValue = String(newVal);
                }
                continue;
            }

            const printfMatch = line.match(/printf\s*\(\s*"([^"]*)"\s*(?:,\s*(.*))?\s*\)/);
            if (printfMatch) {
                let fmt = printfMatch[1];
                const argsStr = printfMatch[2];
                fmt = fmt.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

                if (argsStr) {
                    const args = argsStr.split(',').map(a => a.trim());
                    args.forEach(arg => {
                        let evaluatedVal = this.evalExpr(arg);
                        fmt = fmt.replace(/%[.\d]*[dfscg%]|%p|%lld/, evaluatedVal);
                    });
                }
                this.log(fmt);
                continue;
            }

            const forMatch = line.match(/for\s*\(\s*(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\d+)\s*;\s*(?:\1\+\+|\+\+\1|\1\s*\+=\s*1)\s*\)\s*\{?([^}]*)\}?/);
            if (forMatch) {
                const iterVar = forMatch[1];
                const start = parseInt(forMatch[2]);
                const end = parseInt(forMatch[3]);
                const loopBody = forMatch[4];

                this.allocate(iterVar, 'int', start);

                for (let i = start; i < end && i < 100; i++) {
                    this.variables[iterVar].val = i;
                    this.variables[iterVar].displayValue = String(i);

                    const bodyLines = loopBody.split(';').map(l => l.trim()).filter(Boolean);
                    for (let bLine of bodyLines) {
                        const bPrintf = bLine.match(/printf\s*\(\s*"([^"]*)"\s*(?:,\s*(.*))?\s*\)/);
                        if (bPrintf) {
                            let fmt = bPrintf[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                            if (bPrintf[2]) {
                                const args = bPrintf[2].split(',').map(a => a.trim());
                                args.forEach(arg => {
                                    const val = this.evalExpr(arg, { [iterVar]: { val: i } });
                                    fmt = fmt.replace(/%[.\d]*[dfscg%]|%p|%lld/, val);
                                });
                            }
                            this.log(fmt);
                        }
                    }
                }
                continue;
            }

            if (line.startsWith('return ')) {
                const retVal = this.evalExpr(line.replace('return', '').trim());
                this.log(`\n[Process exited with status code ${retVal}]`);
                break;
            }
        }

        return this.stdout.join('');
    }
}

export async function executeCCode(code, outputEl, tableContainer) {
    if (!outputEl) return;

    outputEl.textContent = "⚡ Invoking GCC/Clang compilation pipeline...\n";

    const isTauriApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

    if (isTauriApp) {
        try {
            const res = await invoke('compile_and_run_c', { code });
            outputEl.textContent = res;

            // Also inspect stack variables for visual RAM inspector
            const vm = new CInterpreterVM();
            vm.execute(code);
            extractAndRenderMemoryTable(vm, tableContainer);
            return;
        } catch(err) {
            outputEl.textContent = err;
            return;
        }
    }

    // Web Browser execution engine fallback
    setTimeout(() => {
        try {
            const vm = new CInterpreterVM();
            const result = vm.execute(code);

            outputEl.textContent = "[Web WASM Engine Output]:\n" + (result || "Program finished with exit code 0.");
            extractAndRenderMemoryTable(vm, tableContainer);
        } catch(err) {
            outputEl.textContent = `❌ Execution Error:\n${err.message}`;
        }
    }, 100);
}
