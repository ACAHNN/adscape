var EXPORTED_SYMBOLS = ["Server", "AsyncRead", "Session", "sessions", "startServer"];

Components.utils.import('resource://firefly/modules/logger.js');
Components.utils.import('resource://firefly/modules/utils.js');

const Cc = Components.classes;
const Ci = Components.interfaces;

const BUFFER_SIZE = 4096;

var logger = new Logger('~/cube_log/firefly.log');

function AsyncRead(session) {
    this.session = session;
}

AsyncRead.prototype.onStartRequest = function (request, context) {
};

AsyncRead.prototype.onStopRequest = function (request, context, status) {
    this.session.onQuit();
};

AsyncRead.prototype.onDataAvailable = function (request, context, inputStream, offset, count) {
    var str = {};
    str.value = '';

    var bytesAvail = 0;
    do {
        bytesAvail = (count > BUFFER_SIZE) ? BUFFER_SIZE : count;

        var parts = {};
        var bytesRead = this.session.instream.readString(bytesAvail, parts);
        count = count - bytesRead;
        str.value += parts.value;
    } while (count > 0);

    this.session.receive(str.value);
};

function Session(transport, callback) {
    this.transpart = transport;
    this.callback = callback;

    try {
        this.outputstream = transport.openOutputStream(Ci.nsITransport.OPEN_BLOCKING, 0, 0);
        this.outstream = Cc['@mozilla.org/intl/converter-output-stream;1'].
            createInstance(Ci.nsIConverterOutputStream);
        this.outstream.init(this.outputstream, 'UTF-8', BUFFER_SIZE,
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
        this.stream = transport.openInputStream(0, 0, 0);
        this.instream = Cc['@mozilla.org/intl/converter-input-stream;1'].
            createInstance(Ci.nsIConverterInputStream);
        this.instream.init(this.stream, 'UTF-8', BUFFER_SIZE,
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
    } catch (e) {
        log('Error: ' + e);
    }

    this.pump = Cc['@mozilla.org/network/input-stream-pump;1'].
        createInstance(Ci.nsIInputStreamPump);
    this.pump.init(this.stream, -1, -1, 0, 0, false);
    this.pump.asyncRead(new AsyncRead(this), null);
}

Session.prototype.onQuit = function () {
    this.instream.close();
    this.outstream.close();
    sessions.remove(session);
};

// to call for sending the data
Session.prototype.sendString = function (string) {
    if (typeof(string) != "string") {
        throw "This is not a string";
    }

    var stroffset = 0;

    do {
        var parts = (string.length > BUFFER_SIZE) ? string.slice(stroffset, stroffset + BUFFER_SIZE)
            : string;
        stroffset += parts.length;
        this.outstream.writeString(parts);
    } while (stroffset < string.length);
    this.outstream.flush();
    this.onQuit();
};

Session.prototype.receive = function (data) {
    var self = this;
    this.callback(data, function(msg) { self.sendString(msg); });
}

var sessions = {
    _list: [],

    add: function (session) {
        this._list.push(session);
    },

    remove: function (session) {
        var index = this._list.indexOf(session);

        if (index != -1) {
            this._list.splice(index, 1);
        }
    },

    get: function (index) {
        return this._list[index];
    },

    quit: function () {
        this._list.forEach(function (session) {
            session.onQuit();
        });

        this._list.splice(0, this._list.length);
    }
};

function Server(port, callback) {
    this.port = port;
    this.callback = callback;
}

Server.prototype.start = function () {
  try {
    this.serv = Cc['@mozilla.org/network/server-socket;1'].
                createInstance(Ci.nsIServerSocket);
    this.serv.init(this.port, true, -1);
    this.serv.asyncListen(this);
  } catch (e) {
    log('Exception: ' + e);
    var self = this;
    setTimeout(function() { self.start(); }, 1000);
  }
}

Server.prototype.stop = function () {
  this.serv.close();
  this.sessions.quit();
  this.serv = undefined;
};

Server.prototype.onStopListening = function (serv, status) {
  // Stub function
};

Server.prototype.onSocketAccepted = function (serv, transport) {
    session = new Session(transport, this.callback);
    sessions.add(session);
};

function log(msg) {
    logger.write((new Date()).toString() + ' --- ' + msg);
}
