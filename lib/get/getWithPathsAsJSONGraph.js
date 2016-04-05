var getPathAsJSONGraph = require("./../get/getPathAsJSONGraph");
var BoundJSONGraphModelError = require("./../errors/BoundJSONGraphModelError");

module.exports = function getWithPathsAsJSONGraph(model, paths, seed) {

    var ref = false;
    var root = model._root.cache;
    var bound = model._path;

    // If the model is bound, then get that cache position.
    if (bound.length) {
        // JSONGraph output cannot ever be bound or else it will
        // throw an error.
        return {
            criticalError: new BoundJSONGraphModelError()
        };
    }

    var json = seed[0];
    var requestedPath = [];
    var optimizedPath = [];
    var outerResults = { values: seed };
    var pathIndex = -1;
    var pathCount = paths.length;

    while (++pathIndex < pathCount) {

        var path = paths[pathIndex];

        getPathAsJSONGraph(path, 0, 'jsonGraph',
                           root, root, json, json, ref, ref,
                           requestedPath, 0, optimizedPath, 0,
                           model, outerResults);
    }

    return outerResults;
}
