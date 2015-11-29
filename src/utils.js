//Setup logger and pipe to stdout
var bunyan = require('bunyan'),
    PrettyStream = require('bunyan-prettystream'),
    prettyStdOut = new PrettyStream();

prettyStdOut.pipe(process.stdout);

/**
 * Utils
 * @param opts
 * @returns {{chunk: chunk, async: (async|exports|module.exports), Date: (*|exports|module.exports), ip: {tools: (exports|module.exports), calc: IpSubnetCalculator.calculate, updateOctetFour: ip.updateOctetFour}, Logger, getProcessInfo: getProcessInfo}}
 * @constructor
 */
function Utils(opts) {
    return {
        /**
         * Chunk takes an array then splits it by
         * the size and returns and array of chunks
         * @param data
         * @param size
         * @returns {Array}
         */
        chunk: function (data, size) {
            var i, j, tmp = [], chunk = size;
            for (i = 0, j = data.length; i < j; i += chunk) {
                tmp.push(data.slice(i, i + chunk));
            }
            return tmp;
        },
        /**
         * Async module wrapper
         * @type {async|exports|module.exports}
         */
        async: require('async'),
        Q: require("q"),
        /**
         * Moment module wrapper
         * Date utilities for parsing and computing dates
         * @type {*|exports|module.exports}
         */
        Date: require("moment"),

        /**
         * IP toolkits
         */
        ip: {
            /**
             * IP module
             * Internet Protocol utilities
             * @type {exports|module.exports}
             */
            tools: require('ip'),
            /**
             * subnet calculator module
             * Calculates Subnet
             * @type {IpSubnetCalculator.calculate|Function}
             */
            calc: require('ip-subnet-calculator').calculate,
            /**
             * Updates the last octet of an String based IP address
             * @param ipAddr
             * @param change
             * @returns {string}
             */
            updateOctetFour: function (ipAddr, change) {
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
        },

        /**
         * Global Logger defaults
         */
        Logger: bunyan.createLogger({
            name: require("../package.json").name, level: "info",
            stream: prettyStdOut
        }),

        /**
         * Get process info
         * @returns {{process: {nodeVersion: *, pid: (*|number)}, startTime: *, platform: (*|string), arch: *, memory: *, uptime: *}}
         */
        getProcessInfo: function () {
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
        }
    }
}

module.exports = Utils;