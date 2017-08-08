var nconf = require('nconf'),
    mailgun = require('mailgun-js')({apiKey: nconf.get('mailgun:apikey'), domain: nconf.get('mailgun:domain')}),
    mailcomposer = require('mailcomposer');

module.exports = function(email, subject, text, callback) {
    var mail = {
        from: nconf.get('superuser:noreply'),
        to: email,
        subject: subject,
        text: '',
        html: text
    };

    var composer = mailcomposer(mail);

    composer.build(function(err, message) {
        var dataToSend = {
            to: mail.to,
            message: message.toString('ascii')
        };

        mailgun.messages().sendMime(dataToSend, callback);
    });
};