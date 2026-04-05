const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { HydraDBClient } = require('@hydra_db/node');

const client = new HydraDBClient({ token: process.env.HYDRADB_API_KEY });

module.exports = client;
