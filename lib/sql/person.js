var async = require('async');

var query = require('./query'),
    ownership = require('./ownership');

//TODO: perhaps move into /app/routes/persons.js ?

module.exports.changeValues = function(call, personId, personList, relationList, currentList, callback) {
    if(!personList[0]) return callback();

    if((relationList === undefined || relationList === null || !relationList[0]) && (currentList === undefined || currentList === null || !currentList[0])) return callback();

    // Begin by looping through personList, as we want to change existing relations, not add new
    for(var p in personList) {

        // If the Relation List exists and has at least one value
        if(relationList && relationList[0]) {

            // Loop through relationList
            for(var r in relationList) {

                // If person has the relation-col we wish to update = add the value
                if(personList[p].id === relationList[r].id) {
                    personList[p].value += relationList[r].value;
                    personList[p].changed = true;
                }
            }
        }

        // If the Current List exists and has at least one value
        if(currentList && currentList[0]) {

            // Loop through currentList
            for(var c in currentList) {

                // If person has the relation-col we wish to update = remove the value
                if(personList[p].id === currentList[c].id) {
                    personList[p].value -= currentList[c].value;
                    personList[p].changed = true;
                }
            }
        }

        // If the attribute has changed = add it to the call
        if(personList[p].changed === true) {
            call += '(' + personId + ',' + personList[p].id + ',' + personList[p].value + '),';
        }
    }

    call = call.slice(0, -1);

    call += ' ON DUPLICATE KEY UPDATE value = VALUES(value)';

    query(call, null, callback);
};

module.exports.customDescription = function(req, personId, tableName, tableId, tableCustom, callback) {
    async.series([
        function(callback) {
            ownership(req, false, 'person', personId, callback);
        },
        function(callback) {
            query('UPDATE person_has_' + tableName + ' SET custom = ? WHERE person_id = ? AND ' + tableName + '_id = ?', [tableCustom, personId, tableId], callback);
        }
    ],function(err) {
        callback(err);
    });
};
