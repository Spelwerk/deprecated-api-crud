var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('../app'),
    verifier = require('../verifier'),
    hasher = require('../../lib/hasher');

describe('/protection', function() {

    var temporaryId,
        attributeId,
        bodyPartId;

    before(function(done) {
        app.login(done);
    });

    before(function(done) {
        app.get('/attributes')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                attributeId = res.body.results[0].id;

                done();
            });
    });

    before(function(done) {
        app.get('/bodyparts')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                bodyPartId = res.body.results[0].id;

                done();
            });
    });

    function verifyList(body) {
        assert.isNumber(body.length);

        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        if(body.length > 0) {
            _.each(body.results, function(item) {
                verifyItem(item);
            });
        }

        assert.isObject(body.fields);
    }

    function verifyItem(item) {
        verifier.generic(item);

        assert.isNumber(item.bodypart_id);
        assert.isNumber(item.price);
    }


    describe('POST', function() {

        it('/ should create a new protection', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                bodypart_id: bodyPartId,
                price: 10
            };

            app.post('/protection', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:protectionId/clone should create a copy of the protection', function(done) {
            app.post('/protection/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:protectionId/comments should create a new comment for the protection', function(done) {
            app.post('/protection/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:protectionId/attributes should add an attribute to the protection', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/protection/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:protectionId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/protection/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:protectionId/canon should update the protection canon field', function(done) {
            app.put('/protection/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:protectionId/attributes should change the attribute value for the protection', function(done) {
            app.put('/protection/' + temporaryId + '/attributes/' + attributeId, { value: 8 })
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of protection', function(done) {
            app.get('/protection')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/bodypart/:bodyPartId should return a list of protection', function(done) {
            app.get('/protection/bodypart/' + bodyPartId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:protectionId should return one protection', function(done) {
            app.get('/protection/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:protectionId/ownership should return ownership status', function(done) {
            app.get('/protection/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:protectionId/comments should get all available comments', function(done) {
            app.get('/protection/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:protectionId/attributes should return a list', function(done) {
            app.get('/protection/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        verifier.generic(item);
                    });

                    done();
                });
        });

    });

    xdescribe('DELETE', function() {

        it('/:protectionId/attributes should remove the attribute from the protection', function(done) {
            app.delete('/protection/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:protectionId should update the protection deleted field', function(done) {
            app.delete('/protection/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});