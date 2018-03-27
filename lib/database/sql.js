'use strict';

const DatabaseError = require('../../lib/errors/database-error');
const DatabaseDuplicateEntryError = require('../../lib/errors/database-duplicate-entry-error');

const mysql = require('mysql2');
const pool = require('../../app/initializers/database').getPool();
const logger = require('../logger');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

function formatFields(fields) {
    let object = {};

    if (!fields) return object;

    // If the fields object exists
    for (let i in fields) {
        let field = fields[i];

        if (field.columnType === 1) {
            object[field.name] = 'boolean';
        } else if (field.columnType === 3 && field.name.indexOf("id") !== -1) {
            object[field.name] = 'id';
        } else if (field.columnType === 3 && field.name.indexOf("id") === -1) {
            object[field.name] = 'integer';
        } else if (field.columnType === 12) {
            object[field.name] = 'datetime';
        } else if (field.columnType === 252) {
            object[field.name] = 'text';
        } else if (field.columnType === 253) {
            object[field.name] = 'string';
        }
    }

    return object;
}

function formatRows(rows, fields) {
    if (!rows || rows.length === 0 || !fields) return [];

    for (let i in rows) {
        let row = rows[i];

        for (let key in row) {
            if (!row.hasOwnProperty(key)) continue;

            if (fields[key] === 'boolean') row[key] = row[key] === 1;

            if (row[key] === '') row[key] = null;
        }
    }

    return rows;
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function sql(sql, params) {
    try {
        if (Array.isArray(params)) sql = mysql.format(sql, params);

        logger.debug({sql: sql});

        let data = [];
        let result = await pool.execute(sql);

        if (sql.indexOf('SELECT') !== -1) {
            let fields = formatFields(result[1]);
            let rows = formatRows(result[0], fields);

            data = [rows, fields];
        } else if (sql.indexOf('INSERT') !== -1) {
            data = result[0].insertId;
        }

        return data;
    } catch(e) {
        logger.error({sql: sql, error: e});

        throw e;
        //return e;
        //if (e.code === 'ER_DUP_ENTRY') {
        //    return new DatabaseDuplicateEntryError(e);
        //} else {
        //    return new DatabaseError(e);
        //}
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = sql;
