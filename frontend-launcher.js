import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const child = spawn('npm.cmd', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code) => {
    process.exit(code);
});
