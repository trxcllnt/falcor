module.exports = setPathMap;

var isArray = Array.isArray;
var hasOwn = require("./../support/hasOwn");
var isObject = require("./../support/isObject");
var setPathNode = require("./../set/setPathNode");
var __prefix = require("./../internal/unicodePrefix");

/* eslint-disable no-constant-condition */
function setPathMap(pathMap, depth, root, parent, node,
                    requestedPath, requestedPathDepth,
                    optimizedPath, optimizedPathDepth,
                    requestedPaths, optimizedPaths,
                    comparator, errorSelector,
                    version, expired, lru, promote) {

    var keys = getKeys(pathMap);

    if (!keys || !keys.length) {
        return;
    }

    var keyIndex = 0;
    var keyCount = keys.length;
    var nextDepth = depth + 1;
    var nextRequestedPathDepth = requestedPathDepth + 1;


    do {
        var key = keys[keyIndex];
        var child = pathMap[key];
        var branch = isObject(child) && !child.$type;

        var results = setPathNode(root, parent, node, key, child, branch, false,
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
                    setPathMap(child, nextDepth, root, nextParent, nextNode,
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

    } while (++keyIndex < keyCount);
}
/* eslint-enable */

function getKeys(pathMap) {

    if (isObject(pathMap) && !pathMap.$type) {
        var keys = [];
        var itr = 0;
        if (isArray(pathMap)) {
            keys[itr++] = "length";
        }
        for (var key in pathMap) {
            if (key[0] === __prefix || key[0] === "$" || !hasOwn(pathMap, key)) {
                continue;
            }
            keys[itr++] = key;
        }
        return keys;
    }

    return void 0;
}
