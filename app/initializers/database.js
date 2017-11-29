'use strict';

let mysql = require('mysql'),
    async = require('async'),
    nconf = require('nconf');

let logger = require(appRoot + '/lib/logger');

let pool,
    tables = {};

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
            logger.info('[DATABASE] Populating Tables Array');

            pool.query("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = '" + nconf.get('database:database') + "'", function(err, results) {
                if(err) return callback(err);

                for(let i in results) {
                    let tableName = results[i].table_name;

                    tablesArray.push(tableName);
                }

                callback();
            });
        },
        function(callback) {
            logger.info('[DATABASE] Creating list of fields for table objects');

            async.eachLimit(tablesArray, 1, function(tableName, next) {
                // Set up the table object
                tables[tableName] = {
                    adminRestriction: false,
                    userOwned: false,
                    updateField: false,
                    columns: [],
                    fields: [],
                    combinations: [],
                    relations: []
                };

                pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = '" + tableName + "' AND table_schema = '" + nconf.get('database:database') + "'", function(err, results) {
                    if(err) return next(err);

                    for(let i in results) {
                        let columnName = results[i].column_name;

                        tables[tableName].columns.push(columnName);
                    }

                    next();
                });
            }, function(err) {
                callback(err);
            });
        },
        function(callback) {
            logger.info('[DATABASE] Looping Tables');

            let restrictedArray = ['id', 'user_id', 'canon', 'created', 'deleted', 'updated'];

            // Loop through all Tables
            for(let i in tablesArray) {
                let tableName = tablesArray[i];

                // Compare each table against all other tables.
                for(let x in tablesArray) {
                    let compareName = tablesArray[x];

                    // If there's a table called user_has_* then the table can be owned by users
                    if(compareName === 'user_has_' + tableName) {
                        tables[tableName].userOwned = true;
                    }

                    // If there's a table called tableName_is_* then a nullable combination table exists
                    if(compareName.indexOf(tableName + '_is_') !== -1 && compareName.indexOf('is_copy') === -1) {
                        let combinationName = compareName.split('_is_')[1];

                        tables[tableName].combinations.push(combinationName);
                    }

                    // If there's a table called tableName_has_* then a relation table exists
                    if(compareName.indexOf(tableName + '_has_') !== -1 && compareName.indexOf('has_comment') === -1) {
                        let relationName = compareName.split('_has_')[1];

                        tables[tableName].relations.push(relationName);
                    }
                }

                // Setting admin restriction to the opposite of userOwned
                tables[tableName].adminRestriction = !tables[tableName].userOwned;

                let columnsArray = tables[tableName].columns;

                for(let i in columnsArray) {

                    // Verify if updated field exists in columns
                    if(columnsArray[i] === 'updated') {
                        tables[tableName].updateField = true;
                    }

                    // If the field is part of the restricted columns, don't add it to the fields list
                    if(restrictedArray.indexOf(columnsArray[i]) === -1) {
                        tables[tableName].fields.push(columnsArray[i]);
                    }
                }
            }

            callback();
        }
    ], function(err) {
        done(err);
    });
}

function getPool() {
    return pool;
}

function getTables() {
    return tables;
}

function getTable(tableName) {
    return tables[tableName];
}

module.exports.setup = setup;
module.exports.getPool = getPool;
module.exports.getTable = getTable;
module.exports.getTables = getTables;