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

describe('/augmentations', function() {

    var temporaryId,
        attributeId,
        expertiseId,
        skillId;

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
        app.get('/expertises')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                expertiseId = res.body.results[0].id;

                done();
            });
    });

    before(function(done) {
        app.get('/skills')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                skillId = res.body.results[0].id;

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

        assert.isBoolean(item.legal);
        assert.isNumber(item.price);
        assert.isNumber(item.hacking);
    }


    describe('POST', function() {

        it('/ should create a new augmentation', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                legal: true,
                price: 10,
                hacking: 10
            };

            app.post('/augmentations', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:augmentationId/clone should create a copy of the augmentation', function(done) {
            app.post('/augmentations/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:augmentationId/comments should create a new comment for the augmentation', function(done) {
            app.post('/augmentations/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:augmentationId/attributes should add an attribute to the augmentation', function(done) {
            var payload = {
                insert_id: attributeId,
                value: 10
            };

            app.post('/augmentations/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:augmentationId/expertises should add an expertise to the augmentation', function(done) {
            var payload = {
                insert_id: expertiseId,
                value: 10
            };

            app.post('/augmentations/' + temporaryId + '/expertises', payload)
                .expect(201)
                .end(done);
        });

        it('/:augmentationId/skills should add an skill to the augmentation', function(done) {
            var payload = {
                insert_id: skillId,
                value: 10
            };

            app.post('/augmentations/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:augmentationId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/augmentations/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/canon should update the augmentation canon field', function(done) {
            app.put('/augmentations/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/attributes should change the attribute value for the augmentation', function(done) {
            var payload = {value: 8};

            app.put('/augmentations/' + temporaryId + '/attributes/' + attributeId, payload)
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/expertises should change the expertise value for the augmentation', function(done) {
            var payload = {value: 8};

            app.put('/augmentations/' + temporaryId + '/expertises/' + expertiseId, payload)
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/skills should change the skill value for the augmentation', function(done) {
            var payload = {value: 8};

            app.put('/augmentations/' + temporaryId + '/skills/' + skillId, payload)
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of augmentations', function(done) {
            app.get('/augmentations')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:augmentationId should return one augmentation', function(done) {
            app.get('/augmentations/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:augmentationId/ownership should return ownership status of the augmentation if user is logged in', function(done) {
            app.get('/augmentations/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:augmentationId/comments should get all available comments for the augmentation', function(done) {
            app.get('/augmentations/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:augmentationId/attributes should return a list of attributes', function(done) {
            app.get('/augmentations/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        verifier.generic(item)
                    });

                    done();
                });
        });

        it('/:augmentationId/expertises should return a list of expertises', function(done) {
            app.get('/augmentations/' + temporaryId + '/expertises')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        verifier.generic(item)
                    });

                    done();
                });
        });

        it('/:augmentationId/skills should return a list of skills', function(done) {
            app.get('/augmentations/' + temporaryId + '/skills')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        verifier.generic(item)
                    });

                    done();
                });
        });

    });

    xdescribe('DELETE', function() {

        it('/:augmentationId/attributes should remove the attribute from the augmentation', function(done) {
            app.delete('/augmentations/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:augmentationId/skills should remove the skill from the augmentation', function(done) {
            app.delete('/augmentations/' + temporaryId + '/skills/1')
                .expect(204)
                .end(done);
        });

        it('/:augmentationId should update the augmentation deleted field', function(done) {
            app.delete('/augmentations/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});