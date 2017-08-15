'use strict';

var async = require('async'),
    mysql = require('mysql'),
    nconf = require('nconf');

// Set environment
var environment = process.env.NODE_ENV || 'development';

// Load configuration from file
nconf.file({
    file: './../config/' + environment + '.yml',
    format: require('nconf-yaml')
});

// Load onion
var onion = require('./../lib/onion');

// Create the connection pool
var pool = mysql.createPool({
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

var email = nconf.get('superuser:email'),
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
        var query = 'INSERT INTO user (id,email,password,displayname,admin,verify) VALUES (1,?,?,?,1,1) ON DUPLICATE KEY UPDATE id = 1, email = ?, password = ?, displayname = ?, admin = 1, verify = 1';
        var array = [email, encrypted, 'administrator'];

        query = mysql.format(query, array);
        query = mysql.format(query, array);

        pool.query(query, function(err) {
            callback(err);
        });
    }
],function(err) {
    if(err) throw new Error(err);

    console.log("Created Super User account with...\nemail: " + email + "\npassword: " + password);

    process.exit(1);
});
