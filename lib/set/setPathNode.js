module.exports = setPathNode;

var $ref = require("./../types/ref");
var isExpired = require("./../support/isAlreadyExpired");
var expireNode = require("./../support/expireNode");
var setPathRefs = require("./../set/setPathRefs");
var __innerRefs = require("./../internal/innerRefs");
var __refTarget = require("./../internal/refTarget");
var NullInPathError = require("./../errors/NullInPathError");
// var getRefComplement = require('./../support/getRefComplement');
var assignCrossedRefs = require('./../support/assignCrossedRefs');
var mergeValueOrInsertBranch = require("./../support/mergeValueOrInsertBranch");

/* eslint-disable no-constant-condition, no-eq-null */
function setPathNode(root, parent, node, key, value, branch, reference,
                     innerRefs, requestedPath, requestedPathDepth,
                     optimizedPath, optimizedPathDepth,
                     comparator, errorSelector,
                     version, expired, lru, promote) {

    var results = [];
    var refsIndex = 0;
    var refsCount = 0;
    var resultsIndex = 0;
    var refs, refPathSet;

    do {
        if (node) {
            var type = node.$type;
            if (type === $ref) {
                if (isExpired(node)) {
                    expireNode(node, expired, lru);
                    results[resultsIndex    ] = undefined;
                    results[resultsIndex + 1] = root;
                    results[resultsIndex + 2] = node.value.slice(0);
                    results[resultsIndex + 3] = node.value.length;
                    resultsIndex += 4;
                } else {

                    assignCrossedRefs(node, innerRefs, reference, lru);

                    refPathSet = node.value;
                    // refPathSet = getRefComplement(node, refs || (refs = []));

                    if (refPathSet) {
                        setPathRefs(refs || (refs = []),
                                    node, refPathSet, 0,
                                    root, root, root, value,
                                    node[__innerRefs] || {}, node[__refTarget],
                                    requestedPath, requestedPathDepth, [], 0,
                                    comparator, errorSelector, version, expired, lru, promote);
                    }

                    refsCount = refs.length;
                }
            } else if (type) {
                results[resultsIndex    ] = node;
                results[resultsIndex + 1] = parent;
                results[resultsIndex + 2] = optimizedPath;
                results[resultsIndex + 3] = optimizedPathDepth;
                resultsIndex += 4;
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
                    optimizedPath[optimizedPathDepth] = key;
                }

                node = mergeValueOrInsertBranch(
                    parent, node, key, value, branch, reference,
                    requestedPath, requestedPathDepth,
                    optimizedPath, optimizedPathDepth,
                    version, expired, lru, promote, comparator, errorSelector
                );

                results[resultsIndex    ] = node;
                results[resultsIndex + 1] = parent;
                results[resultsIndex + 2] = optimizedPath;
                results[resultsIndex + 3] = optimizedPathDepth + 1;
                resultsIndex += 4;
            }
        }

        if (refsIndex < refsCount) {
            node = refs[refsIndex];
            parent = refs[refsIndex + 1];
            innerRefs = refs[refsIndex + 2];
            optimizedPath = refs[refsIndex + 3];
            optimizedPathDepth = optimizedPath.length;
            refsIndex += 4;
            continue;
        }
        break;
    } while (true);

    return results;
}
/* eslint-enable */
