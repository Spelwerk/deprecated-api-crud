'use strict';

const DatabaseError = require('../../lib/errors/database-error');
const DatabaseDuplicateEntryError = require('../../lib/errors/database-duplicate-entry-error');

const pool = require('../../app/initializers/database').getPool();
const logger = require('../logger');

/**
 * Walks through the fields object and creates a new array with compressed values
 *
 * @param fields Object
 * @returns {object}
 */
function formatFields(fields) {
    let object = {};

    if(!fields) return null;

    // If the fields object exists
    for(let i in fields) {
        let field = fields[i];

        if(field.columnType === 1) {
            object[field.name] = 'boolean';
        } else if(field.columnType === 3 && field.name.indexOf("id") !== -1) {
            object[field.name] = 'id';
        } else if(field.columnType === 3 && field.name.indexOf("id") === -1) {
            object[field.name] = 'integer';
        } else if(field.columnType === 12) {
            object[field.name] = 'datetime';
        } else if(field.columnType === 252) {
            object[field.name] = 'text';
        } else if(field.columnType === 253) {
            object[field.name] = 'string';
        }
    }

    return object;
}

/**
 * Walks through the results object and replace all boolean TINYINT(1) with true booleans
 *
 * @param rows Object
 * @param fields Object
 * @returns {results}
 */
function formatRows(rows, fields) {
    if(!rows || rows.length === 0 || !fields) return null;

    // If we have one or more result
    for(let i in rows) {
        let result = rows[i];

        // Loop through the result object
        for(let j in result) {
            let resultTypeKey = j;

            // Loop through the fields object
            for(let k in fields) {
                let fieldTypeKey = k;
                let fieldType = fields[k];

                if(resultTypeKey === fieldTypeKey && fieldType === 'boolean') {
                    result[j] = result[j] === 1;
                }
            }
        }
    }

    return rows;
}

async function sql(sql, params) {
    logger.debug({sql: sql});

    try {
        let data = [];
        let result = await pool.execute(sql, params);

        if(sql.indexOf('SELECT') !== -1) {
            let rows = formatRows(result[0], result[1]),
                fields = formatFields(result[1]);

            data = [rows, fields];
        } else if(sql.indexOf('INSERT') !== -1) {
            let id = result[0].insertId;

            data = [id];
        }

        return data;
    } catch(e) {
        if(e.code === 'ER_DUP_ENTRY') {
            return new DatabaseDuplicateEntryError(e);
        } else {
            return new DatabaseError(e);
        }
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = sql;
