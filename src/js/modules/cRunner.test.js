import { test, expect, mock } from "bun:test";

// Mock Tauri invoke
mock.module("@tauri-apps/api/core", () => {
  return {
    invoke: () => "mocked invoke"
  };
});

// Since CInterpreterVM is not exported, we can read cRunner.js and run it inside a global evaluation context, OR we can test the exported executeCCode.
// But we can also test evalExpr indirectly via VM by running execute on the VM.
// Wait! Let's expose CInterpreterVM if we want to test it directly, or let's just evaluate code and inspect the VM or the behavior of executeCCode.
// Let's see: we can read cRunner.js, replace "class CInterpreterVM" with "export class CInterpreterVM", and write a dynamic module or test it.
// Actually, is there a simpler way? Yes! We can read cRunner.js and eval it or use a Function constructor to extract CInterpreterVM.
// Let's do that cleanly in the test:

import fs from "fs";
import path from "path";

const cRunnerPath = path.resolve(__dirname, "cRunner.js");
const cRunnerCode = fs.readFileSync(cRunnerPath, "utf8");
const runnableCode = cRunnerCode
  .replace("import { invoke } from '@tauri-apps/api/core';", "const invoke = () => {};")
  .replace("class CInterpreterVM", "globalThis.CInterpreterVM = class CInterpreterVM")
  .replace(/export\s+/g, '');

// Evaluate the code to register globalThis.CInterpreterVM
eval(runnableCode);

test("CInterpreterVM security and execution", () => {
  const vm = new globalThis.CInterpreterVM();

  // 1. Math and variable assignment
  const res1 = vm.execute(`
    int main() {
        int val = 20 * 5;
        printf("Value: %d", val);
        return 0;
    }
  `);
  expect(res1).toContain("Value: 100");
  expect(res1).toContain("[Process exited with status code 0]");

  // 2. Safe math functions like sqrt
  const res2 = vm.execute(`
    int main() {
        int val = sqrt(16);
        printf("Sqrt: %d", val);
        return 0;
    }
  `);
  expect(res2).toContain("Sqrt: 4");

  // 3. Pointer simulation safety fallback to 0
  const res3 = vm.execute(`
    int main() {
        int x = 42;
        printf("Addr: %p", &x);
        return 0;
    }
  `);
  expect(res3).toContain("Addr: 0");

  // 4. Block malicious execution (rce)
  let exploitCalled = false;
  globalThis.rceTest = () => {
    exploitCalled = true;
  };

  vm.execute(`
    int main() {
        printf("Malicious: %d", rceTest());
        return 0;
    }
  `);
  expect(exploitCalled).toBe(false);
});
