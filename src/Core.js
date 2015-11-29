/**
 * Core Abstract for loading in rest of application
 * @param opts
 * @returns {Core}
 * @constructor
 */
function Core(opts) {
    if (!Core.isSetup) {

        Core.utils = require('./Utils')(opts);

        /**
         * Core Logger
         */
        Core.Log = Core.utils.Logger.child({class: "Core"});
        Core.Log.debug({fn: "Logger"}, 'Core Logger online');

        /**
         * Create local logs
         * @param name
         * @constructor
         */
        Core.Logger = function (name) {
            Core.Log.debug({fn: "Logger"}, '%s Logger online', name);
            return Core.utils.Logger.child({class: name});
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




        /**
         * Setup stores here!
         * @type {Array}
         */
        Core.stores = [];

        Core.Store = require('./Store')(Core, opts);
        /**
         * Create a new store
         * FIXME: Not in use and not working
         * @param name
         * @returns {{}}
         */
        Core.createStore = function (name) {
            if (Core.stores.length > 0 && !Core.stores[name]) return Core;
        };





        // Ready to go!
        Core.Log.info({fn: "load"}, 'Welcome to PhearNet/scanner!');
        Core.Log.debug({fn: "load", process: Core.utils.getProcessInfo()}, "Process Info:");

        Core.isSetup = true;
    }
    return Core;
}

module.exports = Core;