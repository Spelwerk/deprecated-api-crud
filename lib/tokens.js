'use strict';

let JSONWebTokenError = require('./errors/json-web-token-error');

let jwt = require('jsonwebtoken'),
    nconf = require('nconf');

let base = nconf.get('links:base'),
    secret = nconf.get('secrets:jwt');

function encode(email) {

    // Set iat and exp as integers
    let now = Math.floor(Date.now() / 1000),
        end = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

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

    let validity = true,
        decoded = null;

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

module.exports.encode = encode;
module.exports.decode = decode;