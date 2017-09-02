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

    var baseRoute = '/assets';

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

            app.post(baseRoute, payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:id/clone should create a copy', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:id/comments should create a new comment', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:id/labels should create a label', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/labels', { label: 'staticLabel' })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

        it('/:id/attributes should add an attribute', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/doctrines should add a doctrine', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/doctrines', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/expertises should add an expertise', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/expertises', payload)
                .expect(201)
                .end(done);
        });

        it('/:id/skills should add a skill', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post(baseRoute + '/' + temporaryId + '/skills', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:id should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put(baseRoute + '/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:id/canon/:canon should update the canon status', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/canon/1')
                .expect(204)
                .end(done);
        });

        it('/:id/attributes should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/attributes/' + attributeId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:id/doctrines should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/doctrines/' + doctrineId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:id/expertises should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/expertises/' + expertiseId, {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:id/skills should change the value', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/skills/' + skillId, {value: 8})
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list', function(done) {
            app.get(baseRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/deleted should return a list of deleted items', function(done) {
            app.get(baseRoute + '/deleted')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/group/:groupId should return a list', function(done) {
            app.get('/assets/group/' + groupId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/type/:typeId should return a list', function(done) {
            app.get('/assets/type/' + typeId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

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

        it('/:id/ownership should return ownership status', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

        it('/:id/attributes should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/attributes')
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

        it('/:id/doctrines should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/doctrines')
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

        it('/:id/expertises should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/expertises')
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

        it('/:id/skills should return a list', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/skills')
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

        it('/:id/attributes should remove the attribute from the asset', function(done) {
            app.delete(baseRoute + '/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:id/doctrines should remove the doctrine from the asset', function(done) {
            app.delete(baseRoute + '/' + temporaryId + '/doctrines/1')
                .expect(204)
                .end(done);
        });

        it('/:id/expertises should remove the expertise from the asset', function(done) {
            app.delete(baseRoute + '/' + temporaryId + '/expertises/1')
                .expect(204)
                .end(done);
        });

        it('/:id/skills should remove the skill from the asset', function(done) {
            app.delete(baseRoute + '/' + temporaryId + '/skills/1')
                .expect(204)
                .end(done);
        });

        it('/:id should update the asset deleted field', function(done) {
            app.delete(baseRoute + '/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});