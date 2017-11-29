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

describe('/firstnamegroups', function() {

    let baseRoute = '/firstnamegroups';

    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    let nameId;
    before(function(done) {
        app.get('/firstnames')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                nameId = res.body.results[0].id;

                done();
            })
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
        assert.isNumber(item.id);
        assert.isString(item.name);
    }


    describe('POST', function() {

        it('/ should create a new item', function(done) {
            app.post(baseRoute, { name: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:id/firstnames should add a relation to the item', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/firstnames', { insert_id: nameId })
                .expect(201)
                .end(done);
        });

    });

});