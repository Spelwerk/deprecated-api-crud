'use strict';

const environment = process.env.NODE_ENV || 'development';

const formatter = require('mysql2');
const mysql = require('mysql2/promise');
const nconf = require('nconf');

nconf.file({
    file: './../config/' + environment + '.yml',
    format: require('nconf-yaml')
});

let config = {
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
};

// Load onion
const onion = require('./../lib/onion');

async function install() {
    try {
        let pool = mysql.createPool(config);

        let email = nconf.get('superuser:email');
        let password = await onion.hash(nconf.get('superuser:password'));

        let query = 'INSERT INTO user (id,email,password,displayname,admin,verified) VALUES (1,?,?,?,1,1) ON DUPLICATE KEY UPDATE email = ?, password = ?, displayname = ?, admin = 1, verified = 1';
        let array = [email, password, 'administrator', email, password, 'administrator'];
        let sql = formatter.format(query, array);

        let result = await pool.execute(sql);
        if(result[0].insertId !== 1) console.log("ERROR", "ID is not 1. ID is " + result[0].insertId);

        console.log("Created Administrator account with...\nemail: " + email + "\npassword: " + nconf.get('superuser:password'));
        process.exit(0);
    } catch(e) {
        console.log(e);
        process.exit(1);
    }
}

void install();