'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/relations/generic');
const basic = require('../../lib/generic/basics');
const forms = require('../../lib/tables/forms');

module.exports = (router) => {
    const tableName = 'form';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'form.id, ' +
        'form.canon, ' +
        'form.name, ' +
        'form.description, ' +
        'form.icon, ' +
        'form.appearance, ' +
        'form.created, ' +
        'form.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name As manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name, ' +
        'expertise.id AS expertise_id, ' +
        'expertise.name AS expertise_name, ' +
        'form_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM form ' +
        'LEFT JOIN form_is_copy ON form_is_copy.form_id = form.id ' +
        'LEFT JOIN manifestation ON manifestation.id = form.manifestation_id ' +
        'LEFT JOIN species ON species.id = form.species_id ' +
        'LEFT JOIN expertise ON expertise.id = form.expertise_id ' +
        'LEFT JOIN user ON user.id = form.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await forms.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations
    relations.route(router, tableName, 'attribute');
    relations.route(router, tableName, 'skill');
};
