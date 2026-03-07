module.exports = {
    apps: [
        {
            name: "gestaogor-backend",
            script: "index.js",
            cwd: "./server",
            env: {
                NODE_ENV: "development",
            }
        },
        {
            name: "gestaogor-frontend",
            script: "node_modules/vite/bin/vite.js",
            args: "--host",
            cwd: "./",
            env: {
                NODE_ENV: "development",
            }
        }
    ]
};
