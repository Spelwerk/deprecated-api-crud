const aes = require('nodejs-aes256');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nconf = require('nconf');

// Setting salt level
const salt = nconf.get('salt');

function hmac(password) {
    try {
        // Creating the password crypto using the secret
        let passHash = crypto.createHmac('sha256', nconf.get('secrets:sha'));

        // Encrypting the password with SHA256
        passHash.update(password);

        // Returning the encypted password as HEX
        return passHash.digest('hex');
    } catch(e) {
        return e;
    }
}

async function encrypt(password) {
    try {
        let encryptedPassword = hmac(password);

        let hashedPassword = await bcrypt.hash(encryptedPassword, salt);

        return aes.encrypt(nconf.get('secrets:aes'), hashedPassword);
    } catch(e) {
        return e;
    }
}

async function decrypt(password, comparison) {
    try {
        let encryptedPassword = hmac(password);

        let encryptedComparison = aes.decrypt(nconf.get('secrets:aes'), comparison);

        return await bcrypt.compare(encryptedPassword, encryptedComparison);
    } catch(e) {
        return e;
    }
}

function OLDencrypt(password, callback) {

    // Hashing password with SHA256
    let hashedPassword = hmac(password);

    // Encrypt the hashed password with bcrypt
    bcrypt.hash(hashedPassword, salt, function(err, result) {
        if(err) return callback(err);

        // Encrypt the bcrypted password with AES256
        let encryptedPassword = aes.encrypt(nconf.get('secrets:aes'), result);

        // Calling back error or AES encrypted password
        callback(err, encryptedPassword);
    });

}

function OLDdecrypt(password, comparisonPassword, callback) {

    // Hashing password with SHA256
    let encryptedPassword = hmac(password);

    // Decrypting the AES password back to a bcrypt string
    let encryptedComparisonPassword = aes.decrypt(nconf.get('secrets:aes'), comparisonPassword);

    // Comparing the hashed password with the bcrypt string and calling back the result
    bcrypt.compare(encryptedPassword, encryptedComparisonPassword, callback);

}

module.exports.encrypt = OLDencrypt;
module.exports.decrypt = OLDdecrypt;
