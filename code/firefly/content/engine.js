/**
 * Firefly namespace.
 */
if ("undefined" == typeof(Firefly)) {
  var Firefly = {};
};


Firefly.Engine = {

    init : function() {
        var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);
        var gBrowser = mainWindow.gBrowser;
        if (gBrowser.addEventListener) {
            gBrowser.addEventListener("load", this.onPageLoad, true);
        }
    },

    getHref : function(dom_element) {
        while (dom_element) {
            if (dom_element.tagName == 'A') {
                return dom_element.getAttribute('href');
            }
            dom_element = dom_element.parentNode;
        }
        return "";
    },

    processFlashvars : function(query, name) {
        var regex = new RegExp("&?" + name + "=([^&#]*)");
        var results = regex.exec(query);
        if (results == null) {
            return "";
        } else {
            return results[1];
        }
    },

    harvestVisualElements : function (frame) {
        var visualElements = new Array();
        var imgs = frame.getElementsByTagName('img');
        Firebug.Console.log(frame);
        Firebug.Console.log(imgs);
        
        for (var i = 0; i < imgs.length; i++) {
            var currentElement = new Object();
            currentElement.parent_url = gBrowser.currentURI.spec;
            currentElement.html_attrs = {}
            var attrs = imgs[i].attributes;
            for (var j = 0; j < attrs.length; j++) {
                currentElement.html_attrs[attrs[j].name] = attrs[j].value;
            }
            currentElement.href = this.getHref(imgs[i]);
            visualElements.push(currentElement);
        }
    
        var embed = frame.getElementsByTagName('embed');

        Firebug.Console.log(embed);
        for (var i = 0; i < embed.length; ++i) {
            var currentElement = new Object();
            currentElement.parent_url = gBrowser.currentURI.spec;
            currentElement.html_attrs = {};
            var attrs = embed[i].attributes;
            currentElement.href = "";
            for (var j = 0; j < attrs.length; j++) {
                currentElement.html_attrs[attrs[j].name] = attrs[j].value;
                if (attrs[j].name.toLowerCase() == 'flashvars') {
                    currentElement.href = this.processFlashvars(attrs[j].value.toLowerCase(), 'clicktag');
                    Firebug.Console.log(attrs[j].value);
                    Firebug.Console.log(currentElement.href);
                }
            }
            visualElements.push(currentElement);
        }

        if (visualElements.length) {
            this.outputToFile(JSON.stringify(visualElements), "~/test_output");
        }
    },

    onPageLoad : function(aEvent) {
        Firefly.Engine.harvestVisualElements(aEvent.originalTarget); // TODO figure this out wtf
    },

    outputToFile : function(data, filename) {
        Components.utils.import("resource://gre/modules/NetUtil.jsm");
        Components.utils.import("resource://gre/modules/FileUtils.jsm");
        var file = new FileUtils.File(filename);
        var ostream = FileUtils.openSafeFileOutputStream(file);
        var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

        converter.charset = "UTF-8";
        var istream = converter.convertToInputStream(data);
        NetUtil.asyncCopy(istream, ostream);
    }
};

window.addEventListener('load', function load(event) {
    window.removeEventListener('load', load, false);
    Firefly.Engine.init();
}, false);
