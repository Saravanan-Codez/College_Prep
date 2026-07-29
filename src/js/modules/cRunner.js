export function extractAndRenderMemoryTable(code, tableContainer) {
    if (!tableContainer) return;

    const varRegex = /(int|float|double|char|long long)\s+([a-zA-Z_]\w*)\s*(?:\[\])?\s*=\s*([^;]+);/g;
    let match;
    let vars = [];
    let simulatedBaseAddr = 0x7fff5fbff7a0;

    while ((match = varRegex.exec(code)) !== null) {
        const type = match[1];
        const name = match[2];
        const val = match[3].trim();
        simulatedBaseAddr += 0x8;
        vars.push({ type, name, val, addr: "0x" + simulatedBaseAddr.toString(16) });
    }

    if (vars.length === 0) {
        tableContainer.innerHTML = `<p class="text-slate-500 italic text-[11px]">No local stack variables parsed.</p>`;
        return;
    }

    tableContainer.innerHTML = `
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="text-[10px] text-slate-500 border-b border-slate-800">
                    <th class="pb-1">Address</th>
                    <th class="pb-1">Type</th>
                    <th class="pb-1">Name</th>
                    <th class="pb-1">Value</th>
                </tr>
            </thead>
            <tbody class="text-[11px]">
                ${vars.map(v => `
                    <tr class="border-b border-slate-900/60">
                        <td class="py-1 text-purple-400 font-mono">${v.addr}</td>
                        <td class="py-1 text-blue-400">${v.type}</td>
                        <td class="py-1 text-emerald-300 font-bold">${v.name}</td>
                        <td class="py-1 text-slate-200 truncate max-w-[100px]">${v.val}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

export function executeCCode(code, outputEl, tableContainer) {
    outputEl.textContent = "Compiling with GCC...\nRunning executable ./program...\n\n";
    extractAndRenderMemoryTable(code, tableContainer);

    try {
        const printfRegex = /printf\s*\(\s*"([^"]*)"\s*(?:,\s*(.*))?\s*\);/g;
        let match;
        let logs = [];

        while ((match = printfRegex.exec(code)) !== null) {
            let fmt = match[1];
            let argsStr = match[2];
            fmt = fmt.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

            if (argsStr) {
                const args = argsStr.split(',').map(a => a.trim());
                args.forEach(arg => {
                    let evaluatedVal = arg;
                    try { evaluatedVal = eval(arg); } catch(e) {}
                    fmt = fmt.replace(/%[.\d]*[dfscg%]|%p|%lld/, evaluatedVal);
                });
            }
            logs.push(fmt);
        }

        if (logs.length === 0) {
            outputEl.textContent += "Program finished with exit code 0 (No printf output).";
        } else {
            outputEl.textContent += logs.join('');
            outputEl.textContent += "\n\n[Process completed with exit code 0]";
        }
    } catch(err) {
        outputEl.textContent += `[Execution Error]: ${err.message}`;
    }
}
