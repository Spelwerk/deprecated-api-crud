'use strict';

const database = require('../../app/initializers/database');

module.exports = () => {
    return database.getPool();
};
