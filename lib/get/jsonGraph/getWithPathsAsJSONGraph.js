var getPathAsJSONGraph = require("./../../get/jsonGraph/getPathAsJSONGraph");
var BoundJSONGraphModelError = require("./../../errors/BoundJSONGraphModelError");

module.exports = function getWithPathsAsJSONGraph(model, paths, seed) {

    var bound = model._path;
    var cache = model._root.cache;

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

    var pathIndex = -1;
    var pathCount = paths.length;
    var outerResults = { values: seed };

    while (++pathIndex < pathCount) {

        var path = paths[pathIndex];

        getPathAsJSONGraph(path, 0, 'jsonGraph',
                           cache, cache, json, false, false,
                           requestedPath, 0, optimizedPath, 0,
                           model, outerResults);
    }

    return outerResults;
}
