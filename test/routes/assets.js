var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    verifier = require('./../verifier'),
    hasher = require('./../../lib/hasher');

describe('/assets', function() {

    var temporaryId,
        groupId,
        typeId,
        attributeId,
        doctrineId,
        expertiseId,
        skillId;

    before(function(done) {
        app.login(done);
    });

    before(function(done) {
        app.get('/assetgroups')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                groupId = res.body.results[0].id;

                done();
            });
    });

    before(function(done) {
        app.get('/assettypes')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                typeId = res.body.results[0].id;

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
        app.get('/doctrines')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                doctrineId = res.body.results[0].id;

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

        assert.isNumber(item.price);
        assert.isBoolean(item.legal);
        assert.isNumber(item.assettype_id);
        assert.isNumber(item.assetgroup_id);
        assert.isBoolean(item.equipable);
    }


    describe('POST', function() {

        it('/ should create a new asset', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                assettype_id: typeId,
                legal: true,
                price: 10
            };

            app.post('/assets', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:assetId/clone should create a copy of the asset', function(done) {
            app.post('/assets/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:assetId/comments should create a new comment for the asset', function(done) {
            app.post('/assets/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:assetId/attributes should add an attribute to the asset', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/assets/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:assetId/doctrines should add an doctrine to the asset', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/assets/' + temporaryId + '/doctrines', payload)
                .expect(201)
                .end(done);
        });

        it('/:assetId/expertises should add an expertise to the asset', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/assets/' + temporaryId + '/expertises', payload)
                .expect(201)
                .end(done);
        });

        it('/:assetId/skills should add an skill to the asset', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/assets/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:assetId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/assets/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:assetId/canon should update the asset canon field', function(done) {
            app.put('/assets/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:assetId/attributes should change the attribute value for the asset', function(done) {
            app.put('/assets/' + temporaryId + '/attributes/' + attributeId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:assetId/doctrines should change the doctrine value for the asset', function(done) {
            app.put('/assets/' + temporaryId + '/doctrines/' + doctrineId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:assetId/expertises should change the expertise value for the asset', function(done) {
            app.put('/assets/' + temporaryId + '/expertises/' + expertiseId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:assetId/skills should change the skill value for the asset', function(done) {
            app.put('/assets/' + temporaryId + '/skills/' + skillId, {value: 8})
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of assets', function(done) {
            app.get('/assets')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/group/:groupId should return a list of assets', function(done) {
            app.get('/assets/group/' + groupId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/type/:typeId should return a list of assets', function(done) {
            app.get('/assets/type/' + typeId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:assetId should return one asset', function(done) {
            app.get('/assets/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:assetId/ownership should return ownership status of the asset if user is logged in', function(done) {
            app.get('/assets/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:assetId/comments should get all available comments for the asset', function(done) {
            app.get('/assets/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:assetId/attributes should return a list of attributes', function(done) {
            app.get('/assets/' + temporaryId + '/attributes')
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

        it('/:assetId/doctrines should return a list of doctrines', function(done) {
            app.get('/assets/' + temporaryId + '/doctrines')
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

        it('/:assetId/expertises should return a list of expertises', function(done) {
            app.get('/assets/' + temporaryId + '/expertises')
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

        it('/:assetId/skills should return a list of skills', function(done) {
            app.get('/assets/' + temporaryId + '/skills')
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

        it('/:assetId/attributes should remove the attribute from the asset', function(done) {
            app.delete('/assets/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:assetId/doctrines should remove the doctrine from the asset', function(done) {
            app.delete('/assets/' + temporaryId + '/doctrines/1')
                .expect(204)
                .end(done);
        });

        it('/:assetId/expertises should remove the expertise from the asset', function(done) {
            app.delete('/assets/' + temporaryId + '/expertises/1')
                .expect(204)
                .end(done);
        });

        it('/:assetId/skills should remove the skill from the asset', function(done) {
            app.delete('/assets/' + temporaryId + '/skills/1')
                .expect(204)
                .end(done);
        });

        it('/:assetId should update the asset deleted field', function(done) {
            app.delete('/assets/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});