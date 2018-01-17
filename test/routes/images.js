let async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

let should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

let app = require('../app'),
    verifier = require('../verifier'),
    hasher = require('../../lib/hasher');

describe('/images', function() {

    function verifyItem(item) {
        assert.isNumber(item.id);
        assert.isNumber(item.user_id);

        assert.equal(validator.isURL(item.path), true);

        assert.isString(item.created);
        assert.isNull(item.deleted);
    }

    let baseRoute = '/images';
    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    describe('POST', function() {

        it('/ should create a new item', function(done) {
            let payload = {
                path: 'http://fakeimage.com/' + hasher(20) + '.png'
            };

            app.post(baseRoute, payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

    });

    describe('GET', function() {

        it('/ should return a list', function(done) {
            app.get(baseRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/:id should return one item', function(done) {
            app.get(baseRoute + '/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

    });

});