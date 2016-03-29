module.exports = setGraphNode;

var $ref = require("./../types/ref");
var $refset = require("./../types/refset");
var isExpired = require("./../support/isAlreadyExpired");
var expireNode = require("./../support/expireNode");
var setGraphRef = require("./../set/setGraphRef");
var __innerRefs = require("./../internal/innerRefs");
var __refTarget = require("./../internal/refTarget");
var NullInPathError = require("./../errors/NullInPathError");
var promote = require("./../lru/promote");
var assignCrossedRefs = require('./../set/assignCrossedRefs');
var mergeJSONGraphNode = require("./../support/mergeJSONGraphNode");

/* eslint-disable no-constant-condition, no-eq-null */
function setGraphNode(key, branch, reference,
                      innerRefs, root, parent, node,
                      messageRoot, messageParent, message,
                      requestedPath, requestedPathDepth,
                      optimizedPath, optimizedPathDepth,
                      comparator, errorSelector,
                      version, expired, lru) {

    var results = [];
    var refsIndex = 0;
    var refsCount = 0;
    var resultsIndex = 0;
    var refs, refPathSet;

    do {
        if (node) {
            var type = node.$type;
            if (type === $ref || type === $refset) {
                if (isExpired(node)) {
                    expireNode(node, expired, lru);
                    results[resultsIndex    ] = undefined;
                    results[resultsIndex + 1] = root;
                    results[resultsIndex + 2] = message;
                    results[resultsIndex + 3] = messageRoot;
                    results[resultsIndex + 4] = node.value.slice(0);
                    results[resultsIndex + 5] = node.value.length;
                    resultsIndex += 6;
                } else {

                    assignCrossedRefs(node, innerRefs, reference);

                    promote(lru, node);

                    setGraphRef(refs || (refs = []),
                                node, node.value, 0, root, root, root,
                                messageRoot, messageRoot, messageRoot,
                                node[__innerRefs] || {}, node[__refTarget],
                                requestedPath, requestedPathDepth, [], 0,
                                comparator, errorSelector, version, expired, lru);

                    refsCount = refs.length;
                }
            } else if (type) {
                results[resultsIndex    ] = node;
                results[resultsIndex + 1] = parent;
                results[resultsIndex + 2] = message;
                results[resultsIndex + 3] = messageParent;
                results[resultsIndex + 4] = optimizedPath;
                results[resultsIndex + 5] = optimizedPathDepth;
                resultsIndex += 6;
            } else {
                if (key == null) {
                    if (branch) {
                        throw new NullInPathError();
                    } else {
                        key = node.ツkey;
                    }
                } else {
                    if (!reference) {
                        requestedPath[requestedPathDepth] = key;
                    }
                    parent = node;
                    node = parent[key];
                    messageParent = message;
                    message = messageParent && messageParent[key];
                    optimizedPath[optimizedPathDepth] = key;
                }

                node = mergeJSONGraphNode(
                    parent, node, message, key,
                    requestedPath, requestedPathDepth,
                    optimizedPath, optimizedPathDepth,
                    version, expired, lru, comparator, errorSelector
                );

                results[resultsIndex    ] = node;
                results[resultsIndex + 1] = parent;
                results[resultsIndex + 2] = message;
                results[resultsIndex + 3] = messageParent;
                results[resultsIndex + 4] = optimizedPath;
                results[resultsIndex + 5] = optimizedPathDepth + 1;
                resultsIndex += 6;
            }
        }

        if (refsIndex < refsCount) {
            node = refs[refsIndex];
            parent = refs[refsIndex + 1];
            message = refs[refsIndex + 2];
            messageParent = refs[refsIndex + 3];
            innerRefs     = refs[refsIndex + 4];
            optimizedPath = refs[refsIndex + 5];
            optimizedPathDepth = optimizedPath.length;
            refsIndex += 6;
            continue;
        }
        break;
    } while (true);

    return results;
}
/* eslint-enable */

