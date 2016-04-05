var setPathMap = require("./../set/setPathMap");
var isFunction = require("./../support/isFunction");
var getBoundValue = require("./../get/getBoundValue");
var incrementVersion = require("./../support/incrementVersion");

/**
 * Sets a list of {@link PathMapEnvelope}s into a {@link JSONGraph}.
 * @function
 * @param {Object} model - the Model for which to insert the PathMaps.
 * @param {Array.<PathMapEnvelope>} pathMapEnvelopes - the a list of {@link PathMapEnvelope}s to set.
 * @return {Array.<Array.<Path>>} - an Array of Arrays where each inner Array is a list of requested and optimized paths (respectively) for the successfully set values.
 */

module.exports = function setPathMaps(model, pathMapEnvelopes, promote, errorSelector, comparator) {

    var modelRoot = model._root;
    var lru = modelRoot;
    var expired = modelRoot.expired;
    var version = incrementVersion();
    var bound = model._path;
    var cache = modelRoot.cache;
    var node = bound.length ? getBoundValue(model, bound).value : cache;
    var parent = node.ツparent || cache;
    var initialVersion = cache.ツversion;

    var requestedPath = [];
    var optimizedPath = bound.slice(0);
    var optimizedPathDepth = bound.length;

    var requestedPaths = [];
    var optimizedPaths = [];

    var pathMapIndex = -1;
    var pathMapCount = pathMapEnvelopes.length;

    while (++pathMapIndex < pathMapCount) {

        var pathMapEnvelope = pathMapEnvelopes[pathMapIndex];

        setPathMap(pathMapEnvelope.json, 0, cache, parent, node,
                   requestedPath, 0,
                   optimizedPath, optimizedPathDepth,
                   requestedPaths, optimizedPaths,
                   comparator, errorSelector,
                   version, expired, lru, promote);
    }

    var newVersion = cache.ツversion;
    var rootChangeHandler = modelRoot.onChange;

    if (isFunction(rootChangeHandler) && initialVersion !== newVersion) {
        rootChangeHandler();
    }

    return [requestedPaths, optimizedPaths];
};
