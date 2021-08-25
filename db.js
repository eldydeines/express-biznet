/** Database setup for BizTime. */

// we are extracting client object from pg
const { Client } = require("pg");

//for database path
let DB_URI;

// USE PROCESS VARIABLE 
// If we're running in test "mode", use our test db
// Make sure to create both databases!
if (process.env.NODE_ENV === "test") {
    DB_URI = "postgresql:///biztime_test";
} else {
    DB_URI = "postgresql:///biztime";
}


//where are we connecting to 
let db = new Client({
    connectionString: DB_URI
});


//this starts up our connection
db.connect();

module.exports = db;