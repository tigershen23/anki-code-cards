// Usage: pm2 run ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "anki_code_cards",
      script: "bun",
      args: "--hot --splitting src/index.ts",
      cwd: __dirname,
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "development",
      },
    },
    {
      name: "anki_code_cards_tailwind",
      script: "bunx",
      args: "@tailwindcss/cli -i ./src/styles.css -o ./src/output.css --watch",
      cwd: __dirname,
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
