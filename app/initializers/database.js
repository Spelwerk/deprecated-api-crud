'use strict';

var mysql = require('mysql'),
    nconf = require('nconf');

var pool,
    tables = [];

function connect(callback) {
    try {
        // Create the connection pool
        pool = mysql.createPool({
            host: nconf.get('database:host'),
            database: nconf.get('database:database'),
            user: nconf.get('database:username'),
            password: nconf.get('database:password'),
            connectionLimit: 100,
            waitForConnections: true,
            queueLimit: 0,
            debug: false,
            wait_timeout: 28800,
            connect_timeout: 10
        });
    } catch(err) {
        callback(err);
    }

    pool.query("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = '" + nconf.get('database:database') + "'", function(err, results) {
        if(err) return callback(err);

        for(var i in results) {
            var tableName = results[i].table_name;

            tables.push(tableName);
        }

        callback();
    });
}

function getPool() {
    return pool;
}

function getTables() {
    return tables;
}

module.exports.connect = connect;
module.exports.getPool = getPool;
module.exports.getTables = getTables;