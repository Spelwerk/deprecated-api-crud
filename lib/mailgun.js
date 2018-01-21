'use strict';

const nconf = require('nconf');
const config = require('node-yaml').readSync('../config/mailgun.yml');
const mailgun = require('mailgun-js')(config);

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC/EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = async (recipient, subject, message) => {
    let data = {
        from: nconf.get('superuser:noreply'),
        to: recipient,
        subject: subject,
        text: message,
        html: message,
    };

    return await mailgun.messages().send(data);
};
