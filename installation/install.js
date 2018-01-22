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
const onion = require('../lib/onion');
const tokens = require('../lib/tokens');

async function install() {
    try {
        let pool = mysql.createPool(config);

        let id = 1;
        let email = nconf.get('superuser:email');
        let password = await onion.hash(nconf.get('superuser:password'));
        let token = tokens.encode(email);

        let q1 = 'INSERT INTO user (id,email,password,displayname,admin,verified) VALUES (?,?,?,?,1,1) ON DUPLICATE KEY UPDATE email = ?, password = ?, displayname = ?, admin = 1, verified = 1';
        let a1 = [id, email, password, 'administrator', email, password, 'administrator'];
        let s1 = formatter.format(q1, a1);

        let r1 = await pool.execute(s1);
        if(r1[0].insertId !== id) console.log("ERROR", "ID is not 1. ID is " + r1[0].insertId);

        let q2 = 'INSERT INTO user_token (user_id,token) VALUES (?,?)';
        let a2 = [id, token];
        let s2 = formatter.format(q2, a2);

        let r2 = await pool.execute(s2);
        if(r2[0].affectedRows !== 1) console.log("ERROR", "Token was not inserted.");

        console.log("Created Administrator account with...\nemail: " + email + "\npassword: " + nconf.get('superuser:password') + "\ntoken: " + token);
        process.exit(0);
    } catch(e) {
        console.log(e);
        process.exit(1);
    }
}

void install();