var EXPORTED_SYMBOLS = ["Firefly"];

Components.utils.import('resource://firefly/modules/server.js');
Components.utils.import('resource://firefly/modules/utils.js');
Components.utils.import('resource://firefly/modules/harvest.js');
Components.utils.import('resource://firefly/modules/gethtml.js');
Components.utils.import('resource://firefly/modules/logger.js');

function Firefly() {
    // we wait until everything is loaded before 
    // initializing the extension
    var self = this;
    this.load_function = function load(event) {
        getMainWindow().removeEventListener('load', load, false);
        self.init();
    };
    getMainWindow().addEventListener('load', this.load_function, false);
}

Firefly.prototype.init = function () {
    getMainWindow().removeEventListener('load', this.load_function, false);
    var self = this;
    // load preferences
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService).getBranch("firefly.");
    this.port = prefs.getIntPref("port");
    this.server = new Server(this.port, function(data, sendString) { self.onReceive(data, sendString); });
    this.server.start();
}

Firefly.prototype.onReceive = function(data, sendString) {
    this.sendString = sendString;

    data = data.split(' ');
    if (data[0] == 'GOTO') {
        if (this.harvest) {
            this.harvest.stopHarvesting();
        }
        var self = this;
        this.harvest = new Harvest(function() { self.onHarvestingDone(); });
        this.harvest.startHarvesting(data[1]);
    } else if (data[0] == 'CLICK') {
        this.harvest.click(parseInt(data[1]));
    } else if (data[0] == 'GETCLASS') {
        this.harvest.getClass(data[1]);
    } else if (data[0] == 'REMOVECOOKIES') {
        Components.classes["@mozilla.org/cookiemanager;1"]
            .getService(Components.interfaces.nsICookieManager).removeAll();
        this.sendString('OK');
    } else if (data[0] == 'GETHTML') {
        if (this.gethtml) {
            this.gethtml.stop();
        }
        var self = this;
        this.gethtml = new GetHTML(function() { self.onGetHTMLDone(); });
        this.gethtml.goToURL(data[1]);
    }
}

Firefly.prototype.onGetHTMLDone = function() {
    this.sendString(JSON.stringify(this.gethtml.getHTML()));
}

Firefly.prototype.onHarvestingDone = function() {
    this.sendString(JSON.stringify(this.harvest.getVisualElements()));
}
