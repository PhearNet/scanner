var Q = require("q");
var async = require("async");
var App = require("../Core");

/**
 *
 * @type {{}}
 */
var Targets = {};
Targets.Log = App.Logger("Targets");
/**
 *
 * @type {Array}
 */
Targets.store = [];

/**
 * Connection wrapper to App.Store Helper
 */
Targets.conn = App.Store.conn.targets;

Targets.getByBlockId = function (blockId) {
    var deferred = Q.defer();

    if (blockId) {

        Targets.Log.info({fn: "getByBlockId"}, "Getting Targets for Block %s from the Targets Store", blockId);
        App.Store.getIndex(Targets.conn, "all", {
            startkey: ["new", blockId],
            endkey: ["new", blockId]
        }).then(function (blocks) {
            Targets.Log.info({fn: "getByBlockId"}, "Targets store was request successful for block %s", blockId);
            deferred.resolve(blocks);
        }).catch(function(err){
           deferred.reject(err);
        }).done();

    } else {
        App.ERROR("Missing blockId from Targets.getBlockId", deferred);
    }

    return deferred.promise;
}

/**
 * Get all Targets from Store
 * @param cache
 * @returns {*|promise}
 */
Targets.getAll = function (cache) {
    var deferred = Q.defer();
    Targets.Log.info({fn: "getAll"}, "Getting all Targets from store");
    // Set defaults
    if (cache === null || cache === undefined) cache = true;

    // Resolve from cache
    if (Targets.store.length > 0 && cache) {
        Targets.Log.debug({fn: "getAll"}, "Targets store is already in cache, resolving");
        deferred.resolve(Targets.store);
    }

    // Get records from App.Store index and resolve
    else {
        Targets.Log.debug({fn: "getAll"}, "Targets store is not in cache, fetching from Store");
        App.Store.getIndex(Targets.conn, "all").then(function (blocks) {
            Targets.Log.debug({fn: "getAll"}, "Targets store request successful, resolving ");
            Targets.store = blocks;
            deferred.resolve(blocks);
        }).done();
    }
    return deferred.promise;
};

Targets.process = function(){
    App.Store.queue.process('ScanTargets', function(job, done){
        email(job.data, done);
    });

    function email(address, done) {
        if(!address) {
            //done('invalid to address') is possible but discouraged
            return done(new Error('invalid to address'));
        }
        // email send stuff...
        done();
    }
}

Targets.getJobs = function () {

};

/**
 *
 */
Targets.check = function () {

    Targets.getAll().then(function (targets) {

        async.eachSeries(targets, function (target, done) {
            console.log(target);
            //var job = queue.create('ProcessTargets', {
            //    title: 'Calculate Block size for batch processing',
            //    chunk: '.1'
            //}).save(function(err){
            //    if( !err ) console.log( job.id );
            //});
        });

    })
        .catch(function (error) {
            console.log("Two", error);
        })
        .done();
};


function saveLargeTargetArray(data) {
    var deferred = Q.defer();

    var i, j, funk = [], chunk = data.length * .1;
    var tmp = [];
    for (i = 0, j = data.length; i < j; i += chunk) {
        tmp.push(data.slice(i, i + chunk));
        //funk.push(function (callback) {
        //    Targets.conn.save(data.slice(i, i + chunk), callback)
        //})
    }
    async.series([function (callback) {
            Targets.conn.save(tmp[0], callback)
        }, function (callback) {
            Targets.conn.save(tmp[1], callback)
        }, function (callback) {
            Targets.conn.save(tmp[2], callback)
        }, function (callback) {
            Targets.conn.save(tmp[3], callback)
        }, function (callback) {
            Targets.conn.save(tmp[4], callback)
        }, function (callback) {
            Targets.conn.save(tmp[5], callback)
        }, function (callback) {
            Targets.conn.save(tmp[6], callback)
        }, function (callback) {
            Targets.conn.save(tmp[7], callback)
        }, function (callback) {
            Targets.conn.save(tmp[8], callback)
        }, function (callback) {
            Targets.conn.save(tmp[9], callback)
        }],
        deferred.resolve);
    //async.series(funk, deferred.resolve);

    return deferred.promise;
}


module.exports = Targets;