module.exports = setPathMaps;

var setPathMap = require("./../set/setPathMap");
var isFunction = require("./../support/isFunction");
var getCachePosition = require("./../get/getCachePosition");
var InvalidModelError = require("./../errors/InvalidModelError");

/**
 * Sets a list of {@link PathMapEnvelope}s into a {@link JSONGraph}.
 * @function
 * @param {Object} model - the Model for which to insert the PathMaps.
 * @param {Array.<PathMapEnvelope>} pathMapEnvelopes - the a list of {@link PathMapEnvelope}s to set.
 * @return {Array.<Array.<Path>>} - an Array of Arrays where each inner Array is a list of requested and optimized paths (respectively) for the successfully set values.
 */

function setPathMaps(model, pathMapEnvelopes, promote, errorSelector, comparator) {

    var ref = false;
    var _root = model._root;
    var bound = model._path;
    var cache = _root.cache;
    var node = cache;

    var optimizedPath, requestedPath;
    var optimizedPathDepth = bound.length;

    // If the model is bound, then get that cache position.
    if (optimizedPathDepth) {

        node = getCachePosition(model, bound);

        // If there was a short, then we 'throw an error' to the outside
        // calling function which will onError the observer.
        if (node.$type) {
            return {
                criticalError: new InvalidModelError(bound, bound)
            };
        }
        requestedPath = [];
        optimizedPath = bound.slice(0);
        ref = model._referenceContainer;
    } else {
        requestedPath = [];
        optimizedPath = [];
        optimizedPathDepth = 0;
    }

    var expired = _root.expired;
    var version = _root.version++;
    var initialVersion = cache.ツversion;

    var requestedPaths = [];
    var optimizedPaths = [];
    var pathMapIndex = -1;
    var pathMapCount = pathMapEnvelopes.length;

    while (++pathMapIndex < pathMapCount) {

        var pathMapEnvelope = pathMapEnvelopes[pathMapIndex];

        setPathMap(pathMapEnvelope.json, 0, cache, node, node,
                   requestedPath, 0,
                   optimizedPath, optimizedPathDepth,
                   requestedPaths, optimizedPaths,
                   comparator, errorSelector,
                   version, expired, _root, promote);
    }

    var newVersion = cache.ツversion;
    var rootChangeHandler = _root.onChange;

    if (isFunction(rootChangeHandler) && initialVersion !== newVersion) {
        rootChangeHandler();
    }

    return [requestedPaths, optimizedPaths];
}
