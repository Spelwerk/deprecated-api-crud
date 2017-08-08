var logger = require(appRoot + '/lib/logger'),
    sequel = require(appRoot + '/lib/sql/sequel'),
    auth = require(appRoot + '/lib/sql/auth');

//TODO: perhaps move into /app/routes/users.js ?

exports.relationPost = function(req, userId, relationName, relationId, callback) {
    if(!req.user.id) return callback('Forbidden.');

    if(req.user.id !== userId && !req.user.admin) return callback('Forbidden.');

    sequel.query('INSERT INTO user_has_' + relationName + ' (user_id,' + relationName + '_id) VALUES (?,?)', [userId, relationId], callback);
};

exports.relationDelete = function(req, userId, relationName, relationId, callback) {
    if(!req.user.id) return callback('Forbidden.');

    if(req.user.id !== userId && !req.user.admin) return callback('Forbidden.');

    sequel.query('DELETE FROM user_has_' + relationName + ' WHERE user_id = ? AND ' + relationName + '_id = ?', [userId, relationId], callback);
};
