/** Database setup for BizTime. */

// we are extracting client object from pg
const { Client } = require("pg");


//where are we connecting to
let db = new Client({
    connectionString: "postgresql:///biztime"
});


//this starts up our connection
db.connect();

module.exports = { db };