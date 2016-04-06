var getPathAsJSON = require("./../../get/json/getPathAsJSON");
var getCachePosition = require("./../../get/getCachePosition");
var InvalidModelError = require("./../../errors/InvalidModelError");

module.exports = function getWithPathsAsPathMap(model, paths, seed) {

    var ref = false;
    var bound = model._path;
    var root = model._root.cache;
    var optimizedPath, requestedPath = [];
    var outerResults = { values: seed };
    var optimizedPathDepth = bound.length;

    var node = root;

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
        optimizedPath = bound.slice(0);
        ref = model._referenceContainer;
    } else {
        optimizedPath = [];
        optimizedPathDepth = 0;
    }

    var json = seed[0];
    var pathIndex = -1;
    var pathCount = paths.length;

    while (++pathIndex < pathCount) {

        var path = paths[pathIndex];

        getPathAsJSON(path, 0, 'json',
                      root, node, json, json, ref, ref,
                      requestedPath, 0, optimizedPath, optimizedPathDepth,
                      model, outerResults);
    }

    return outerResults;
}
