const path = require("path")
const fs = require("fs")
const package = JSON.parse(fs.readFileSync(path.resolve(__dirname, "package.json")))

module.exports = {
  apps: [{
    name: package.name,
    script: package.main,

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: "",
    instances: 1,
    autorestart: true,
    watch: ["routes", "app.js", "models"],
    mode: "fork",
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      LOGLEVEL: 'trace'
    },
    env_production: {
      NODE_ENV: 'production',
      LOGLEVEL: 'info'
    }
  }],

  deploy: {
    production: {
      user: 'node',
      host: '212.83.163.1',
      ref: 'origin/master',
      repo: 'git@github.com:repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
