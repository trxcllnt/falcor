module.exports = getRefTarget;

var isArray = Array.isArray;

var $ref = require("./../../types/ref");
var $nodeset = require("./../../types/nodeset");
var __innerRefs = require("./../../internal/innerRefs");

var onValue = require("./../../get/jsonGraph/onValue");
var onMissing = require("./../../get/onMissing");
var isExpired = require("./../../get/util/isExpired");
var expireNode = require("./../../support/expireNode");
var NullInPathError = require("./../../errors/NullInPathError");
var assignCrossedRefs = require('./../../support/assignCrossedRefs');

/* eslint-disable no-constant-condition */
function getRefTarget(path, depth, root, node,
                      outerPath, outerPathDepth,
                      optimizedPath, optimizedPathDepth,
                      model, outerResults, innerRefs, seed) {

    var type;
    var height = path.length;

    var key, keys, next, json,
        hasMissingValue, nextDepth, nextOptimizedDepth,
        keyIndex, keyCount, isRange, rangeIndex, rangeCount;

    do {
        var isLeaf = depth === height;

        // ============ Check for base cases ================

        // if nothing found in cache, add paths to set of abs and rel missing paths
        if (node === undefined) {
            return onMissing(model, outerPath, outerPathDepth, outerResults,
                             undefined, optimizedPath, optimizedPathDepth);
        }
        // if atom or error JSON Graph primitive found, short curcuit
        else if (((type = node.$type) && type !== $ref && type !== $nodeset) || isLeaf) {
            return node;
        }
        // if ref JSON Graph primitive found, grab target of the reference
        // and continue evaluating rest of ref path against it.
        else if (type === $ref) {
            var refPath, refTarget;
            if (isExpired(node)) {
                refTarget = undefined;
                expireNode(node, model._root.expired, model._root);
            } else {
                refPath = node.value;
                assignCrossedRefs(node, innerRefs, null, model._root, promote);
                onValue(path, depth, node, type, seed,
                        model, outerResults, optimizedPath, optimizedPathDepth);
                refTarget = getRefTarget(refPath, 0, root, root, outerPath,
                                         outerPathDepth, [], 0, model, outerResults,
                                         node[__innerRefs] || (node[__innerRefs] = {}));
            }
            // if refTarget comes back undefined short-circuit
            return refTarget === undefined ?
                undefined : getRefTarget(path, depth, root, refTarget,
                                         outerPath, outerPathDepth,
                                         refPath.slice(0), refPath.length,
                                         model, outerResults, innerRefs, seed);
        }
        // node will only be an Array if getRefTarget encountered a pathSet in
        // a ref or a refset and consequently returned a nodeset. For example
        // getRefTarget($ref(["lists",[52,99]])) produces
        // [ cache["lists"][52], cache["lists"][99] ]. When getRefTarget
        // is called on this output, it has to replace each ref target in the
        // array with the result of evaluating the rest of path on the target.
        else if (type === $nodeset) {
            json = node;
            keys = node.$keys;
            nextDepth = depth;
            hasMissingValue = false;
            nextOptimizedDepth = optimizedPathDepth + 1;

            if (isArray(keys)) {
                keyIndex = 0;
                keyCount = keys.length;
                // return undefined if there is an empty keyset in the path.
                // An example of an empty keyset is: ['lolomo', [], 'summary'].
                // This should short circuit without building missing paths.
                if (keyCount === 0) {
                    return undefined;
                }
                do {
                    key = keys[keyIndex];
                    // If the key is null, throw an error.
                    // null isn't allowed in keysets.
                    if (key == null) {
                        throw new NullInPathError();
                    }
                    // If key is a primitive, evaluate against node and bump the depth
                    else if (typeof key !== "object") {
                        next = node[key];
                        optimizedPath[optimizedPathDepth] = key;
                        if (next !== undefined) {
                            next = getRefTarget(path, nextDepth, root, next,
                                                outerPath, outerPathDepth, optimizedPath,
                                                nextOptimizedDepth, model, outerResults, innerRefs, seed);
                            if (next !== undefined) {
                                json[key] = next;
                            }
                        }
                    }
                    // if range found in keyset, recursively call getRefTarget
                    // over each index in range
                    else {
                        rangeIndex = (key.from || 0) - 1;
                        rangeCount = (key.to || (rangeIndex + (key.length || 0))) + 1;
                        while (++rangeIndex < rangeCount) {
                            next = node[rangeIndex];
                            optimizedPath[optimizedPathDepth] = rangeIndex;
                            if (next !== undefined) {
                                next = getRefTarget(path, nextDepth, root, next,
                                                    outerPath, outerPathDepth, optimizedPath,
                                                    nextOptimizedDepth, model, outerResults, innerRefs, seed);
                                if (next !== undefined) {
                                    json[key] = next;
                                }
                            }
                        }
                    }
                } while (++keyIndex < keyCount);
            }
            // If keys is not a keyset it must be a range
            else {
                key = keys;
                rangeIndex = (key.from || 0) - 1;
                rangeCount = (key.to || (rangeIndex + (key.length || 0))) + 1;
                while (++rangeIndex < rangeCount) {
                    next = node[rangeIndex];
                    optimizedPath[optimizedPathDepth] = rangeIndex;
                    if (next !== undefined) {
                        next = getRefTarget(path, nextDepth, root, next,
                                            outerPath, outerPathDepth, optimizedPath,
                                            nextOptimizedDepth, model, outerResults, innerRefs, seed);
                        if (next !== undefined) {
                            json[key] = next;
                        }
                    }
                }
            }
            return json;
        }

        // ===== Is Path Key null, a Key Set, a Range, or a primitive key? =====

        keys = path[depth];
        nextDepth = depth + 1;
        hasMissingValue = false;
        nextOptimizedDepth = optimizedPathDepth + 1;

        // If the keyset is null, throw an error.
        // nulls aren't allowed in references.
        if (keys == null) {
            // if (nextDepth === height) {
            //     depth = nextDepth;
            //     continue;
            // }
            throw new NullInPathError();
        }
        // If key is a primitive, evaluate against node and bump the depth
        else if (typeof keys !== "object") {
            // simulate tail recursion
            key = keys;
            node = node[key];
            depth = nextDepth;
            optimizedPath[optimizedPathDepth] = key;
            optimizedPathDepth = nextOptimizedDepth;
            continue;
        }

        // node will only be an Array if getRefTarget encountered a pathSet in
        // a ref or a refset. For example getRefTarget($ref(["lists",[52,99]]))
        // produces [ cache["lists"][52], cache["lists"][99] ]. When
        // getPathAsJSON is called on this output, it has to replace each ref
        // target in the array with the result of evaluating the rest of path on
        // the target.

        json = { $type: $nodeset, $keys: keys };

        if (depth > 0) {
            json.$path = node.ツabsolutePath;
            json.$version = node.ツversion;
        }

        if (isArray(keys)) {
            keyIndex = 0;
            keyCount = keys.length;
            // return undefined if there is an empty keyset in the path.
            // An example of an empty keyset is: ['lolomo', [], 'summary'].
            // This should short circuit without building missing paths.
            if (keyCount === 0) {
                return undefined;
            }
            do {
                key = keys[keyIndex];
                // If the key is null, throw an error.
                // null isn't allowed in keysets.
                if (key == null) {
                    throw new NullInPathError();
                }
                // If key is a primitive, evaluate against node and bump the depth
                else if (typeof key !== "object") {
                    next = node[key];
                    optimizedPath[optimizedPathDepth] = key;
                    next = getRefTarget(path, nextDepth, root, next,
                                        outerPath, outerPathDepth, optimizedPath,
                                        nextOptimizedDepth, model, outerResults, innerRefs, seed);
                    if (next !== undefined) {
                        json[key] = next;
                    } else {
                        hasMissingValue = true;
                    }
                }
                // if range found in keyset, recursively call getRefTarget
                // over each index in range
                else {
                    rangeIndex = (key.from || 0) - 1;
                    rangeCount = (key.to || (rangeIndex + (key.length || 0))) + 1;
                    while (++rangeIndex < rangeCount) {
                        next = node[rangeIndex];
                        optimizedPath[optimizedPathDepth] = rangeIndex;
                        next = getRefTarget(path, nextDepth, root, next,
                                            outerPath, outerPathDepth, optimizedPath,
                                            nextOptimizedDepth, model, outerResults, innerRefs, seed);
                        if (next !== undefined) {
                            json[key] = next;
                        } else {
                            hasMissingValue = true;
                        }
                    }
                }
            } while (++keyIndex < keyCount);
        }
        // If keys is not a keyset it must be a range
        else {
            key = keys;
            rangeIndex = (key.from || 0) - 1;
            rangeCount = (key.to || (rangeIndex + (key.length || 0))) + 1;
            while (++rangeIndex < rangeCount) {
                next = node[rangeIndex];
                optimizedPath[optimizedPathDepth] = rangeIndex;
                next = getRefTarget(path, nextDepth, root, next,
                                    outerPath, outerPathDepth, optimizedPath,
                                    nextOptimizedDepth, model, outerResults, innerRefs, seed);
                if (next !== undefined) {
                    json[key] = next;
                } else {
                    hasMissingValue = true;
                }
            }
        }

        if (hasMissingValue) {
            json.$hasMissingValue = true;
        }

        return json;
    } while (true);
}
/* eslint-enable */
