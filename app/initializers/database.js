'use strict';

const oldMysql = require('mysql');
let oldPool;

const mysql = require('mysql2/promise');
const nconf = require('nconf');
const logger = require('../../lib/logger');

const restrictedFields = ['id', 'user_id', 'canon', 'calculated', 'template', 'created', 'deleted', 'updated'];

let pool;
let dbSchema = {};

async function getTablesArray() {
    let array = [];

    let sql = "SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = ?";
    let params = [nconf.get('database:database')];

    try {
        let [rows] = await pool.execute(sql, params);

        for(let i in rows) {
            let name = rows[i].table_name;

            array.push(name);
        }

        return array;
    } catch(e) {
        throw e;
    }

}

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
            accepted: []
        },

        // Relational Tables
        tables: {
            hasMany: [],
            isOne: [],
            withData: []
        }
    };
}

function getTableSchemaGeneral(tableSchema, rows) {
    for(let i in rows) {
        let columnName = rows[i].column_name;

        tableSchema.fields.all.push(columnName);

        if(columnName === 'canon') tableSchema.fields.canon = true;
        if(columnName === 'updated') tableSchema.fields.updated = true;
        if(columnName === 'deleted') tableSchema.fields.deleted = true;

        if(restrictedFields.indexOf(columnName) === -1) tableSchema.fields.accepted.push(columnName);
    }

    return tableSchema;
}

function getTableSchemaRelations(tableName, tableSchema, array) {
    for(let i in array) {
        let compareName = array[i];

        if(compareName === tableName) continue;
        if(compareName.indexOf(tableName) === -1) continue;

        // Setting User Security
        if(compareName === 'user_has_' + tableName) {
            tableSchema.security.user = true;
        }

        // Setting "many to many" relations
        if(compareName.indexOf(tableName + '_has_') !== -1) {
            let pushName = compareName.split('_has_')[1];

            if(pushName === 'comment') {
                tableSchema.supports.comments = true;
            }

            if(pushName === 'image') {
                tableSchema.supports.images = true;
            }

            if(pushName === 'label') {
                tableSchema.supports.labels = true;
            }

            if(['comment', 'image', 'label'].indexOf(pushName) === -1) {
                tableSchema.tables.hasMany.push(pushName);
            }
        }

        // Setting "one to one" relations
        if(compareName.indexOf(tableName + '_is_') !== -1) {
            let pushName = compareName.split('_is_')[1];

            if(pushName === 'copy') {
                tableSchema.supports.copies = true;
            }

            if(pushName !== 'copy') {
                tableSchema.tables.isOne.push(pushName);
            }
        }

        // Setting "with data" relations
        if(compareName.indexOf(tableName + '_with_') !== -1) {
            let pushName = compareName.split('_with_')[1];

            tableSchema.tables.withData.push(pushName);
        }
    }

    return tableSchema;
}

async function getTableSchema(tableName, array) {
    logger.info('[DATABASE] Getting schema for ' + tableName);

    // Bootstrap
    let tableSchema = bootstrapTableSchema();

    // Top Table
    if(tableName.indexOf('_') === -1) tableSchema.topTable = true;

    // SQL
    let sql = "SELECT column_name FROM information_schema.columns WHERE table_name = ? AND table_schema = ?";
    let params = [tableName, nconf.get('database:database')];

    try {
        let [rows] = await pool.execute(sql, params);

        // General Schema
        tableSchema = getTableSchemaGeneral(tableSchema, rows);

        // Relations Schema
        tableSchema = getTableSchemaRelations(tableName, tableSchema, array);

        // Admin Restriction
        tableSchema.security.admin = !tableSchema.security.user;

        return tableSchema;
    } catch(e) {
        throw e;
    }
}

async function getDatabaseSchema(array) {
    let object = {};

    for(let i in array) {
        let tableName = array[i];

        try {
            object[tableName] = await getTableSchema(tableName, array);
        } catch(e) {
            throw e;
        }
    }

    return object;
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

        let array = await getTablesArray();

        dbSchema = await getDatabaseSchema(array);
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

// ////////////////////////////////////////////////////////////////////////////////// //
// DEPRECATED
// ////////////////////////////////////////////////////////////////////////////////// //

function getOldPool() {
    return oldPool;
}

module.exports.getOldPool = getOldPool;
