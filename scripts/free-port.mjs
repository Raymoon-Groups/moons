import { execSync } from 'node:child_process';

const ports = process.argv.slice(2).map(Number).filter(Boolean);
if (ports.length === 0) {
  ports.push(3000, 3001);
}

function freeOnWindows(port) {
  try {
    const output = execSync(
      `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess"`,
      { encoding: 'utf8' },
    );
    const pids = [...new Set(output.trim().split(/\s+/).filter(Boolean))];
    for (const pid of pids) {
      try {
        execSync(
          `powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`,
          { stdio: 'ignore' },
        );
        console.log(`Freed port ${port} (stopped PID ${pid})`);
      } catch {
        // process may have already exited
      }
    }
  } catch {
    // no listener on port
  }
}

function freeOnUnix(port) {
  try {
    const pid = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    if (pid) {
      execSync(`kill -9 ${pid}`);
      console.log(`Freed port ${port} (stopped PID ${pid})`);
    }
  } catch {
    // no listener on port
  }
}

for (const port of ports) {
  if (process.platform === 'win32') {
    freeOnWindows(port);
  } else {
    freeOnUnix(port);
  }
}

// Brief pause so the OS releases the socket before the next server binds.
await new Promise((resolve) => setTimeout(resolve, 500));
