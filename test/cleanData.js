var util = require('util');
var internalKeyMap = require('./../lib/internal');
var internalKeys = Object.keys(internalKeyMap);
var $modelCreated = require('./../lib/internal/model-created.js');

module.exports = {
    clean: clean,
    strip: strip,
    internalKeys: internalKeys,
    convert: convert,
    convertKey: convert,
    convertModelCreatedAtoms: convertModelCreatedAtoms,
    convertNodes: function convertNodesHeader(obj, transform) {
        return convertNodes(null, null, obj, transform);
    },
    stripDerefAndVersionKeys: function(item) {
        strip.apply(null, [item, '$size'].concat(internalKeys));
        return item;
    }
};

function convertModelCreatedAtoms(cache) {
    convertNodes(null, null, cache, function transform(sentinel) {
        if (sentinel.$type === 'atom' && sentinel[$modelCreated] &&
            typeof sentinel.value !== 'object') {

            return sentinel.value;
        }
        return sentinel;
    });
};

function clean(item, options) {
    options = options || {
        strip: ['$size'].concat(internalKeys)
    };

    strip.apply(null, [item].concat(options.strip));

    return item;
}

function convertNodes(parent, fromKey, obj, transform) {
    if (obj != null && typeof obj === "object") {
        if (obj.$type) {
            parent[fromKey] = transform(obj);
        }

        Object.keys(obj).forEach(function(k) {
            if (typeof obj[k] === "object" && !Array.isArray(obj[k])) {
                convertNodes(obj, k, obj[k], transform);
            }
        });
    }
    return obj;
}

function convert(obj, config) {
    if (obj != null && typeof obj === "object") {
        Object.keys(config).forEach(function(key) {
            // Converts the object.
            if (obj[key]) {
                obj[key] = config[key](obj[key]);
            }
        });

        Object.keys(obj).forEach(function(k) {
            if (typeof obj[k] === "object" && !Array.isArray(obj[k])) {
                convert(obj[k], config);
            }
        });
    }
    return obj;
}

function strip(obj, key) {
    var keys = Array.prototype.slice.call(arguments, 1);
    var args = [0].concat(keys);
    if (obj != null && typeof obj === "object") {
        Object.keys(obj).forEach(function(k) {
            if (~keys.indexOf(k)) {
                delete obj[k];
            } else if ((args[0] = obj[k]) != null && typeof obj[k] === "object") {
                strip.apply(null, args);
            }
        });
    }
}
