module.exports = setPathValue;

var setPathNode = require("./../set/setPathNode");
var iterateKeySet = require("falcor-path-utils").iterateKeySet;

/* eslint-disable no-constant-condition */
function setPathValue(path, depth, root, parent, node, value,
                      requestedPath, requestedPathDepth,
                      optimizedPath, optimizedPathDepth,
                      requestedPaths, optimizedPaths,
                      comparator, errorSelector,
                      version, expired, lru, promote) {

    var nextDepth = depth + 1;
    var branch = nextDepth < path.length;
    var nextRequestedPathDepth = requestedPathDepth + 1;

    var note;
    var keyset = path[depth];
    var key = keyset && typeof keyset === 'object' ?
        iterateKeySet(keyset, note = {}) : keyset;

    do {

        var results = setPathNode(root, parent, node, key, value, branch, false,
                                  null, requestedPath, requestedPathDepth,
                                  optimizedPath, optimizedPathDepth,
                                  comparator, errorSelector,
                                  version, expired, lru, promote);

        var nextIndex = 0;
        var nextLength = results.length;

        do {
            var nextNode = results[nextIndex];
            var nextParent = results[nextIndex + 1];
            var nextOptimizedPath = results[nextIndex + 2];
            var nextOptimizedPathDepth = results[nextIndex + 3];
            nextIndex += 4;
            if (nextNode) {
                if (branch) {
                    setPathValue(path, nextDepth, root, nextParent, nextNode, value,
                                 requestedPath, nextRequestedPathDepth,
                                 nextOptimizedPath, nextOptimizedPathDepth,
                                 requestedPaths, optimizedPaths,
                                 comparator, errorSelector,
                                 version, expired, lru, promote);
                } else {
                    requestedPaths.push(requestedPath.slice(0, nextRequestedPathDepth));
                    optimizedPaths.push(nextOptimizedPath.slice(0, nextOptimizedPathDepth));
                }
            }
        } while (nextIndex < nextLength);

        if (note) {
            key = iterateKeySet(keyset, note);
            continue;
        }
        break;
    } while (!note.done);
}
/* eslint-enable */
