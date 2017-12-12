'use strict';

let mysql = require('mysql'),
    async = require('async'),
    nconf = require('nconf');

let logger = require(appRoot + '/lib/logger');

let pool,
    tables = {};

const restrictedFields = ['id', 'user_id', 'canon', 'calculated', 'template', 'created', 'deleted', 'updated'];

/**
 * Returns a list of tables associated with the database
 *
 * @param callback
 * @returns callback(err, array)
 */
function getTables(callback) {
    logger.info('[DATABASE] Populating Tables Array');

    let array = [];

    pool.query("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = '" + nconf.get('database:database') + "'", function(err, results) {
        if(err) return callback(err);

        for(let i in results) {
            let tableName = results[i].table_name;

            array.push(tableName);
        }

        callback(null, array);
    });
}

/**
 * Bootstraps schema object for a table
 *
 * @param tableName String
 * @param callback
 * @returns callback(err, schema)
 */
function bootstrapSchema(tableName, callback) {
    logger.info('[DATABASE] Bootstrapping schema for ' + tableName);

    let schema = {
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

    if(tableName.indexOf('_') === -1) schema.topTable = true;

    pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = '" + tableName + "' AND table_schema = '" + nconf.get('database:database') + "'", function(err, results) {
        if(err) return callback(err);

        for(let i in results) {
            let columnName = results[i].column_name;

            schema.fields.all.push(columnName);

            if(columnName === 'canon') schema.fields.canon = true;
            if(columnName === 'updated') schema.fields.updated = true;
            if(columnName === 'deleted') schema.fields.deleted = true;

            if(restrictedFields.indexOf(columnName) === -1) schema.fields.accepted.push(columnName);
        }

        callback(null, schema);
    });
}

/**
 * Loops through tablesArray and populates schema with relational information
 *
 * @param tablesArray Array
 * @param tableName String
 * @param temp Object
 * @returns {schema}
 */
function schemaRelations(tablesArray, tableName, schema) {
    for(let i in tablesArray) {
        let compareName = tablesArray[i];

        if(compareName === tableName) continue;
        if(compareName.indexOf(tableName) === -1) continue;

        // Setting User Security
        if(compareName === 'user_has_' + tableName) {
            schema.security.user = true;
        }

        // Setting "many to many" relations
        if(compareName.indexOf(tableName + '_has_') !== -1) {
            let pushName = compareName.split('_has_')[1];

            if(pushName === 'comment') {
                schema.supports.comments = true;
            }

            if(pushName === 'image') {
                schema.supports.images = true;
            }

            if(pushName === 'label') {
                schema.supports.labels = true;
            }

            if(['comment', 'image', 'label'].indexOf(pushName) === -1) {
                //console.log(compareName);
                schema.tables.hasMany.push(pushName);
            }
        }

        // Setting "one to one" relations
        if(compareName.indexOf(tableName + '_is_') !== -1) {
            let pushName = compareName.split('_is_')[1];

            if(pushName === 'copy') {
                schema.supports.copies = true;
            }

            if(pushName !== 'copy') {
                schema.tables.isOne.push(pushName);
            }
        }

        // Setting "with data" relations
        if(compareName.indexOf(tableName + '_with_') !== -1) {
            let pushName = compareName.split('_with_')[1];

            schema.tables.withData.push(pushName);
        }
    }

    schema.security.admin = !schema.security.user;

    return schema;
}

function setup(done) {
    let tablesArray = [];

    async.series([
        function(callback) {
            logger.info('[DATABASE] Creating connection pool');

            try {
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

            callback();
        },
        function(callback) {
            getTables(function(err, array) {
                if(err) return callback(err);

                tablesArray = array;

                callback();
            });
        },
        function(callback) {
            logger.info('[DATABASE] Creating Table Schema');

            async.eachLimit(tablesArray, 1, function(tableName, next) {
                bootstrapSchema(tableName, function(err, schema) {
                    if(err) return next(err);

                    tables[tableName] = schema;

                    next();
                });
            }, function(err) {
                callback(err);
            });
        },
        function(callback) {
            logger.info('[DATABASE] Looping Tables');

            for(let i in tablesArray) {
                let tableName = tablesArray[i],
                    schema = tables[tableName];

                tables[tableName] = schemaRelations(tablesArray, tableName, schema);
            }

            callback();
        }
    ], function(err) {
        //todo commented out, used for verification. delete when happy.
        //console.log(tables['creature']);

        done(err);
    });
}

function getPool() {
    return pool;
}

function getSchema(tableName) {
    return tables[tableName];
}

module.exports.setup = setup;
module.exports.getPool = getPool;
module.exports.getSchema = getSchema;
