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

describe('/bionics', function() {

    var temporaryId,
        bodyPartId,
        attributeId,
        augmentationId,
        softwareId;

    before(function(done) {
        app.login(done);
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
        app.get('/augmentations')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                augmentationId = res.body.results[0].id;

                done();
            });
    });

    before(function(done) {
        app.get('/software')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                softwareId = res.body.results[0].id;

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
        assert.isBoolean(item.legal);
        assert.isNumber(item.price);
        assert.isNumber(item.hacking);
    }


    describe('POST', function() {

        it('/ should create a new bionic', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                bodypart_id: bodyPartId,
                legal: true,
                price: 10,
                hacking: 10
            };

            app.post('/bionics', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:bionicId/clone should create a copy of the bionic', function(done) {
            app.post('/bionics/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:bionicId/comments should create a new comment for the bionic', function(done) {
            app.post('/bionics/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:bionicId/attributes should add an attribute to the bionic', function(done) {
            var payload = {
                insert_id: attributeId,
                value: 10
            };

            app.post('/bionics/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:bionicId/augmentations should add an augmentation to the bionic', function(done) {
            var payload = {
                insert_id: augmentationId
            };

            app.post('/bionics/' + temporaryId + '/augmentations', payload)
                .expect(201)
                .end(done);
        });

        it('/:bionicId/software should add an software to the bionic', function(done) {
            var payload = {
                insert_id: softwareId
            };

            app.post('/bionics/' + temporaryId + '/software', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:bionicId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/bionics/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:bionicId/canon should update the bionic canon field', function(done) {
            app.put('/bionics/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:bionicId/attributes should change the attribute value for the bionic', function(done) {
            app.put('/bionics/' + temporaryId + '/attributes/' + attributeId, { value: 8 })
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of bionics', function(done) {
            app.get('/bionics')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/bodypart/:bodyPartId should return a list of bionics', function(done) {
            app.get('/bionics/bodypart/' + bodyPartId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:bionicId should return one bionic', function(done) {
            app.get('/bionics/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:bionicId/ownership should return ownership status', function(done) {
            app.get('/bionics/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:bionicId/comments should get all available comments', function(done) {
            app.get('/bionics/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:bionicId/attributes should return a list', function(done) {
            app.get('/bionics/' + temporaryId + '/attributes')
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

        it('/:bionicId/augmentations should return a list of augmentations', function(done) {
            app.get('/bionics/' + temporaryId + '/augmentations')
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

        it('/:bionicId/software should return a list of software', function(done) {
            app.get('/bionics/' + temporaryId + '/software')
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

        it('/:bionicId/attributes should remove the attribute from the bionic', function(done) {
            app.delete('/bionics/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:bionicId/augmentations should remove the augmentation from the bionic', function(done) {
            app.delete('/bionics/' + temporaryId + '/augmentations/1')
                .expect(204)
                .end(done);
        });

        it('/:bionicId should update the bionic deleted field', function(done) {
            app.delete('/bionics/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});