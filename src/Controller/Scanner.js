/**
 * Test run for scanner app
 * @type {*|exports|module.exports}
 */
var fs =  require('fs');
var Q = require('q');
var path = require('path');
//console.log("HEEEEYYY", process.env.OPENSHIFT_DATA_DIR + "nmap-7.00/nmap");
//TODO: Move to Core utils
var ajv = require('ajv')();
ajv.addSchema(require('../../schemas/nmap.json'), 'nmap');

var App = require('../App');

//Data is chunked into 1024 targets, then 4 sets of 256 which each of is split into sets of 16
var nmap = require('libnmap');
//App.Store.kue.app.listen(8080);
App.Store.queue.process('418b3a196f9a8a9fb526e9be3f5e6b35', function(job, done){
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
                    App.Store.conn.targets.merge(addr, report[addr], function(err, res){
                        if(err){
                            done(new Error(err));
                            console.log('Error in Store Merge', err);
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
        flags: ["Pn", "sL", "--disable-arp-ping"]
    };

    if(process.env.OPENSHIFT_DATA_DIR){

        opts.nmap = "./"+ process.env.OPENSHIFT_REPO_DIR + "bin/nmap-openshift/";
        fs.chmodSync(opts.nmap, 0775);
        console.log("OPTS", opts.nmap);
    }

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