/**
 * Test run for scanner app
 * @type {*|exports|module.exports}
 */

var Q = require('q');
console.log("HEEEEYYY", process.env.OPENSHIFT_DATA_DIR + "nmap-7.00/nmap");
//TODO: Move to Core utils
var ajv = require('ajv')();
ajv.addSchema(require('../../schemas/nmap.json'), 'nmap');

var App = require('../App');

//Data is chunked into 1024 targets, then 4 sets of 256 which each of is split into sets of 16
var nmap = require('libnmap');
//App.Store.kue.app.listen(8080);
//App.Store.queue.process('418b3a196f9a8a9fb526e9be3f5e359d', function(job, done){
//    var targets = job.data.targets;
//    var total = targets.length;
//    targets = App.util.chunk(targets, 256);
//    var indx = 0;
//    App.util.async.eachSeries(targets, function(midTargetBlock, cb){
//        //console.log(targetBlock);
//
//
//        midTargetBlock = App.util.chunk(midTargetBlock, 16);
//        console.log('Large Block');
//        App.util.async.eachSeries(midTargetBlock, function(targetBlock, callback){
//            isItUp(targetBlock).then(function(report){
//                //console.log(report);
//                for (var addr in report) {
//                    job.progress(indx, total);
//                    indx++;
//                    //TODO: Add validation
//                    App.Store.conn.targets.merge(addr, report[addr], function(err, res){
//                        if(err) throw new Error(err);
//
//                    });
//                }
//
//            }).done(function(){
//                callback();
//            });
//        }, function(err){
//            if(!err) {
//                cb();
//            }
//        });
//
//
//    });
//
//
//});

function isItUp(data) {
    var deferred = Q.defer();
    console.log("IsitUp?", data.length)

    var opts = {
        nmap: process.env.OPENSHIFT_DATA_DIR + "nmap-7.00/nmap",
        range: data,
        flags: ["Pn", "sL", "--disable-arp-ping"]
    };
    nmap.scan(opts, function (err, report) {
        if (err) deferred.reject(new Error(err));
        deferred.resolve(report);

        //TODO: Add validation
        //var valid = ajv.validate('nmap', report[item]);

        //if (!valid) console.log(ajv.errorsText());

    });

    return deferred.promise;
}

module.exports = App;