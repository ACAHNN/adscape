var EXPORTED_SYMBOLS = ["Harvest"];

Components.utils.import('resource://firefly/modules/utils.js');

function Harvest(callback) {
    this.callback = callback;
    this.loadTimers = new Array();
}

Harvest.prototype.startHarvesting = function (url) {
    this.visualElements = new Array();
    this.elementReferences = new Array();
    this.timer = null;

    var self = this;
    this.load_function = function(event) {
        self.onPageLoad(event);
    };
    getBrowser().addEventListener("load", this.load_function, true);
    getBrowser().loadURI(url);
};

Harvest.prototype.stopHarvesting = function () {
    try {
        getBrowser().removeEventListener("load", this.load_function, true);
    } catch (ex) {}
    this.callback = null;
};

Harvest.prototype.getHref = function(dom_element) {
    while (dom_element) {
        if (dom_element.tagName == 'A') {
            return dom_element.getAttribute('href');
        }
        dom_element = dom_element.parentNode;
    }
    return "";
    this.loadTimers = new Array();
};

Harvest.prototype.findQueryName = function(query, name) {
    var regex = new RegExp(name + "=([^&#]*)");
    var results = regex.exec(query);
    if (results == null) {
        return "";
    } else {
        return results[1];
    }
}

Harvest.prototype.findClickTag = function(query) {
    var variants = ['clicktag', 'clickTAG', 'clickTag', 'CLICKTAG', 
                    'clicktag1', 'clickTAG1', 'clickTag1', 'CLICKTAG1'];
    for (var i = 0; i < variants.length; ++i) {
        var a = this.findQueryName(query, variants[i]);
        if (a.length > 0) {
            return a;
        }
    }
    return '';
};

Harvest.prototype.onPageLoad = function(aEvent) {
    var self = this;
    // we need to wait because some async javascript might 
    // still be executing and putting new elements on the web
    timer = delayedExec(function() { self.harvestVisualElements(aEvent.originalTarget); }, 2000);
    this.loadTimers.push(timer);
};

Harvest.prototype.rootNodeLoaded = function(delayed) {
    // i'm delaying processing because some iframes might
    // not be loaded when root node is. terrible hack
    if (delayed == false) {
        if (this.timer != null) {
            // we have already scheduled rootNodeLoaded(true)
            return;
        }
        var self = this;
        this.timer = delayedExec(function() { self.rootNodeLoaded(true); }, 2000);
    } else {
        this.timer = null;
        getBrowser().removeEventListener("load", this.load_function, true);
        if (this.callback) {
            this.callback();
        }
    }
}

Harvest.prototype.getVisualElements = function() {
    return this.visualElements;
}

// I added watch_root_node to support harvesting from classes:
// if watch_root_node == true it means the function is getting 
// load events, and once it figures out that load has finished
// (root node is loaded), it triggers the callback
// if watch_root_node == false, the function is not getting load
// events, but rather getting elements found by getClass function
Harvest.prototype.harvestVisualElements = function(frame, watch_root_node) {
    if (typeof(watch_root_node) === 'undefined') {
        watch_root_node = true; // default
    }
    var imgs = frame.getElementsByTagName('img');
    for (var i = 0; i < imgs.length; i++) {
        var currentElement = new Object();
        currentElement.parent_url = getBrowser().currentURI.spec;
        currentElement.iframe_url = frame.URL;
        currentElement.html_attrs = {}
        var attrs = imgs[i].attributes;
        for (var j = 0; j < attrs.length; j++) {
            currentElement.html_attrs[attrs[j].name] = attrs[j].value;
        }
        currentElement.href = this.getHref(imgs[i]);
        currentElement.tag_type = 'img';
        currentElement.width = imgs[i].clientWidth;
        currentElement.height = imgs[i].clientHeight;
        this.visualElements.push(currentElement);
        this.elementReferences.push(imgs[i]);
    }

    var embed = frame.getElementsByTagName('embed');

    for (var i = 0; i < embed.length; ++i) {
        var currentElement = new Object();
        currentElement.parent_url = getBrowser().currentURI.spec;
        currentElement.iframe_url = frame.URL;
        currentElement.html_attrs = {};
        var attrs = embed[i].attributes;
        currentElement.href = "";
        for (var j = 0; j < attrs.length; j++) {
            currentElement.html_attrs[attrs[j].name] = attrs[j].value;
            if (attrs[j].name.toLowerCase() == 'flashvars') {
                currentElement.href = decodeURIComponent(this.findClickTag(attrs[j].value));
            }
        }
        currentElement.tag_type = 'embed';
        currentElement.width = embed[i].clientWidth;
        currentElement.height = embed[i].clientHeight;
        this.visualElements.push(currentElement);
        this.elementReferences.push(embed[i]);
    }

    if (watch_root_node && getMainWindow().content.window.document == frame) {
        this.rootNodeLoaded(false);
    }
};

Harvest.prototype.harvestElementRecursively = function(element) {
    this.harvestVisualElements(element, false);
    var iframes = element.getElementsByTagName('iframe');
    for (var i = 0; i < iframes.length; ++i) {
        this.harvestElementRecursively(iframes[i].contentDocument);
    }
}

Harvest.prototype.getClass = function(classname) {
    doc = getBrowser().contentWindow.document;
    elements = doc.getElementsByClassName(classname);
    this.visualElements = new Array();
    for (var i = 0; i < elements.length; ++i) {
        this.harvestElementRecursively(elements[i]);
    }

    this.callback();
};

// TODO figure out what happens if nothing loads
Harvest.prototype.click = function(id) {
    if (this.elementReferences[id].tagName == 'IMG') {
        // TODO if I click it usually opens a new page and I don't
        // know how to handle this yet. So I'm just going to load 
        // the target URL
        // this.elementReferences[id].click();
        this.startHarvesting(this.getHref(this.elementReferences[id]));
    } else { // embed
        // TODO this is a hacky way, it's really hard
        // to simulate click on a flash. maybe try 
        // finding apsolute position...?
        var link = this.findClickTag(this.elementReferences[id].getAttribute('flashvars'));
        if (link.length > 0) {
            this.startHarvesting(link);
        } else {
            // nothing to show here
            this.callback();
        }
    }
}
