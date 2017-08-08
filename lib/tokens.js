var jwt = require('jsonwebtoken'),
    nconf = require('nconf');

function encode(req, email) {
    var now = Math.floor(Date.now() / 1000),
        end = Math.floor(Date.now() / 1000) + (nconf.get('timeouts:tokens:amount') * 24 * 60 * 60);

    // Creating payload object
    var payload = {
        iat: now,
        exp: end,
        iss: nconf.get('links:base'),
        email: email,
        agent: req.headers['users-agent']
    };

    return jwt.sign(payload, nconf.get('secrets:jwt'));
}

function decode(token) {
    token = token || null;

    var validity = true,
        decoded = null;

    if(token) {
        var verifiedToken = jwt.verify(token, nconf.get('secrets:jwt'));

        var iat = verifiedToken.iat,
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