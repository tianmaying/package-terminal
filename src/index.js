
require("./stylesheets/main.less");

var TerminalTab = require("./tab");

var commands = codebox.require("core/commands");
var rpc = codebox.require("core/rpc");
var dialogs = codebox.require("utils/dialogs");
var events = codebox.require('core/events');


var terminalService = {
    open: function(command) {
        var term = codebox.tabs.add(TerminalTab, {}, {
            type: "terminal",
            title: "Terminal",
            section: "terminal"
        });
        if(command) {
            term.listenTo(events, 'terminal:ready', function() {
                term.shell.write(command + "\n\r")
            });
        }
        return term;
    }
};

if(!codebox.services) {
    codebox.services = {};
}
codebox.services['terminalService'] = terminalService;

commands.register({
    id: "terminal.open",
    title: "Terminal: Open",
    icon: "terminal",
    shortcuts: [
        "alt+t"
    ],
    run: function(args, context) {
        return codebox.tabs.add(TerminalTab, args, {
            type: "terminal",
            title: "Terminal",
            section: "terminal"
        });
    }
});

// commands.register({
//     id: "terminal.open.existing",
//     title: "Terminal: Open Existing",
//     icon: "versions",
//     shortcuts: [
//         "alt+shift+t"
//     ],
//     run: function(args, context) {
//         return rpc.execute("terminal/list")
//         .then(function(terminals) {
//             return dialogs.list(terminals)
//         })
//         .then(function(terminal) {
//             return commands.run("terminal.open", {
//                 shellId: terminal.get("value")
//             });
//         });
//     }
// });
