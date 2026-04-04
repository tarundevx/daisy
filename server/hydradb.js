require('dotenv').config({ path: '../.env' }); // load .env if not loaded yet
const { HydraDBClient } = require('@hydra_db/node');

const client = new HydraDBClient({ token: process.env.HYDRADB_API_KEY });

module.exports = client;
