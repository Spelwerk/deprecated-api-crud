'use strict';

var CustomError = require('./custom-error');

module.exports.NotFoundError = function() {
    return CustomError(404,
        'User not found',
        'The requested user was not found.',
        'The user ID was not found in the database.');
};

module.exports.NotLoggedInError = function() {
    return CustomError(403,
        'Forbidden',
        'User is not logged in.',
        'The user ID was not populated on the request object.');
};

module.exports.NotAdministratorError = function() {
    return CustomError(403,
        'Forbidden',
        'User is not administrator.',
        'The user ID does not have the administrator variable set to true.');
};

module.exports.NotAllowedToEditError = function() {
    return CustomError(403,
        'Forbidden',
        'User is not allowed to edit this row.',
        'The user is not an administrator, nor does the user have the owner, or edit permissions.');
};

module.exports.ExpiredTimeoutError = function() {
    return CustomError(400,
        'Forbidden',
        'Timeout Expired',
        'The timeout has expired. You will need to create a new secret by sending a new email.');
};

module.exports.InvalidSecretError = function() {
    return CustomError(400,
        'Forbidden',
        'Wrong Secret');
};

module.exports.InvalidTokenError = function() {
    return CustomError(400,
        'Forbidden',
        'Invalid Token');
};
