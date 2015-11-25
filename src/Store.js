/**
 * Scanner Store Class
 * Abstract for working with the couch/redis databases/queues
 * @type {*|exports|module.exports}
 */
//TODO: Refactor to more abstract class and possibly create relationships for cradle?
var Q = require("q"),
    cradle = require("cradle"),
    kue = require('kue'),

    /**
     * Core Application wrapper
     * TODO: change to abstract that includes creation of loggers etc
     * @type {Core|exports|module.exports}
     */
    App = require('./Core');

/**
 *
 * @type {{db, kue, queue}|{db: exports.Connection, msgs: *}}
 */
var Store = config();

/**
 * Logger
 * TODO: move to core abstract
 */
Store.Log = App.Logger("Store");


/**
 * Create a Redis based Kue
 * @param name
 * @param data
 * @returns {*|promise}
 */
Store.createKue = function (name, data) {
    var deferred = Q.defer();

    Store.queue.create(name, {
        title: "Scan Targets for Block " + name,
        targets: data
    }).save(function (err) {
        if (err) deferred.reject(err);
        deferred.resolve();
    });

    return deferred.promise;
};


/**
 * TODO: Refator to abstract
 * @returns {*}
 */
Store.check = function (name) {
    Store.Log.info({fn: "check"}, "Checking if stores exist....");
    Store.Log.debug({fn: "check"}, "Checking for existing connection");
    if (!Store.conn) {
        Store.Log.debug({fn: "check"}, "No Connection found, creating connections");
        Store.conn = {
            blocks: Store.db.database("blocks"),
            targets: Store.db.database("targets")
        };
    }
    Store.Log.debug({fn: "check"}, "Check if databases exists");
    return Store.dbExists(Store.conn.blocks)
        .then(Store.dbExists(Store.conn.targets))

};
/**
 *
 * @returns {*}
 */
Store.install = function () {
    Store.Log.info({fn: "install"}, "Running Database Installation");
    return Store.check()
        .then(setupBlockViews);
};

/**
 *
 * @param dbStore
 * @param name
 * @returns {*|promise}
 */
Store.getIndex = function (dbStore, name, opts) {
    var deferred = Q.defer();

    if (dbStore && name) {
        var msg = "Getting index %s from %s";
        if (opts) msg = "Getting index %s from %s with startkey=[" + opts.startkey + "] endkey=[" + opts.endkey + "]";

        Store.Log.debug({fn: "getIndex"}, msg, name, dbStore.name);
        dbStore.view('index/' + name, opts, function (err, res) {
            if (err) deferred.reject(err);
            deferred.resolve(res);
        });
    }
    else {
        App.ERROR("Missing Database and name", deferred);
    }

    return deferred.promise;
};

/**
 * cradle.database.exists with Q promise
 * @param dbInstance
 * @returns {*|promise}
 */
Store.dbExists = function (dbInstance) {
    var deferred = Q.defer();

    if (dbInstance) {
        Store.Log.info({fn: "dbExists"}, "Running check on %s", dbInstance.name);
        dbInstance.exists(deferred.resolve);
    }
    else App.ERROR('Need to pass in at least one database instance', deferred);

    return deferred.promise;
};


/**
 * TODO: finsih view setups and move view creation to the store constructor params
 * @returns {*|promise}
 */
function setupBlockViews() {
    var deferred = Q.defer();

    Store.conn.blocks.get('_design/index', function (err, doc) {
        if (err) {
            if (err.reason == "missing" || err.reason == "deleted") {
                Store.conn.blocks.save('_design/index', {
                    views: {
                        //targetisUp: {
                        //    map: function (doc) {
                        //        if(doc.runstats[0].hosts[0].item.up === 1 && doc.runstats[0].finished[0].exit === "success")
                        //            emit(doc._id, doc._id);
                        //    }
                        //},
                        //targetisDown: {
                        //    map: function (doc) {
                        //        if(doc.runstats[0].hosts[0].item.down === 1 && doc.runstats[0].finished[0].exit === "success")
                        //            emit(doc._id, doc._id);
                        //    }
                        //},
                        all: {
                            map: function (doc) {
                                emit([doc._id], [doc.from, doc.to, doc.status, doc.country]);
                            }
                        },
                        subnetByNation: {
                            map: function (doc) {
                                emit([doc._id, doc.country], [doc.from + doc.details[0].invertedSize, doc.status, doc.country]);
                            }
                        }
                    }
                }, function (err, doc) {
                    if (err) throw err;
                    deferred.resolve();
                });
            }
            else deferred.reject(new Error(err));
        }
        else deferred.resolve();
    });


    return deferred.promise;
}

/**
 * TODO: Move to core
 * @returns {{db: exports.Connection, msgs: *}}
 */
function config() {

    /**
     *
     * @type {{host: string, port: string, protocol: string, auth: {username: *, password: *}, msgs: {couch: string, db: string}}}
     */
    var opts = {
        host: "phearnet.cloudant.com",
        port: "443",
        protocol: "https",
        auth: {
            username: process.env.COUCH_KEY,
            password: process.env.COUCH_PASSWORD
        },
        kue: {
            prefix: 'q',
            redis: {
                port: 6379,
                host: process.env.REDIS_HOST,
                auth: process.env.REDIS_KEY
            }
        }
    };

    /**
     *
     */
    //var msgs = cqs.defaults(opts.msgs);

    var queue = kue.createQueue(opts.kue);
    process.once('SIGTERM', function (sig) {
        queue.shutdown(5000, function (err) {
            console.log('Kue shutdown: ', err || '');
            process.exit(0);
        });
    });
    process.once('SIGINT', function (sig) {
        queue.shutdown(5000, function (err) {
            console.log('Kue shutdown: ', err || '');
            process.exit(0);
        });
    });

    /**
     *
     * @type {exports.Connection}
     */
    var db = new (cradle.Connection)(opts.host, {
        cache: false,
        raw: false,
        forceSave: true,
        auth: opts.auth
    });

    return {db: db, kue: kue, queue: queue};
}


Store.check();
module.exports = Store;