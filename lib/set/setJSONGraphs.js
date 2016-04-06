module.exports = setJSONGraphs;

var isFunction = require("./../support/isFunction");
var setGraphPath = require("./../set/setGraphPath");
var BoundJSONGraphModelError = require("./../errors/BoundJSONGraphModelError");

/**
 * Merges a list of {@link JSONGraphEnvelope}s into a {@link JSONGraph}.
 * @function
 * @param {Object} model - the Model for which to merge the {@link JSONGraphEnvelope}s.
 * @param {Array.<PathValue>} jsonGraphEnvelopes - the {@link JSONGraphEnvelope}s to merge.
 * @return {Array.<Array.<Path>>} - an Array of Arrays where each inner Array is a list of requested and optimized paths (respectively) for the successfully set values.
 */

function setJSONGraphs(model, jsonGraphEnvelopes, promote, errorSelector, comparator) {

    var _root = model._root;
    var bound = model._path;
    var cache = _root.cache;

    // If the model is bound, then get that cache position.
    if (bound.length) {
        // JSONGraph output cannot ever be bound or else it will
        // throw an error.
        return {
            criticalError: new BoundJSONGraphModelError()
        };
    }

    var expired = _root.expired;
    var version = _root.version++;
    var initialVersion = cache.ツversion;

    var requestedPath = [];
    var optimizedPath = [];
    var requestedPaths = [];
    var optimizedPaths = [];
    var jsonGraphEnvelopeIndex = -1;
    var jsonGraphEnvelopeCount = jsonGraphEnvelopes.length;

    while (++jsonGraphEnvelopeIndex < jsonGraphEnvelopeCount) {

        var jsonGraphEnvelope = jsonGraphEnvelopes[jsonGraphEnvelopeIndex];
        var paths = jsonGraphEnvelope.paths;
        var jsonGraph = jsonGraphEnvelope.jsonGraph;

        var pathIndex = -1;
        var pathCount = paths.length;

        while (++pathIndex < pathCount) {

            var path = paths[pathIndex];

            setGraphPath(path, 0, cache, cache, cache,
                         jsonGraph, jsonGraph, jsonGraph,
                         requestedPath, 0, optimizedPath, 0,
                         requestedPaths, optimizedPaths,
                         comparator, errorSelector,
                         version, expired, _root, promote);
        }
    }

    var newVersion = cache.ツversion;
    var rootChangeHandler = _root.onChange;

    if (isFunction(rootChangeHandler) && initialVersion !== newVersion) {
        rootChangeHandler();
    }

    return [requestedPaths, optimizedPaths];
}
