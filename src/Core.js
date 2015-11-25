/**
 * Core Abstract for loading in rest of application
 * TODO: Convert to constructor
 * @type {Logger|exports|module.exports}
 */

//Setup logger and pipe to stdout
var bunyan = require('bunyan'),
    PrettyStream = require('bunyan-prettystream'),
    prettyStdOut = new PrettyStream();

prettyStdOut.pipe(process.stdout);

//Define variables
var Core = {};
Core.stores = {};

/**
 * Create a new store
 * FIXME: Not in use and not working
 * @param name
 * @returns {{}}
 */
Core.createStore = function (name) {
    if (!Core.stores[name]) return Core;
}

/**
 * Application Utilities
 */
Core.util = {};
/**
 * Chunk takes an array then splits it by
 * the size and returns and array of chunks
 * @param data
 * @param size
 * @returns {Array}
 */
Core.util.chunk = function (data, size) {
    var i, j,tmp = [], chunk = size;
    for (i = 0, j = data.length; i < j; i += chunk) {
        tmp.push(data.slice(i, i + chunk));
    }
    return tmp;
};

/**
 * Async module wrapper
 * @type {async|exports|module.exports}
 */
Core.util.async = require('async');

/**
 * Moment module wrapper
 * Date utilities for parsing and computing dates
 * @type {*|exports|module.exports}
 */
Core.util.Date = require("moment");

/**
 * IP module
 * Internet Protocol utilities
 * @type {exports|module.exports}
 */
Core.util.ip = require('ip');
/**
 * subnet calculator module
 * Calculates Subnet
 * @type {IpSubnetCalculator.calculate|Function}
 */
Core.util.ip.calc = require('ip-subnet-calculator').calculate;

/**
 * Updates the last octet of an String based IP address
 * @param ipAddr
 * @param change
 * @returns {string}
 */
Core.util.ip.updateOctetFour = function (ipAddr, change) {
    return ipAddr.split('.')
        .map(function (num, inx) {
            if (inx === 3) {
                if (parseInt(num) + parseInt(change) >= 0)
                    return parseInt(num) + parseInt(change);
                else
                    return 1;
            } else {
                return parseInt(num);
            }
        }).join('.')
}

/**
 * Global Logger defaults
 */
Core.util.bunyan = bunyan.createLogger({
    name: require("../package.json").name, level: "info",
    stream: prettyStdOut
});

/**
 * Get process info
 * @returns {{process: {nodeVersion: *, pid: (*|number)}, startTime: *, platform: (*|string), arch: *, memory: *, uptime: *}}
 */
Core.getProcessInfo = function () {
    return {
        process: {
            nodeVersion: process.versions.node,
            pid: process.pid
        },
        startTime: process.hrtime(),
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime()
    }
};

/**
 * Core Logger
 */
Core.Log = Core.util.bunyan.child({class: "Core"});
Core.Log.debug({fn: "Logger"}, 'Core Logger online');

/**
 * Create local logs
 * @param name
 * @constructor
 */
Core.Logger = function (name) {
    Core.Log.debug({fn: "Logger"}, '%s Logger online', name);
    return Core.util.bunyan.child({class: name});
};

/**
 * Error
 * @param msg
 * @param deferred
 * @returns {Error}
 * @constructor
 */
Core.ERROR = function (msg, deferred) {
    if (!msg) throw new Error('Error, Need to have a message');

    var err = new Error(msg);

    Core.Log.error({class: "ERROR"}, Core.getProcessInfo(), err);

    if (deferred)
        deferred.reject(err);

    return err;
};


// Ready to go!
Core.Log.info({fn: "load"}, 'Welcome to PhearNet/scanner!');
Core.Log.debug({fn: "load", process: Core.getProcessInfo()}, "Process Info:");

module.exports = Core;