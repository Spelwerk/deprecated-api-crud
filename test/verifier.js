var validator = require('validator'),
    _ = require('underscore'),
    assert = require('chai').assert;

function generic(item) {
    assert.isNumber(item.id);
    if(item.user_id) assert.isNumber(item.user_id);
    if(item.canon) assert.isBoolean(item.canon);

    if(item.name) assert.isString(item.name);
    if(item.description) assert.isString(item.description);
    if(item.icon) assert.equal(validator.isURL(item.icon), true);

    if(item.created) assert.isString(item.created);
    if(item.updated) assert.isString(item.updated);
    if(item.deleted) assert.isNull(item.deleted);
}

module.exports.generic = generic;

module.exports.comments = function(err, res, done) {
    if(err) return done(err);

    assert.isArray(res.body.results);

    _.each(res.body.results, function(item) {
        assert.isNumber(item.id);
        assert.isString(item.comment);

        assert.isNumber(item.user_id);
        assert.isString(item.displayname);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        assert.isNull(item.deleted);
    });

    done();
};

module.exports.ownership = function(err, res, done) {
    if(err) return done(err);

    assert.isBoolean(res.body.favorite);
    assert.isBoolean(res.body.owner);
    assert.isBoolean(res.body.edit);

    done();
};

module.exports.relations = function(err, res, done) {
    if(err) return done(err);

    assert.isNumber(res.body.length);
    assert.isArray(res.body.results);

    assert.isAtLeast(res.body.length, 1);
    assert.equal(res.body.length, res.body.results.length);

    _.each(res.body.results, function(item) {
        generic(item);
    });

    done();
};

module.exports.relation = function(err, res, done) {
    if(err) return done(err);

    generic(res.body.result);

    done();
};
