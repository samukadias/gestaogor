module.exports = {
    apps: [
        {
            name: "fluxo-backend",
            script: "index.js",
            cwd: "C:\\Users\\153758\\.gemini\\antigravity\\scratch\\fluxoProd-main\\server",
            env: {
                NODE_ENV: "development",
            }
        },
        {
            name: "fluxo-frontend",
            script: "node_modules/vite/bin/vite.js",
            args: "--host",
            cwd: "C:\\Users\\153758\\.gemini\\antigravity\\scratch\\fluxoProd-main",
            env: {
                NODE_ENV: "development",
            }
        }
    ]
};
