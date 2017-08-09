'use strict';

var mysql = require('mysql'),
    nconf = require('nconf');

var pool;

function connect(callback) {
    try {
        // Create the connection pool
        pool = mysql.createPool({
            host: nconf.get('database:host'),
            database: nconf.get('database:database'),
            user: nconf.get('database:user'),
            password: nconf.get('database:password'),
            connectionLimit: 100,
            waitForConnections: true,
            queueLimit: 0,
            debug: false,
            wait_timeout: 28800,
            connect_timeout: 10
        });

        return callback();
    } catch(err) {
        callback(err);
    }
}

function getPool() {
    return pool;
}

module.exports.connect = connect;
module.exports.getPool = getPool;
