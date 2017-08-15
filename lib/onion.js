var aes = require('nodejs-aes256'),
    bcrypt = require('bcrypt'),
    crypto = require('crypto'),
    nconf = require('nconf');

// Setting salt level
var salt = 12;

function hmac(password) {

    // Creating the password crypto using the secret
    var passHash = crypto.createHmac('sha256', nconf.get('secrets:sha'));

    // Encrypting the password with SHA256
    passHash.update(password);

    // Returning the encypted password as HEX
    return passHash.digest('hex');

}

function encrypt(password, callback) {

    // Hashing password with SHA256
    var hashedPassword = hmac(password);

    // Encrypt the hashed password with bcrypt
    bcrypt.hash(hashedPassword, salt, function(err, result) {
        if(err) return callback(err);

        // Encrypt the bcrypted password with AES256
        var encryptedPassword = aes.encrypt(nconf.get('secrets:aes'), result);

        // Calling back error or AES encrypted password
        callback(err, encryptedPassword);
    });

}

function decrypt(password, comparisonPassword, callback) {

    // Hashing password with SHA256
    var encryptedPassword = hmac(password);

    // Decrypting the AES password back to a bcrypt string
    var encryptedComparisonPassword = aes.decrypt(nconf.get('secrets:aes'), comparisonPassword);

    // Comparing the hashed password with the bcrypt string and calling back the result
    bcrypt.compare(encryptedPassword, encryptedComparisonPassword, callback);

}

module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;