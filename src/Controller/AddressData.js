var Q = require("q");
var App = require("../App.js");

var AddressData = {};
AddressData.Log = App.Logger("AddressData");

AddressData.stores = {
    Blocks: require('../Store/Blocks'),
    Targets: require('../Store/Targets')
};

AddressData.models = {
    Block: "",
    Target: ""
};

/**
 *
 * @param opts
 * @param nation
 * @returns {*}
 */
function createNewBlockData(opts, nation) {
    opts.country = nation;
    opts.date = App.util.Date(opts.date, "DD/MM/YY").toDate().getTime();
    opts.created = new Date().getTime();
    opts.modified = new Date().getTime();
    opts.status = "new";
    opts.details = App.util.ip.calc(opts.from, opts.to);
    return opts;
}

/**
 *
 * @returns {*|promise}
 */
function importNationalData() {
    var deferred = Q.defer();

    /**
     * Nations data file
     */
    var nations = require('./data/nations.json');

    // Get all of the Blocks from the App.Store
    if (nations)
        AddressData.stores.Blocks.getAll()
            .then(function (blocks) {

                if (blocks && blocks.length > 0) {

                    // Loop over nation names
                    for (var nation in nations) {

                        //For each of the CDR blocks in the current Nation
                        nations[nation].forEach(function (cdr) {

                            /**
                             * Compare each record in the App.Store to the current CDR block
                             * @type {Array}
                             */
                            var found = blocks.map(function (blockData) {
                                if (blockData[0] == cdr.from || blockData[1] == cdr.to) {
                                    return createNewBlockData(cdr, nation);
                                }
                            });

                            // Save the record if it does not exist
                            if (found.length > 0) {
                                AddressData.stores.Blocks.conn.save(found, function (err, res) {
                                    if (err) {
                                        deferred.reject(new Error(err));
                                        // Handle error
                                    } else {
                                        console.log(res);
                                        // Handle success
                                    }
                                });
                            }
                        })
                    }
                    deferred.resolve();
                }

                else
                    deferred.reject(new Error("No blocks found!"));
            }).catch(function (err) {
                console.log(err);
            });

    else
        deferred.reject(new Error("Make sure nations datafile exists!"));

    return deferred.promise;
}

/**
 *
 */
AddressData.BlocksCheck = function () {

    AddressData.stores.Blocks.getAll()
        .then(function (blocks) {

            async.eachSeries(blocks, function (block, done) {
                console.log(block);
                //var job = queue.create('ProcessBlocks', {
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
//Block1024 add256 scan64
AddressData.createBlockJobs = function () {
    AddressData.stores.Blocks.getAll()
        .then(function (blocks) {
            var split = 1024;
            App.util.async.eachSeries(blocks, function (block, done) {
                //done();
                AddressData.stores.Targets.getByBlockId(block.id)
                    .then(function (targets) {
                        var matrix = App.util.chunk(targets, 1024);

                        App.util.async.eachSeries(matrix, function (chunk, cb) {
                            chunk = chunk.map(function(data){
                               return data.id;
                            });
                            //App.Store.createKue(block.id, chunk).then(function () {
                            App.Store.createKue("isAlive", chunk, {title: "Scan Targets for Block "+ block.id, country: block.key[1]})
                                .then(function () {
                                cb();
                            }).done();
                        });
                        done();
                    }).done();

            });

            //isItUp(tmpblock);
        }).catch(function (error) {
            console.log("Two", error);
        })
        .done();

}

module.exports = AddressData;