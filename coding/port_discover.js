// Generated by CoffeeScript 1.10.0
(function() {
    var cmd, exec, logger, os, port_discover, ttyPort;

    os = require('os');

    exec = require('child_process').exec;

    logger = require('./logger');

    cmd = {
            "linux": "netstat -nlt -4 | awk '{if(NR!=1 && NR!=2) print $4}' | grep -i '0.0.0.0:'",
            "darwin": "lsof -i -P | grep -i 'listen' | grep -i '*:' | awk '{print $9}'"
        }[os.platform()] || "";

    ttyPort = parseInt(process.env.TTY_PORT) || 5000;

    port_discover = function(callback) {
        return exec(cmd, function(err, stdout, stderr) {
            var i, ips, j, ref, rets, tmpPort;
            if (stderr) {
                logger.error(stderr);
            }
            if (err) {
                return logger.error(err);
            } else {
                ips = stdout.split(/[:|\n]/);
                rets = [];
                for (i = j = 0, ref = (ips.length / 2) - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
                    tmpPort = parseInt(ips[2 * i + 1]);
                    if (tmpPort !== ttyPort) {
                        rets.push(tmpPort);
                    }
                }
                rets.sort();
                return callback(rets);
            }
        });
    };

    module.exports = port_discover;

}).call(this);
