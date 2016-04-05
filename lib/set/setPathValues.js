var isFunction = require("./../support/isFunction");
var setPathValue = require("./../set/setPathValue");
var getBoundValue = require("./../get/getBoundValue");
var incrementVersion = require("./../support/incrementVersion");

/**
 * Sets a list of {@link PathValue}s into a {@link JSONGraph}.
 * @function
 * @param {Object} model - the Model for which to insert the {@link PathValue}s.
 * @param {Array.<PathValue>} pathValues - the list of {@link PathValue}s to set.
 * @return {Array.<Array.<Path>>} - an Array of Arrays where each inner Array is a list of requested and optimized paths (respectively) for the successfully set values.
 */

module.exports = function setPathValues(model, pathValues, promote, errorSelector, comparator) {

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

    var pathValueIndex = -1;
    var pathValueCount = pathValues.length;

    while (++pathValueIndex < pathValueCount) {

        var pathValue = pathValues[pathValueIndex];
        var path = pathValue.path;
        var value = pathValue.value;

        setPathValue(path, 0, cache, parent, node, value,
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
