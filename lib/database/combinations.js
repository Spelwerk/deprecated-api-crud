'use strict';

const AppError = require('../errors/app-error');

const sql = require('./sql');

async function single(tableName, tableId, combinationName, combinationId) {
    try {
        tableId = parseInt(tableId);
        combinationId = parseInt(combinationId);

        if(!tableId) return new AppError(400, 'Table ID missing', 'Table ID missing');
        if(!combinationId) return new AppError(400, 'Combination ID missing', 'Combination ID missing');

        let table_is_combination = tableName + '_is_' + combinationName,
            table_id = tableName + '_id',
            combination_id = combinationName + '_id';

        return await sql('INSERT INTO ' + table_is_combination + ' (' + table_id + ',' + combination_id + ') VALUES (?,?) ON DUPLICATE KEY UPDATE ' + combination_id + ' = VALUES(' + combination_id + ')', [tableId, combinationId]);
    } catch(e) {
        return e;
    }
}

async function multiple(tableName, tableId, combinationArray, body) {
    try {
        if(combinationArray.length !== 0) return null;

        for(let i in combinationArray) {
            let combinationName = combinationArray[i];
            let key = combinationName + '_id';

            if(!body.hasOwnProperty(key)) return null;
            if(body[key] === '') return null;

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
