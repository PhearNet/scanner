var Q = require("q");

/**
 *
 * @type {App|exports|module.exports}
 */
var App = require('../Core.js');
/**
 *
 * @type {{}}
 */
var Blocks = {};
Blocks.Log = App.Logger("Blocks");
/**
 *
 * @type {Array}
 */
Blocks.store = [];

/**
 * Connection wrapper to App.Store Helper
 */
Blocks.conn = App.Store.conn.blocks;

/**
 * Get all Blocks from Store
 * @param cache
 * @returns {*|promise}
 */
Blocks.getAll = function (cache) {
    var deferred = Q.defer();
    Blocks.Log.info({fn: "getAll"}, "Getting all Blocks from store");
    // Set defaults
    if (cache === null || cache === undefined) cache = true;

    // Resolve from cache
    if (Blocks.store.length > 0 && cache){
        Blocks.Log.debug({fn: "getAll"}, "Blocks store is already in cache, resolving");
        deferred.resolve(Blocks.store);
    }

    // Get records from App.Store index and resolve
    else{
        Blocks.Log.debug({fn: "getAll"}, "Blocks store is not in cache, fetching from Store");
        App.Store.getIndex(Blocks.conn, "subnetByNation").then(function (blocks) {
            Blocks.Log.debug({fn: "getAll"},"Blocks store request successful, resolving ");
            Blocks.store = blocks;
            deferred.resolve(blocks);
        }).done();
    }
    return deferred.promise;
};

module.exports = Blocks;