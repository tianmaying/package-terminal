var Q = require("q");
var _ = require("lodash");

var shells = require("./shells").manager;
var shells_rpc = require("./rpc");
var utils = require("./utils");

module.exports = function(codebox, socket, workspace) {
    var shell = null;
    var shellOptions = null;
    var logger = codebox.logger;
    var events = codebox.events;

    var getShell = function(data) {
        if(shells.shells[data.shellId]) {
            return Q(shells.attach(data.shellId));
        }
        return shells.createShell(data.shellId, _.merge(data.opts || {}, {
            workspace: workspace
        }));
    };
    // var handleShellOutput = function(data) {
    //     var str = data.toString('utf8');
    //     if(str.indexOf('\u001b[1m\u001b[3m%\u001b[23m\u001b[1m\u001b[0m') === 0)
    //         return;
    //     socket.do("output", utils.btoa(str));
    // };
    var handleShellOutput = function(data) {
        socket.do("output", utils.btoa(data));
    };

    // Open the shell
    socket.on('do.open', function(data) {
        shellOptions = data;
        logger.log("open shell ", shellOptions);

        // Default options
        shellOptions.opts = _.defaults(shellOptions.opts, {

        });

        return getShell(shellOptions)
        .then(function(_shell) {
            // Increment number of socket connected to this shell
            shells.shells[data.shellId].nSockets = (shells.shells[data.shellId].nSockets || 0) + 1;

            shell = _shell;

            // Bind events
            shell.on('data', handleShellOutput);
            shell.once('end', function() {
                socket.close();
            });

            // Stream is now hooked up
            events.emit('shell.open', {
                'shellId': data.shellId
            });
        })
        .fail(function(err) {
            logger.error("error creating a shell: ", err.stack);
            socket.close();
        });
    });

    // Participant left
    socket.on("close", function() {
        logger.log("socket disconnected");

        // Shell still exists
        if (!shell || !shells.shells[shellOptions.shellId]) return;

        // Unbind events
        shell.removeListener('data', handleShellOutput);

        if (shells.shells[shellOptions.shellId].nSockets > 1) {
            logger.log("-> don't close multi-users terminal ", shellOptions.shellId);
            shells.shells[shellOptions.shellId].nSockets = shells.shells[shellOptions.shellId].nSockets - 1;
        } else {
            shells_rpc.destroy(shellOptions);
        }
    });

    // Write to the stdin
    socket.on('do.input', function(data) {
        if (!shell) return;

        shell.write(utils.atob(data));
    });

    // Destroy the shell (force)
    socket.on('do.destroy', function () {
        if (!shell) return;

        shells_rpc.destroy(shellOptions);
    });

    // Resize the terminal
    socket.on('do.resize', function(data) {
        if (!shell) return;

        data.shellId = shellOptions.shellId;

        shells_rpc.resize(data)
        .then(function() {
            events.emit('shell.resize', data);
        });
    });
};
