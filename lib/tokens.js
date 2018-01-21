'use strict';

const JSONWebTokenError = require('./errors/json-web-token-error');

const jwt = require('jsonwebtoken');
const nconf = require('nconf');

const base = nconf.get('links:base');
const secret = nconf.get('secrets:jwt');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

function encode(email) {
    // Set iat and exp as integers
    let now = Math.floor(Date.now() / 1000);
    let end = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    // Creating payload object
    let payload = {
        iss: base,
        iat: now,
        exp: end,
        email: email
    };

    return jwt.sign(payload, secret);
}

function decode(token) {
    token = token || null;

    let validity = true;
    let decoded = null;

    if(token) {
        let verifiedToken;

        try {
            verifiedToken = jwt.verify(token, secret);
        } catch(e) {
            throw new JSONWebTokenError;
        }

        let iat = verifiedToken.iat,
            exp = verifiedToken.exp,
            now = Math.floor(Date.now() / 1000);

        // If IAT is lesser than now the JWT is invalid
        if(now < iat) validity = false;

        // If the token has expired the JWT is invalid
        if(now > exp) validity = false;

        // If there's no email address the JWT is invalid
        if(!verifiedToken.email) validity = false;

        // If the JWT is valid: return the decoded token
        if(validity) {
            decoded = verifiedToken;
        }
    }

    return decoded;
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORT
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.encode = encode;
module.exports.decode = decode;