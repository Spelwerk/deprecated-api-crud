var async = require('async'),
    chai = require('chai');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/assets', function() {

    it('should get a response', function(done) {
        app.get('/assets')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                expect(res.body.success, 'Success is not set to true').to.be.true;
                expect(res.body.message, 'No message exists').to.be.a('string');

                expect(res.body.data, 'Data is not an array').to.be.instanceof(Array);
                expect(res.body.data, 'Data array is empty').to.have.length.of.at.least(1);

                done();
            });
    });

});