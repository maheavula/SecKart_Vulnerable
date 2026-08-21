const { defineConfig } = require("cypress");
module.exports = defineConfig({allowCypressEnv:false,e2e:{baseUrl:"http://127.0.0.1:8090",supportFile:false,video:false}});
