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
            logger.info('[DATABASE] Creating Table Schema');

            async.eachLimit(tablesArray, 1, function(tableName, next) {
                // Set up the table object
                tables[tableName] = {
                    topTable: false,
                    restriction: {
                        user: false,
                        admin: false
                    },
                    has: {
                        comments: false,
                        copies: false,
                        images: false,
                        labels: false,
                        canon: false,
                        updated: false,
                        deleted: false
                    },
                    columns: [],
                    fields: [],
                    combinations: [],
                    relations: [],
                };

                // If the table has no underscores it is a top table
                if(tableName.indexOf('_') === -1) tables[tableName].topTable = true;

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

                if(tables[tableName].topTable) logger.info('[DATABASE] Setting up schema for ' + tableName);

                // Compare each table against all other tables.
                for(let x in tablesArray) {
                    let compareName = tablesArray[x];

                    // If there's a table called user_has_* then the table can be owned by users
                    if(compareName === 'user_has_' + tableName) {
                        tables[tableName].restriction.user = true;
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

                    if(compareName === tableName + '_has_comment') {
                        tables[tableName].has.comments = true;
                    }

                    if(compareName === tableName + '_is_copy') {
                        tables[tableName].has.copies = true;
                    }

                    if(compareName === tableName + '_has_image') {
                        tables[tableName].has.images = true;
                    }

                    if(compareName === tableName + '_has_label') {
                        tables[tableName].has.labels = true;
                    }
                }

                // Setting admin restriction to the opposite of userOwned
                tables[tableName].restriction.admin= !tables[tableName].restriction.user;

                let columnsArray = tables[tableName].columns;

                for(let i in columnsArray) {

                    // Verify if updated field exists in columns
                    if(columnsArray[i] === 'canon') {
                        tables[tableName].has.canon = true;
                    }

                    // Verify if updated field exists in columns
                    if(columnsArray[i] === 'updated') {
                        tables[tableName].has.updated = true;
                    }

                    // Verify if deleted field exists in columns
                    if(columnsArray[i] === 'deleted') {
                        tables[tableName].has.deleted = true;
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
        //todo commented out, used for verification. delete when happy.
        //console.log(tables['weapon']);

        done(err);
    });
}

function getPool() {
    return pool;
}

function getTable(tableName) {
    return tables[tableName];
}

module.exports.setup = setup;
module.exports.getPool = getPool;
module.exports.getTable = getTable;
