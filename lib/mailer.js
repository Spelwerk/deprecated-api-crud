const nconf = require('nconf');
const config = require('node-yaml').readSync('../config/mailgun.yml');
const mailgun = require('mailgun-js')(config);
const mailcomposer = require('mailcomposer');

module.exports = (email, subject, text, callback) => {
    let mail = {
        from: nconf.get('superuser:noreply'),
        to: email,
        subject: subject,
        text: '',
        html: text
    };

    let composer = mailcomposer(mail);

    composer.build(function(err, message) {
        let dataToSend = {
            to: mail.to,
            message: message.toString('ascii')
        };

        mailgun.messages().sendMime(dataToSend, callback);
    });
};
