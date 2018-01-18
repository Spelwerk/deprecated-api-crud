'use strict';

const AppError = require('../errors/app-error');
const DatabaseRowNotFoundError = require('../errors/database-row-not-found-error');
const UserNotLoggedInError = require('../errors/user-not-logged-in-error');
const UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error');

const yaml = require('node-yaml').readSync;

const getSchema = require('../../app/initializers/database').getSchema;
const sql = require('../database/sql');
const elemental = require('../database/elemental');
const combinations = require('../database/combinations');
const permissions = require('../database/permissions');

let config = {};
config.defaults = yaml('../../config/defaults.yml');
config.points = yaml('../../config/points.yml');

const schema = getSchema('creature');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

function FLOOR(number, floor) {
    number = parseInt(number) || floor;

    number = number < floor
        ? floor
        : number;

    return number;
}

function ROOF(number, roof) {
    number = parseInt(number) || roof;

    number = number > roof
        ? roof
        : number;

    return number;
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body) {
    if(!req.user.id) return new UserNotLoggedInError;

    let id;

    let wealthId = parseInt(body.wealth_id);
    let epoch = { id: parseInt(body.epoch_id) };
    let species = { id: parseInt(body.species_id) };
    let world = {};

    let creatureAttributes = [];
    let creatureSkills = [];
    let speciesAttributes = [];
    let worldAttributes = [];

    let age = FLOOR(body.age, 1);
    let multiplier;

    try {
        // Getting required data from Epoch
        let [rows] = await sql('SELECT * FROM epoch WHERE id = ?', [epoch.id]);
        if (rows.length === 0) return new DatabaseRowNotFoundError;
        epoch = rows[0];
        world.id = epoch.world_id;

        // Getting required data from World
        let [rows] = await sql('SELECT * FROM world WHERE id = ?', [world.id]);
        if (rows.length === 0) return new DatabaseRowNotFoundError;
        world = rows[0];

        // Getting required data from Species
        let [rows] = await sql('SELECT * FROM species WHERE id = ?', [species.id]);
        if (rows.length === 0) return new DatabaseRowNotFoundError;
        species = rows[0];
        multiplier = FLOOR(species.multiply_points, 1);

        // Setting up points for further character creation
        body.points_background = config.points.baseline.background;
        body.points_expertise = config.points.baseline.expertise;
        body.points_form = config.points.baseline.form;
        body.points_gift = config.points.baseline.gift;
        body.points_imperfection = config.points.baseline.imperfection;
        body.points_language = config.points.baseline.language;
        body.points_milestone = config.points.baseline.milestone;
        body.points_primal = config.points.baseline.primal;
        body.points_skill = config.points.baseline.skill;
        body.points_spell = config.points.baseline.spell;

        // Multiply age with species multiplier and divide
        body.points_expertise += (age * multiplier) / config.points.divide.expertise;
        body.points_milestone += (age * multiplier) / config.points.divide.milestone;
        body.points_primal += (age * multiplier) / config.points.divide.primal;
        body.points_skill += (age * multiplier) / config.points.divide.skill;
        body.points_spell += (age * multiplier) / config.points.divide.spell;

        // Ensuring maximum as Integer
        body.points_expertise = ROOF(body.points_expertise, config.points.maximum.expertise);
        body.points_milestone = ROOF(body.points_milestone, config.points.maximum.milestone);
        body.points_primal = ROOF(body.points_primal, config.points.maximum.primal);
        body.points_skill = ROOF(body.points_skill, config.points.maximum.skill);
        body.points_spell = ROOF(body.points_spell, config.points.maximum.spell);

        // Creature
        id = await elemental.insert(req, body, 'creature');

        // Species
        await sql('INSERT INTO creature_has_species (creature_id,species_id,first) VALUES (?,?,?)', [id, species.id, 1]);

        // Wealth
        // update wealth values with value.update

        // Attributes :: World
        let [rows] = await sql('SELECT * FROM world_has_attribute WHERE world_id = ?', [world.id]);
        if(rows.length === 0) return new DatabaseRowNotFoundError;

        for(let i in rows) {
            worldAttributes.push({ id: parseInt(rows[i].attribute_id), value: parseInt(rows[i].value) });
        }

        // Attributes :: Species
        let [rows] = await sql('SELECT * FROM species_has_attribute WHERE species_id = ?', [species.id]);

        for(let i in rows) {
            speciesAttributes.push({ id: parseInt(rows[i].attribute_id), value: parseInt(rows[i].value) });
        }

        // Attributes :: Creature
        let query = 'INSERT INTO creature_has_attribute (creature_id,attribute_id,value) VALUES ';

        creatureAttributes = worldAttributes;

        for(let i in creatureAttributes) {
            for(let n in speciesAttributes) {
                if(creatureAttributes[i].id !== speciesAttributes[n].id) continue;

                creatureAttributes[i].value += speciesAttributes[n].value;
            }

            query += '(' + id + ',' + creatureAttributes[i].id + ',' + creatureAttributes[i].value + '),';
        }

        query = query.slice(0, -1);

        await sql(query);

        // Skills
        

    } catch(e) {
        return e;
    }
}