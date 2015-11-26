/**
 * Test run for scanner app
 * @type {*|exports|module.exports}
 */
var fs =  require('fs');
var cradle = require('cradle');
var Q = require('q');
var path = require('path');
//console.log("HEEEEYYY", process.env.OPENSHIFT_DATA_DIR + "nmap-7.00/nmap");
//TODO: Move to Core utils
var ajv = require('ajv')();
ajv.addSchema(require('../../schemas/nmap.json'), 'nmap');
var connection = new(cradle.Connection)('https://phearnet.cloudant.com', 443, {
    cache: true,
    raw: false,
    forceSave: true,
    auth: {
        username: process.env.COUCH_KEY,
        password: process.env.COUCH_PASSWORD
    }
});

var db = connection.database('targets');
var App = require('../App');

//Data is chunked into 1024 targets, then 4 sets of 256 which each of is split into sets of 16
var nmap = require('libnmap');
//App.Store.kue.app.listen(8080);
App.Store.queue.process('isAlive', function(job, done){
    job.on('failed', function() {
        job.state('inactive').save();
    });

    var targets = job.data.targets;
    var total = targets.length;
    targets = App.util.chunk(targets, 256);
    var indx = 0;
    App.util.async.eachSeries(targets, function(midTargetBlock, targetsCB){
        //console.log(targetBlock);


        midTargetBlock = App.util.chunk(midTargetBlock, 16);
        console.log('Large Block');
        App.util.async.eachSeries(midTargetBlock, function(targetBlock, midTargetBlockCB){

            isItUp(targetBlock).then(function(report){
                //console.log(report);
                var targetblocksuccess = 0;
                for (var addr in report) {
                    job.progress(indx, total);
                    indx++;
                    //TODO: Add validation
                    db.merge(addr, report[addr], function(err, res){
                        if(err){
                            job.log(addr,report[addr]);
                            done(new Error(err));
                            console.log('Error in Store Merge', err, addr, report[addr]);
                            throw new Error(err);
                        } else targetblocksuccess++
                    });
                }

                console.log('targetblock success', targetblocksuccess);

            }).catch(function(err){
                console.log('Error in isITUp', err);
                done(new Error(err));
                midTargetBlockCB(err);
            }).done(function(){
                console.log('Done in isITUp');
                midTargetBlockCB();
            });
        }, function(err){
            if(!err) {
                targetsCB();
            }
        });


    },function(err){
        if(!err) done();
        else done(new Error(err));
    });
});

function isItUp(data) {
    var deferred = Q.defer();
    console.log("IsitUp?", data.length);
    var opts = {
        range: data,
        flags: ["Pn", "--disable-arp-ping"]
    };

    nmap.scan(opts, function (err, report) {
        if (err) deferred.reject(err);
        else deferred.resolve(report);

        //TODO: Add validation
        //var valid = ajv.validate('nmap', report[item]);

        //if (!valid) console.log(ajv.errorsText());

    });

    return deferred.promise;
}

module.exports = App;