'use strict';

const oldMysql = require('mysql');
let oldPool;

const mysql = require('mysql2/promise');
const nconf = require('nconf');
const logger = require('../../lib/logger');

const restrictedFields = ['id', 'user_id', 'canon', 'calculated', 'template', 'created', 'deleted', 'updated'];

let pool;
let dbArray = [];
let dbSchema = {};


function bootstrapTableSchema() {
    return {
        topTable: false,

        // Table changes is restricted to admin or requires a logged in user
        security: {
            admin: false,
            user: false
        },

        // The table supports the following extra relations
        supports: {
            comments: false,
            copies: false,
            images: false,
            labels: false
        },

        // Fields
        fields: {
            // The table has the following special fields
            canon: false,
            updated: false,
            deleted: false,

            // List of all fields
            all: [],

            // List of all fields that are allowed to be changed
            accepted: [],

            // List of options for all accepted fields
            options: {},

            // Extra Fields in withData
            extra: {}
        },

        // Relational Tables
        tables: {
            hasMany: [],
            isOne: [],
            withData: []
        }
    };
}

async function getColumnInformation(tableName) {
    logger.info('[DATABASE] getting column names for ' + tableName);

    let object = {};

    let query = "SELECT column_name AS name, data_type AS type, is_nullable AS nullable, character_maximum_length AS length FROM information_schema.columns WHERE table_name = ? AND table_schema = ?";
    let params = [tableName, nconf.get('database:database')];

    try {
        let [rows] = await pool.execute(query, params);

        for(let i in rows) {
            let name = rows[i].name;
            let type = rows[i].type;
            let length = rows[i].length;
            let nullable = rows[i].nullable === 'YES';

            object[name] = {type: type, nullable: nullable, maximum: length};
        }

        return object;
    } catch(e) {
        throw e;
    }
}


async function setDatabaseArray() {
    logger.info('[DATABASE] setting database array');

    let sql = "SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = ?";
    let params = [nconf.get('database:database')];

    try {
        let [rows] = await pool.execute(sql, params);

        for(let i in rows) {
            dbArray.push(rows[i].table_name);
        }

        return null;
    } catch(e) {
        throw e;
    }
}

async function setDatabaseSchema() {
    logger.info('[DATABASE] setting database schema');

    try {
        for(let i in dbArray) {
            let tableName = dbArray[i];

            void await setTableSchema(tableName);
        }

        for(let i in dbArray) {
            let tableName = dbArray[i];

            setTableSchemaExtraFields(tableName);
        }
    } catch(e) {
        throw e;
    }
}


async function setTableSchema(tableName) {
    logger.info('[DATABASE] setting table schema for ' + tableName);

    // Bootstrap
    dbSchema[tableName] = bootstrapTableSchema();

    // Top Table
    if(tableName.indexOf('_') === -1) dbSchema[tableName].topTable = true;

    try {
        // General Schema
        void await setTableSchemaGeneral(tableName);

        // Relations Schema
        setTableSchemaRelations(tableName);

        // Admin Restriction
        dbSchema[tableName].security.admin = !dbSchema[tableName].security.user;
    } catch(e) {
        throw e;
    }
}

async function setTableSchemaGeneral(tableName) {
    logger.info('[DATABASE] setting general schema information for ' + tableName);

    try {
        let object = await getColumnInformation(tableName);

        for(let key in object) {
            let name = key;
            let options = object[key];

            dbSchema[tableName].fields.all.push(name);

            if(name === 'canon') dbSchema[tableName].fields.canon = true;
            if(name === 'updated') dbSchema[tableName].fields.updated = true;
            if(name === 'deleted') dbSchema[tableName].fields.deleted = true;

            if(restrictedFields.indexOf(name) === -1) {
                dbSchema[tableName].fields.accepted.push(name);
                dbSchema[tableName].fields.options[name] = options;
            }
        }
    } catch(e) {
        throw e;
    }
}

function setTableSchemaRelations(tableName) {
    logger.info('[DATABASE] setting table schema relations for ' + tableName);

    for(let i in dbArray) {
        let compareName = dbArray[i];

        if(compareName === tableName) continue;
        if(compareName.indexOf(tableName) === -1) continue;

        // Setting User Security
        if(compareName === 'user_has_' + tableName) {
            dbSchema[tableName].security.user = true;
        }

        // Setting "many to many" relations
        if(compareName.indexOf(tableName + '_has_') !== -1) {
            let pushName = compareName.split('_has_')[1];

            if(pushName === 'comment') {
                dbSchema[tableName].supports.comments = true;
            }

            if(pushName === 'image') {
                dbSchema[tableName].supports.images = true;
            }

            if(pushName === 'label') {
                dbSchema[tableName].supports.labels = true;
            }

            if(['comment', 'image', 'label'].indexOf(pushName) === -1) {
                dbSchema[tableName].tables.hasMany.push(pushName);
            }
        }

        // Setting "one to one" relations
        if(compareName.indexOf(tableName + '_is_') !== -1) {
            let pushName = compareName.split('_is_')[1];

            if(pushName === 'copy') {
                dbSchema[tableName].supports.copies = true;
            }

            if(pushName !== 'copy') {
                dbSchema[tableName].tables.isOne.push(pushName);
            }
        }

        // Setting "with data" relations
        if(compareName.indexOf(tableName + '_with_') !== -1) {
            let pushName = compareName.split('_with_')[1];

            dbSchema[tableName].tables.withData.push(pushName);
        }
    }
}

function setTableSchemaExtraFields(tableName) {
    logger.info('[DATABASE] setting table schema extra fields for ' + tableName);

    let array = dbSchema[tableName].tables.withData;

    for(let i in array) {
        let extraName = array[i];
        let table_with_extra = tableName + '_with_' + extraName;
        let extraArray = dbSchema[table_with_extra].fields.accepted;

        dbSchema[tableName].fields.extra[extraName] = [];

        for(let i in extraArray) {
            if(extraArray[i] === tableName + '_id') continue;

            dbSchema[tableName].fields.extra[extraName].push(extraArray[i]);
        }
    }
}


async function setup() {
    logger.info('[DATABASE] Initializing');

    try {
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

        pool = mysql.createPool(config);
        oldPool = oldMysql.createPool(config);

        await setDatabaseArray();
        await setDatabaseSchema();

        //console.log(dbSchema['creature']);
    } catch(e) {
        throw e;
    }
}

function getPool() {
    return pool;
}

function getSchema(tableName) {
    return dbSchema[tableName];
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.setup = setup;
module.exports.getPool = getPool;
module.exports.getSchema = getSchema;

/** @deprecated */
function getOldPool() {
    return oldPool;
}

module.exports.getOldPool = getOldPool;
