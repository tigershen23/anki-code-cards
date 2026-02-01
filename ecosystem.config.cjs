module.exports = {
  apps: [
    {
      name: "anki_code_cards",
      script: "bun",
      args: "--hot src/index.ts",
      cwd: __dirname,
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
