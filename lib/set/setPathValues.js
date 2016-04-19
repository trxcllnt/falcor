module.exports = setPathValues;

var isFunction = require("./../support/isFunction");
var setPathValue = require("./../set/setPathValue");
var getCachePosition = require("./../get/getCachePosition");
var InvalidModelError = require("./../errors/InvalidModelError");

/**
 * Sets a list of {@link PathValue}s into a {@link JSONGraph}.
 * @function
 * @param {Object} model - the Model for which to insert the {@link PathValue}s.
 * @param {Array.<PathValue>} pathValues - the list of {@link PathValue}s to set.
 * @return {Array.<Array.<Path>>} - an Array of Arrays where each inner Array is a list of requested and optimized paths (respectively) for the successfully set values.
 */
function setPathValues(model, pathValues, promote, errorSelector, comparator) {

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
    var pathValueIndex = -1;
    var pathValueCount = pathValues.length;

    while (++pathValueIndex < pathValueCount) {

        var pathValue = pathValues[pathValueIndex];
        var path = pathValue.path;
        var value = pathValue.value;

        setPathValue(path, 0, cache, node, node, value,
                     requestedPath, 0,
                     optimizedPath, optimizedPathDepth,
                     requestedPaths, optimizedPaths,
                     comparator, errorSelector,
                     version, expired, _root, promote);
    }

    var newVersion = cache.ツversion;
    var rootChangeHandler = _root.onChange;

    if (isFunction(rootChangeHandler) && initialVersion !== newVersion) {
        rootChangeHandler(_root.topLevelModel);
    }

    return [requestedPaths, optimizedPaths];
}
