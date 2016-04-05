module.exports = setPathRefs;

var setPathNode = require("./../set/setPathNode");
var __refTarget = require("./../internal/refTarget");
var iterateKeySet = require("falcor-path-utils").iterateKeySet;
var assignRefTargets = require('./../support/assignRefTargets');

function setPathRefs(refs, ref, path, depth,
                     root, parent, node, value, innerRefs, refTarget,
                     requestedPath, requestedPathDepth,
                     optimizedPath, optimizedPathDepth,
                     comparator, errorSelector,
                     version, expired, lru, promote) {

    var nextDepth = depth + 1;
    var branch = nextDepth < path.length;

    var note;
    var keyset = path[depth];
    var key = keyset && typeof keyset === 'object' ?
        iterateKeySet(keyset, note = {}) : keyset;

    if (note && typeof refTarget !== 'object') {
        ref[__refTarget] = refTarget = [];
    }

    do {

        var results = setPathNode(root, parent, node, key, value, branch, ref,
                                  innerRefs, requestedPath, requestedPathDepth,
                                  optimizedPath, optimizedPathDepth,
                                  comparator, errorSelector,
                                  version, expired, lru, promote);

        var nextIndex = 0;
        var nextLength = results.length;
        var nextRefTarget = refTarget;

        if (note && note.isArray && note.loaded) {
            var nextRefTargetIndex = note.arrayOffset;
            nextRefTarget = refTarget[nextRefTargetIndex] || (
                refTarget[nextRefTargetIndex] = []);
        }

        do {
            var nextNode = results[nextIndex];
            var nextParent = results[nextIndex + 1];
            var nextOptimizedPath = results[nextIndex + 2];
            var nextOptimizedPathDepth = results[nextIndex + 3];
            nextIndex += 4;
            if (nextNode) {
                if (branch) {
                    setPathRefs(refs, ref, path, nextDepth,
                                root, nextParent, nextNode, value,
                                innerRefs, nextRefTarget,
                                requestedPath, requestedPathDepth,
                                nextOptimizedPath, nextOptimizedPathDepth,
                                comparator, errorSelector, version, expired, lru, promote);
                } else {

                    // assignRefTargets(nextNode, innerRefs, ref, nextRefTarget);

                    var refsIndex = refs.length;
                    refs[refsIndex] = nextNode;
                    refs[refsIndex + 1] = nextParent;
                    refs[refsIndex + 2] = innerRefs;
                    refs[refsIndex + 3] = nextOptimizedPath.slice(0, nextOptimizedPathDepth);
                    refsIndex += 4;
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
