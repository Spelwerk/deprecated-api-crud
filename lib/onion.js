const aes = require('nodejs-aes256');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nconf = require('nconf');

// Setting salt level
const salt = nconf.get('salt');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

function hmac(password) {
    // Creating the password crypto using the secret
    let passHash = crypto.createHmac('sha256', nconf.get('secrets:sha'));

    // Encrypting the password with SHA256
    passHash.update(password);

    // Returning the encypted password as HEX
    return passHash.digest('hex');
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function hash(input) {
    try {
        // Hashes input with SHA256 HMAC
        let encryptedInput = hmac(input);

        // BCrypt with hashed input
        let hashedPassword = await bcrypt.hash(encryptedInput, salt);

        // Encrypt BCrypt string with AES256 and return
        return aes.encrypt(nconf.get('secrets:aes'), hashedPassword);
    } catch(e) { return e; }
}

async function compare(input, comparison) {
    try {
        // Hashes input with SHA256 HMAC
        let encryptedInput = hmac(input);

        // Decrypts real password(comparison) from AES256 into BCrypted state
        let encryptedComparison = aes.decrypt(nconf.get('secrets:aes'), comparison);

        // BCrypt will compare Input with BCrypted comparison string and return true/false
        return await bcrypt.compare(encryptedInput, encryptedComparison);
    } catch(e) { return e; }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.hash = hash;
module.exports.compare = compare;