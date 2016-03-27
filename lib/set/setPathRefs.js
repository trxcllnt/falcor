module.exports = setPathRefs;

var setPathNode = require("./../set/setPathNode");
var iterateKeySet = require("falcor-path-utils").iterateKeySet;
var assignRefTargets = require('./../set/assignRefTargets');

function setPathRefs(refs, ref, path, depth,
                     root, parent, node, value, innerRefs,
                     requestedPath, requestedPathDepth,
                     optimizedPath, optimizedPathDepth,
                     comparator, errorSelector,
                     version, expired, lru) {

    var nextDepth = depth + 1;
    var branch = nextDepth < path.length;
    var nextRequestedPathDepth = requestedPathDepth + 1;

    var note;
    var keyset = path[depth];
    var key = keyset && typeof keyset === 'object' ?
        iterateKeySet(keyset, note = {}) : keyset;

    do {

        var results = setPathNode(root, parent, node, key, value, branch, ref,
                                  innerRefs, requestedPath, requestedPathDepth,
                                  optimizedPath, optimizedPathDepth,
                                  comparator, errorSelector,
                                  version, expired, lru);

        var nextIndex = 0;
        var nextLength = results.length;

        do {
            var nextNode = results[nextIndex++];
            var nextParent = results[nextIndex++];
            var nextOptimizedPath = results[nextIndex++];
            var nextOptimizedPathDepth = results[nextIndex++];
            if (nextNode) {
                if (branch) {
                    setPathRefs(refs, ref, path, nextDepth,
                                root, nextParent, nextNode, value, innerRefs,
                                requestedPath, nextRequestedPathDepth,
                                nextOptimizedPath, nextOptimizedPathDepth,
                                comparator, errorSelector, version, expired, lru);
                } else {

                    assignRefTargets(nextNode, innerRefs, ref);

                    var refsIndex = refs.length;
                    refs[refsIndex] = nextNode;
                    refs[refsIndex + 1] = nextParent;
                    refs[refsIndex + 2] = innerRefs;
                    refs[refsIndex + 3] = nextOptimizedPath.slice(0, nextOptimizedPathDepth);
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
