let nconf = require('nconf'),
    mailgun = require('mailgun-js')({apiKey: nconf.get('mailgun:apikey'), domain: nconf.get('mailgun:domain')}),
    mailcomposer = require('mailcomposer');

module.exports = function(email, subject, text, callback) {
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