'use strict';

const AppError = require('../errors/app-error');

const sql = require('./sql');

async function single(tableName, tableId, combinationName, combinationId) {
    try {
        tableId = parseInt(tableId);
        combinationId = parseInt(combinationId);

        if(!tableId) return new AppError(400, 'Table ID missing', 'Table ID missing');
        if(!combinationId) return new AppError(400, 'Combination ID missing', 'Combination ID missing');

        let table_is_combination = tableName + '_is_' + combinationName;
        let table_id = tableName + '_id';
        let combination_id = combinationName + '_id';

        let query = 'INSERT INTO ' + table_is_combination + ' (' + table_id + ',' + combination_id + ') VALUES (?,?) ON DUPLICATE KEY UPDATE ' + combination_id + ' = VALUES(' + combination_id + ')';
        let array = [tableId, combinationId];

        return await sql(query, array);
    } catch(e) {
        return e;
    }
}

async function multiple(tableName, tableId, combinationArray, body) {
    try {
        if(!combinationArray || combinationArray.length === 0) return null;

        for(let i in combinationArray) {
            let combinationName = combinationArray[i];
            let key = combinationName + '_id';

            if(!body.hasOwnProperty(key)) continue;
            if(body[key] === '') continue;

            let combinationId = parseInt(body[key]);

            await single(tableName, tableId, combinationName, combinationId);
        }

        return null;
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.single = single;
module.exports.multiple = multiple;
