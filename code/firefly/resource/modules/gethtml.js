var EXPORTED_SYMBOLS = ["GetHTML"];

Components.utils.import('resource://firefly/modules/utils.js');

function GetHTML(callback) {
    this.callback = callback;
}

GetHTML.prototype.goToURL = function (url) {
    var self = this;
    this.load_function = function(event) {
        self.onPageLoad(event);
    };
    this.html = new Array();
    getBrowser().addEventListener("load", this.load_function, true);
    getBrowser().loadURI(url);
};

GetHTML.prototype.stop = function () {
    try {
        getBrowser().removeEventListener("load", this.load_function, true);
    } catch (ex) {}
    this.callback = null;
};

GetHTML.prototype.onPageLoad = function(aEvent) {
    var doc = aEvent.originalTarget;
    var win = doc.defaultView;

    this.html.push(doc.documentElement.innerHTML);
    if (win.frameElement) return; // it's an iframe

    if (this.callback) {
        var self = this;
        this.timer = delayedExec(function() { self.callback(); }, 3000);
    }

    getBrowser().removeEventListener("load", this.load_function, true);
};

GetHTML.prototype.getHTML = function() {
    return this.html;
}
