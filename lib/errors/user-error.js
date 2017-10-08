'use strict';

module.exports.NotFoundError = function() {
    return {
        status: 404,
        title: 'User not found',
        message: 'The requested user was not found.',
        details: 'The user ID was not found in the database.'
    };
};

module.exports.NotLoggedInError = function() {
    return {
        status: 403,
        title: 'Forbidden',
        message: 'User is not logged in.',
        details: 'The user ID was not populated on the request object.'
    };
};

module.exports.NotAdministratorError = function() {
    return {
        status: 403,
        title: 'Forbidden',
        message: 'User is not administrator.',
        details: 'The user ID does not have the administrator variable set to true.'
    };
};

module.exports.NotAllowedToEditError = function() {
    return {
        status: 403,
        title: 'Forbidden',
        message: 'User is not allowed to edit this row.',
        details: 'The user is not an administrator, nor does the user have the owner, or edit permissions.'
    };
};

module.exports.TimeoutExceededError = function() {
    return {
        status: 400,
        title: 'Timeout Exceeded',
        message: '',
        details: ''
    };
};

module.exports.InvalidSecretError = function() {
    return {
        status: 400,
        title: 'Wrong Secret',
        message: '',
        details: ''
    };
};

module.exports.InvalidTokenError = function() {
    return {
        status: 400,
        title: 'Invalid Token',
        message: '',
        details: ''
    };
};
