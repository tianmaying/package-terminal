var _ = codebox.require("hr.utils");
var Class = codebox.require("hr.class");
var hash = codebox.require("utils/hash");
var io = require("socket.io-client");

var logging = codebox.require("hr.logger")("terminal");

var host = 'http://ide-ws.tianmaying.com';
var workspaceId = _.chain(window.location.pathname.split('/'))
    .filter(function(p) {
        return !!p;
    }).last().value();

var Shell = Class.extend({
    defaults: {},

    initialize: function () {
        Shell.__super__.initialize.apply(this, arguments);
        this.shellId = this.options.shellId || _.uniqueId("term");
        return this;
    },

    /*
     *  Connect to the terminal
     */
    connect: function () {
        var that = this;
        if (this.socket != null) {
            return this;
        }
        var url = host + '/socket.io/tty/' + workspaceId;
        this.socket = io.connect(url)
            .on('connect', function () {
                that.trigger('connect');
                that.socket.emit("term.open", {
                    id: that.shellId,
                    cols: 80,
                    rows: 24
                });
            });

        this.socket.on('term.output', function (data) {
            that.trigger(data.output);
        });

        this.socket.on('disconnect', function () {
            that.trigger('disconnect');
        });

        // this.listenTo(this.socket, "close", function() {
        //     this.trigger("disconnect");
        // });
        //
        // this.listenTo(this.socket, "do:output", function(data) {
        //     // this.trigger("data", decodeURIComponent(window.atob(data)));
        //     this.trigger("data", data);
        // });
        //
        // this.listenTo(this.socket, "open", function() {
        //     this.trigger("connect");
        //
        //     this.socket.do('open', {
        //         "shellId": that.shellId,
        //         "opts": {
        //             "rows": 80,
        //             "columns": 24,
        //             "id": that.shellId,
        //             "cwd": that.options.cwd
        //         }
        //     });
        // });
    },

    /*
     *  Disconnect
     */
    disconnect: function () {
        if (this.socket != null) {
            this.socket.disconnect();
        }
        return this;
    },

    /*
     *  Write content
     */
    write: function (buf) {
        if (this.socket != null) {
            // this.socket.do("input", hash.btoa(buf));
            this.socket.emit("term:input", {
                id: this.shellId,
                input: buf
            });
        }
        return this;
    },

    /*
     *  Resize the shell
     */
    resize: function (w, h) {
        if (this.socket != null) {
            this.socket.emit("term.resize", {
                "id": this.shellId,
                "cols": w,
                "rows": h
            });
        }
        return this;
    }

    /*
     *  Force destroy the shell
     */
    // forceDestroy: function() {
    //     if (this.socket != null) {
    //         this.socket.do("destroy");
    //     }
    //     return this;
    // }
});

module.exports = Shell;
