let async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

let should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

let app = require('./../app'),
    verifier = require('./../verifier'),
    hasher = require('./../../lib/hasher');

describe('/creatures', function() {

    let baseRoute = '/creatures';

    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    let speciesId;
    before(function(done) {
        app.get('/species')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                speciesId = res.body.results[0].id;

                done();
            });
    });

    let worldId;
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
    }


    describe('POST', function() {

        it('/ should create a new item', function(done) {
            let payload = {
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
            let payload = {
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
            app.put(baseRoute + '/' + temporaryId + '/canon/1').expect(204).end(done);
        });

        it('/:id/permissions/favorite/1 should set it as favorite', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/permissions/favorite/1').expect(204).end(done);
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

        it('/:id/permissions should return user permissions', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/permissions').expect(200).end(function(err, res) { verifier.ownership(err, res, done); });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments').expect(200).end(function(err, res) { verifier.comments(err, res, done); });
        });

    });


    describe('/assets', function() {
        let relationRoute = 'assets',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 1}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4, custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

        it('EQUIP /:id/equip/1 should equip the item to the creature', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/equip/1').expect(204).end(done);
        });

        it('UNEQUIP /:id/equip/0 should equip the item to the creature', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/equip/0').expect(204).end(done);
        });

    });

    describe('/attributes', function() {
        let relationRoute = 'attributes',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 1}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/backgrounds', function() {
        let relationRoute = 'backgrounds',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/bionics', function() {
        let relationRoute = 'bionics',
            bionicId,
            augmentationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    bionicId = res.body.results[length].id;

                    done();
                });
        });

        before(function(done) {
            app.get('/bionics/' + bionicId + '/augmentations')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    augmentationId = res.body.results[length].augmentation_id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: bionicId}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId, {value: 4, custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

        it('POST /:id/augmentations should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId + '/augmentations', {bionic_id: bionicId, insert_id: augmentationId}).expect(204).end(done);
        });

        it('GET /:id/augmentations should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId + '/augmentations').expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('EQUIP /:id/bionic/:bionic/equip/1 should equip the item to the creature', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId + '/augmentations/' + augmentationId + '/equip/1').expect(204).end(done);
        });

        it('UNEQUIP /:id/bionic/:bionic/equip/0 should equip the item to the creature', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId + '/augmentations/' + augmentationId + '/equip/0').expect(204).end(done);
        });

    });

    describe('/doctrines', function() {
        let relationRoute = 'doctrines',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 1}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/expertises', function() {
        let relationRoute = 'expertises',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 1}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4, custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/forms', function() {
        let relationRoute = 'forms',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/gifts', function() {
        let relationRoute = 'gifts',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/imperfections', function() {
        let relationRoute = 'imperfections',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/languages', function() {
        let relationRoute = 'languages',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {fluent: true}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/loyalties', function() {
        let relationRoute = 'loyalties',
            relationId,
            wealthId,
            uqId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        before(function(done) {
            app.get('/wealth')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    wealthId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, wealth_id: wealthId, name: hasher(20), occupation: hasher(20)}).expect(201).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.id);
                uqId = res.body.id;

                done();
            });
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uqId, {wealth_id: wealthId, name: hasher(20), occupation: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(item) {
                    assert.isNumber(item.id);
                    assert.isNumber(item.loyalty_id);
                    assert.isNumber(item.wealth_id);
                    if(item.name) assert.isString(item.name);
                    assert.isString(item.occupation);
                });

                done();
            });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uqId).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.result.id);
                assert.isNumber(res.body.result.loyalty_id);
                assert.isNumber(res.body.result.wealth_id);
                if(res.body.result.name) assert.isString(res.body.result.name);
                assert.isString(res.body.result.occupation);

                done();
            });
        });

    });

    describe('/manifestations', function() {
        let relationRoute = 'manifestations',
            relationId,
            focusId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        before(function(done) {
            app.get('/focuses')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    focusId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {focus_id: focusId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/milestones', function() {
        let relationRoute = 'milestones',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/protections', function() {
        let relationRoute = 'protection',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 1}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4, custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

        it('EQUIP /:id/equip/1 should equip the item to the creature', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/equip/1').expect(204).end(done);
        });

        it('UNEQUIP /:id/equip/0 should equip the item to the creature', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/equip/0').expect(204).end(done);
        });

    });

    describe('/skills', function() {
        let relationRoute = 'skills',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 1}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/species', function() {
        let relationRoute = 'species',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/spells', function() {
        let relationRoute = 'spells',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/software', function() {
        let relationRoute = 'software',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(201).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

    });

    describe('/weapons', function() {
        let relationRoute = 'weapons',
            relationId,
            modId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        before(function(done) {
            app.get('/weaponmods')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    let length = res.body.length - 1;
                    modId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 1}).expect(201).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4, custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

        it('EQUIP /:id/equip/1 should equip the item to the creature', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/equip/1').expect(204).end(done);
        });

        it('UNEQUIP /:id/equip/0 should equip the item to the creature', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/equip/0').expect(204).end(done);
        });

        it('POST /:id/mods should add a mod to the weapon', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/mods', {insert_id: modId}).expect(201).end(done);
        });

        it('GET /:id/mods should display a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/mods').expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

    });


    describe('/dementations', function() {
        let relationRoute = 'dementations',
            relationId;

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {name: hasher(20), value: 1}).expect(201).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.id);

                relationId = res.body.id;

                done();
            });
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(result) {
                    assert.isNumber(result.id);
                    assert.isNumber(result.value);
                    assert.isString(result.name);
                });

                done();
            });
        });

        it('PUT /:id should change the name of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {name: hasher(20)}).expect(204).end(done);
        });

        it('PUT /:id/value should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/value', {value: 4}).expect(204).end(done);
        });

        it('PUT /:id/healed/1 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/healed/1').expect(204).end(done);
        });

        it('PUT /:id/healed/0 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/healed/1').expect(204).end(done);
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isObject(res.body.result);
                assert.isNumber(res.body.result.id);
                assert.isNumber(res.body.result.value);
                assert.isString(res.body.result.name);

                done();
            });
        });

    });

    describe('/diseases', function() {
        let relationRoute = 'diseases',
            relationId;

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {name: hasher(20), value: 1}).expect(201).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.id);

                relationId = res.body.id;

                done();
            });
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(result) {
                    assert.isNumber(result.id);
                    assert.isNumber(result.value);
                    assert.isString(result.name);
                });

                done();
            });
        });

        it('PUT /:id should change the name of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {name: hasher(20)}).expect(204).end(done);
        });

        it('PUT /:id/value should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/value', {value: 4}).expect(204).end(done);
        });

        it('PUT /:id/healed/1 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/healed/1').expect(204).end(done);
        });

        it('PUT /:id/healed/0 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/healed/1').expect(204).end(done);
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isObject(res.body.result);
                assert.isNumber(res.body.result.id);
                assert.isNumber(res.body.result.value);
                assert.isString(res.body.result.name);

                done();
            });
        });

    });

    describe('/traumas', function() {
        let relationRoute = 'traumas',
            relationId;

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {name: hasher(20), value: 1}).expect(201).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.id);

                relationId = res.body.id;

                done();
            });
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(result) {
                    assert.isNumber(result.id);
                    assert.isNumber(result.value);
                    assert.isString(result.name);
                });

                done();
            });
        });

        it('PUT /:id should change the name of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {name: hasher(20)}).expect(204).end(done);
        });

        it('PUT /:id/value should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/value', {value: 4}).expect(204).end(done);
        });

        it('PUT /:id/healed/1 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/healed/1').expect(204).end(done);
        });

        it('PUT /:id/healed/0 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/healed/1').expect(204).end(done);
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) {
                if(err) return done(err);

                assert.isObject(res.body.result);
                assert.isNumber(res.body.result.id);
                assert.isNumber(res.body.result.value);
                assert.isString(res.body.result.name);

                done();
            });
        });

    });


    describe('CLONE', function() {

        it('/:id/clone should create a copy', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

});