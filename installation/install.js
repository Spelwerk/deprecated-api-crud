'use strict';

let async = require('async'),
    mysql = require('mysql'),
    nconf = require('nconf');

// Set environment
let environment = process.env.NODE_ENV || 'development';

// Load configuration from file
nconf.file({
    file: './../config/' + environment + '.yml',
    format: require('nconf-yaml')
});

// Load onion
let onion = require('./../lib/onion');

// Create the connection pool
let pool = mysql.createPool({
    host: nconf.get('database:host'),
    database: nconf.get('database:database'),
    user: nconf.get('database:username'),
    password: nconf.get('database:password'),
    connectionLimit: 1,
    waitForConnections: true,
    queueLimit: 0,
    debug: false,
    wait_timeout: 28800,
    connect_timeout: 10
});

let email = nconf.get('superuser:email'),
    password = nconf.get('superuser:password'),
    encrypted;

async.series([
    function(callback) {
        onion.encrypt(password, function(err, result) {
            if(err) return callback(err);

            encrypted = result;

            callback();
        });
    },
    function(callback) {
        let query = 'INSERT INTO user (id,email,password,displayname,admin,verified) VALUES (1,?,?,?,1,1) ON DUPLICATE KEY UPDATE email = ?, password = ?, displayname = ?, admin = 1, verified = 1';
        let array = [email, encrypted, 'administrator'];

        query = mysql.format(query, array);
        query = mysql.format(query, array);

        pool.query(query, function(err) {
            callback(err);
        });
    }
], function(err) {
    if(err) throw new Error(err);

    console.log("Created Super User account with...\nemail: " + email + "\npassword: " + password);

    process.exit(1);
});
