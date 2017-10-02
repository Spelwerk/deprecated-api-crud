var validator = require('validator'),
    _ = require('underscore'),
    assert = require('chai').assert;

module.exports.generic = function(item) {
    assert.isNumber(item.id);
    assert.isNumber(item.user_id);
    assert.isBoolean(item.canon);

    assert.isString(item.name);
    if(item.description) assert.isString(item.description);
    if(item.icon) assert.equal(validator.isURL(item.icon), true);

    assert.isString(item.created);
    if(item.updated) assert.isString(item.updated);
    assert.isNull(item.deleted);
};

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