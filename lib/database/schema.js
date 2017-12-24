'use strict';

const database = require('../../app/initializers/database');

module.exports = (tableName) => {
    return database.getSchema(tableName);
};
