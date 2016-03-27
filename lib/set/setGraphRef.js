module.exports = setGraphRef;

var setGraphNode = require("./../set/setGraphNode");
var iterateKeySet = require("falcor-path-utils").iterateKeySet;
var assignRefTargets = require('./../set/assignRefTargets');

function setGraphRef(refs, ref, path, depth, root, parent, node,
                     messageRoot, messageParent, message, innerRefs,
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

        var results = setGraphNode(key, branch, ref, innerRefs, root, parent, node,
                                   messageRoot, messageParent, message,
                                   requestedPath, requestedPathDepth,
                                   optimizedPath, optimizedPathDepth,
                                   comparator, errorSelector,
                                   version, expired, lru);

        var nextIndex = 0;
        var nextLength = results.length;

        do {
            var nextNode = results[nextIndex++];
            var nextParent = results[nextIndex++];
            var nextMessage = results[nextIndex++];
            var nextMessageParent = results[nextIndex++];
            var nextOptimizedPath = results[nextIndex++];
            var nextOptimizedPathDepth = results[nextIndex++];
            if (nextNode) {
                if (branch) {
                    setGraphRef(refs, ref, path, nextDepth, root, nextParent, nextNode,
                                messageRoot, nextMessageParent, nextMessage, innerRefs,
                                requestedPath, nextRequestedPathDepth,
                                nextOptimizedPath, nextOptimizedPathDepth,
                                comparator, errorSelector,
                                version, expired, lru);
                } else {

                    assignRefTargets(nextNode, innerRefs, ref);

                    var refsIndex = refs.length;
                    refs[refsIndex] = nextNode;
                    refs[refsIndex + 1] = nextParent;
                    refs[refsIndex + 2] = nextMessage;
                    refs[refsIndex + 3] = nextMessageParent;
                    refs[refsIndex + 4] = innerRefs;
                    refs[refsIndex + 5] = nextOptimizedPath.slice(0, nextOptimizedPathDepth);
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
