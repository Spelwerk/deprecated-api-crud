'use strict';

const database = require('../../app/initializers/database');

/** @deprecated **/
module.exports = (tableName) => {
    return database.getSchema(tableName);
};
