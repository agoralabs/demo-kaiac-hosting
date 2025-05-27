const dotenv = require('dotenv');
const env = dotenv.config().parsed;

module.exports = {
 apps: [{
   name: "kaiac-backend",
   script: "index.js",
   env: {...process.env}
 }]
};