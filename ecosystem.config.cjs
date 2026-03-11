module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'dist/src/index.js',
      cwd: '/root/sofar5/backend',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'telegram-bot',
      script: 'dist/main.js',
      cwd: '/root/sofar5/telegram-admin-bot',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
