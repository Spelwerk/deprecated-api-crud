'use strict';

const sql = require('../database/sql');
const permisisons = require('../database/permissions');
const basic = require('../generic/basic');

/** @deprecated */
function loyalties(router) {
    let query = 'SELECT ' +
        'milestone_has_loyalty.id, ' +
        'milestone_has_loyalty.milestone_id, ' +
        'milestone_has_loyalty.loyalty_id, ' +
        'milestone_has_loyalty.wealth_id, ' +
        'milestone_has_loyalty.occupation, ' +
        'loyalty.name AS loyalty_name, ' +
        'wealth.name AS wealth_name ' +
        'FROM milestone_has_loyalty ' +
        'LEFT JOIN loyalty ON loyalty.id = milestone_has_loyalty.loyalty_id ' +
        'LEFT JOIN wealth ON wealth.id = milestone_has_loyalty.wealth_id';

    router.route('/:id/loyalties')
        .get(async (req, res, next) => {
            let call = query + ' WHERE milestone_has_loyalty.milestone_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        })
        .post(async (req, res, next) => {
            try {
                let milestoneId = parseInt(req.params.id);
                let loyaltyId = parseInt(req.body.insert_id);
                let wealthId = parseInt(req.body.wealth_id);
                let occupation = req.body.occupation || null;

                await permisisons.verify(req, 'milestone', milestoneId);

                let id = await sql('INSERT INTO milestone_has_loyalty (milestone_id,loyalty_id,wealth_id,occupation) VALUES (?,?,?,?)', [milestoneId, loyaltyId, wealthId, occupation]);

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    router.route('/:id/loyalties/:loyalty')
        .get(async (req, res, next) => {
            let call = query + ' WHERE ' +
                'milestone_has_loyalty.milestone_id = ? AND ' +
                'milestone_has_loyalty.id = ?';

            await basic.select(req, res, next, call, [req.params.id, req.params.loyalty]);
        })
        .put(async (req, res, next) => {
            try {
                let milestoneId = parseInt(req.params.id);
                let loyaltyId = parseInt(req.params.loyalty);
                let wealthId = parseInt(req.body.wealth_id);
                let occupation = req.body.occupation || null;

                await permisisons.verify(req, 'milestone', milestoneId);

                await sql('UPDATE milestone_has_loyalty SET wealth_id = ?, occupation = ? WHERE milestone_id = ? AND loyalty_id = ?', [wealthId, occupation, milestoneId, loyaltyId]);

                res.status(204).send();
            } catch(e) {
                next(e);
            }
        })
        .delete(async (req, res, next) => {
            try {
                let milestoneId = parseInt(req.params.id);
                let loyaltyId = parseInt(req.params.loyalty);

                await permisisons.verify(req, 'milestone', milestoneId);

                await sql('DELETE FROM milestone_has_loyalty WHERE milestone_id = ? AND loyalty_id = ?', [milestoneId, loyaltyId]);
            } catch(e) {
                next(e);
            }
        });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.loyalties = loyalties;
