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

describe('/creatures', function() {

    var baseRoute = '/creatures';

    var temporaryId;

    before(function(done) {
        app.login(done);
    });

    var speciesId;
    before(function(done) {
        app.get('/species')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                speciesId = res.body.results[0].id;

                done();
            });
    });

    var worldId;
    before(function(done) {
        app.get('/worlds')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                worldId = res.body.results[0].id;

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

        assert.isNumber(item.assettype_id);
        assert.isBoolean(item.equipable);
        assert.isBoolean(item.legal);
        assert.isNumber(item.price);
    }


    describe('POST', function() {

        it('/ should create a new item', function(done) {
            var payload = {
                firstname: hasher(20),
                nickname: hasher(20),
                middlename: hasher(20),
                lastname: hasher(20),
                world_id: worldId,
                species_id: speciesId,
                description: hasher(40)
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

    });

    describe('PUT', function() {

        it('/:id should update the item with new values', function(done) {
            var payload = {
                firstname: hasher(20),
                nickname: hasher(20),
                middlename: hasher(20),
                lastname: hasher(20),
                calculated: true,
                manifestation: true,
                appearance: hasher(20),
                age: 50,
                biography: hasher(20),
                description: hasher(20),
                drive: hasher(20),
                gender: hasher(20),
                occupation: hasher(20),
                personality: hasher(20),
                pride: hasher(20),
                problem: hasher(20),
                shame: hasher(20),
                point_doctrine: 1,
                point_expertise: 2,
                point_gift: 3,
                point_imperfection: 4,
                point_milestone: 5,
                point_skill: 6,
                wealth_id: 1
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

    });

    xdescribe('GET', function() {

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

        it('/type/:typeId should return a list', function(done) {
            app.get('/assets/type/' + speciesId)
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
            app.get(baseRoute + '/' + temporaryId + '/ownership').expect(200).end(function(err, res) { verifier.ownership(err, res, done); });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments').expect(200).end(function(err, res) { verifier.comments(err, res, done); });
        });

    });

});