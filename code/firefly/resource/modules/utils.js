var EXPORTED_SYMBOLS = ["logToFirebug", "getMainWindow", "getBrowser", "outputToFile", "delayedExec"];

function getMainWindow() {
    var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService();
    var windowManagerInterface = windowManager.QueryInterface(Components.interfaces.nsIWindowMediator);
    var eb = windowManagerInterface.getEnumerator("navigator:browser");
    if (eb.hasMoreElements()) {
        return eb.getNext().QueryInterface(Components.interfaces.nsIDOMWindow);
    }
    return null;
}

function getBrowser() {
    return getMainWindow().getBrowser();
}

function logToFirebug(msg) {
    var firebug = getMainWindow().QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation)
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
        .rootTreeItem
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIDOMWindow).Firebug;
    firebug.Console.log(msg);
}

function outputToFile(data, filename) {
    Components.utils.import("resource://gre/modules/NetUtil.jsm");
    Components.utils.import("resource://gre/modules/FileUtils.jsm");
    var file = new FileUtils.File(filename);
    var ostream = FileUtils.openSafeFileOutputStream(file);
    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
        .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

    converter.charset = "UTF-8";
    var istream = converter.convertToInputStream(data);
    NetUtil.asyncCopy(istream, ostream);
};

function delayedExec(callback, timeout) {
    var event = {
        notify: function(timer) {
            callback();
        }
    }
    var timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
    timer.initWithCallback(event, timeout, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    return timer;
}
