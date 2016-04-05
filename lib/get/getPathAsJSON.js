module.exports = getPathAsJSON;

var isArray = Array.isArray;

var $ref = require("./../types/ref");
var $atom = require("./../types/atom");
var $error = require("./../types/error");
var $nodeset = require("./../types/nodeset");
var __innerRefs = require("./../internal/innerRefs");

var clone = require("./../get/util/clone");
var promote = require("./../lru/promote");
var onError = require("./../get/onError");
var onMissing = require("./../get/onMissing");
var isExpired = require("./../get/util/isExpired");
var expireNode = require("./../support/expireNode");
var getRefTarget = require("./../get/getRefTarget");
var isMaterialized = require("./../get/util/isMaterialzed");
var NullInPathError = require("./../errors/NullInPathError");
var assignCrossedRefs = require('./../support/assignCrossedRefs');

function getPathAsJSON(// path being evaluated, the index of where we are in the
                       // path, and the outer key we should use to write into the
                       // JSON
                       path, depth, outerKey,
                       // root of the cache, the current node we're evaluating
                       // path against, the seed of the json result, the current
                       // json node we're writing into, a flag indicating
                       // whether we've just crossed a reference, and the most
                       // recent reference we've crossed
                       root, node, seed, json, fromRef, ref,
                       // the requested and optimized paths and their related
                       // indicies as we evaluate the pathset
                       requestedPath, requestedPathDepth,
                       optimizedPath, optimizedPathDepth,
                       // the model which defines how we create JSON results and
                       // the outer results Object on which we report the results
                       model, outerResults) {

    // ============ Check for base cases ================

    var type;
    var height = path.length;
    var isLeaf = depth === height;
    var key, keys, next, keyIndex, keyCount,
        hasMissingValue, isRange, rangeIndex, rangeCount,
        nextDepth, nextRequestedDepth, nextOptimizedDepth;

    // if nothing found in cache, add paths to set of abs and rel missing paths
    if (node === undefined ||
        // if atom or error JSON Graph primitive found, short curcuit
        ((type = node.$type) && type !== $ref && type !== $nodeset) || isLeaf) {
        return onValueType(path, depth, node, outerKey, type, seed, json,
                           model, outerResults, fromRef,
                           requestedPath, optimizedPath, optimizedPathDepth);
    }

    // If `ref` JSON Graph primitive found, in-line the target of the reference
    // and continue evaluating path.
    if (type === $ref) {
        var refPath, refTarget;
        // If the reference is expired, invalidate and report as a missing path.
        if (isExpired(node)) {
            refTarget = undefined;
            expireNode(node, model._root.expired, model._root);
        } else {
            refPath = node.value;
            assignCrossedRefs(node, null, null, model._root, promote);
            refTarget = getRefTarget(refPath, 0, root, root,
                                     path, depth, [], 0, model, outerResults,
                                     node[__innerRefs] || (node[__innerRefs] = {}));
        }
        return refTarget === undefined ?
            // if refTarget is undefined, build a relative missing path and short-circuit
            onValueType(path, depth, refTarget, outerKey, undefined, seed, json,
                        model, outerResults, true, requestedPath) :
            // otherwise continue following the path from where the reference points to
            getPathAsJSON(path, depth, outerKey,
                          root, refTarget, seed, json, true, node,
                          requestedPath, requestedPathDepth,
                          refPath.slice(0), refPath.length,
                          model, outerResults);
    }
    // node will only be an Array if getRefTarget encountered a pathSet in
    // a ref or a refset and consequently returned a nodeset. For example
    // getRefTarget($ref(["lists",[52,99]])) produces
    // [ cache["lists"][52], cache["lists"][99] ]. When getPathAsJSOn
    // is called on this output, it has to replace each ref target in the
    // array with the result of evaluating the rest of path on the target.
    else if (type === $nodeset) {

        // If a nodeset contains a single missing value, the rest of the
        // relative path is considered missing. The getRefTarget method
        // has already added the absolute paths of the missing nodes to
        // missingAbsPaths array by this point. The only thing that
        // getPathAsJSON has to do is ensure that relativePath only gets added
        // to missingRelPaths once - not once for every node in the
        // nodeset. To that end, we set the missingRelPaths to undefined
        // if any of the reftargets in the nodeset are undefined. This
        // will prevent any of the getPathAsJSON calls performed on the ref
        // targets from adding the relativePath to the missingRelPaths
        // array. After call getPathAsJSON on each refTarget we add the
        // relative missing path _once_, at the bottom of the loop.

        keys = node.$keys;
        nextDepth = depth;
        hasMissingValue = node.$hasMissingValue;
        nextRequestedDepth = requestedPathDepth;
        nextOptimizedDepth = optimizedPathDepth;

        // If a JSON seed exists, build or use the JSON branch that corresponds
        // to this keyset.
        if (json) {
            json = json[outerKey] || (json[outerKey] = {});
            json.$keys = keys;
            json.$type = $nodeset;
            node.$path && (json.$path = node.$path);
            node.$version && (json.$version = node.$version);
            if (depth > 0 && ref && model._allowFromWhenceYouCame) {
                json.$refPath = ref.value;
                json.$toReference = ref.ツabsolutePath;
            }
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
                    if (next !== undefined) {
                        getPathAsJSON(path, nextDepth, key,
                                      root, next, seed, json, false, ref,
                                      requestedPath, nextRequestedDepth,
                                      optimizedPath, nextOptimizedDepth,
                                      model, outerResults);
                    } else {
                        hasMissingValue = true;
                    }
                }
                // if range found in keyset, recursively call getPathAsJSON over
                // each index in range
                else {
                    rangeIndex = (key.from || 0) - 1;
                    rangeCount = (key.to || (rangeIndex + (key.length || 0))) + 1;
                    while (++rangeIndex < rangeCount) {
                        next = node[rangeIndex];
                        if (next !== undefined) {
                            getPathAsJSON(path, nextDepth, rangeIndex,
                                          root, next, seed, json, false, ref,
                                          requestedPath, nextRequestedDepth,
                                          optimizedPath, nextOptimizedDepth,
                                          model, outerResults);
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
                requestedPath[requestedPathDepth] = rangeIndex;
                optimizedPath[optimizedPathDepth] = rangeIndex;
                if (next !== undefined) {
                    getPathAsJSON(path, nextDepth, rangeIndex,
                                  root, next, seed, json, false, ref,
                                  requestedPath, nextRequestedDepth,
                                  optimizedPath, nextOptimizedDepth,
                                  model, outerResults);
                } else {
                    hasMissingValue = true;
                }
            }
        }

        // If the nodeset contains at least one missing value, add the requested
        // path to the requestedMissingPaths once.
        if (hasMissingValue) {
            onMissing(model, path, depth, outerResults, requestedPath);
        }

        return json;
    }

    // ======= Is Path Key null, a Key Set, a Range, or a primitive key? =======
    keys = path[depth];
    nextDepth = depth + 1;
    nextRequestedDepth = requestedPathDepth + 1;
    nextOptimizedDepth = optimizedPathDepth + 1;

    if (json) {
        json = json[outerKey] || (json[outerKey] = {});
        if (depth > 0) {
            json.$path = node.ツabsolutePath;
            json.$version = node.ツversion;
            if (ref && model._allowFromWhenceYouCame) {
                json.$refPath = ref.value;
                json.$toReference = ref.ツabsolutePath;
            }
        }
    }

    // A null key can only appear at the end of a path. It's only useful for
    // indicating that the target of ref should be returned rather than the
    // ref itself. Inserting null at the end of path lengthens the path and
    // ensures we follow the ref before hitting the end condition above
    // (exit when pathIndex === pathSetLength).
    if (keys == null) {
        if (nextDepth === height) {
            return getPathAsJSON(path, nextDepth, outerKey,
                                 root, node, seed, json, false, ref,
                                 requestedPath, requestedPathDepth,
                                 optimizedPath, optimizedPathDepth,
                                 model, outerResults);
        }
        throw new NullInPathError();
    }
    // If the key is just a primitive, add the key to the end of the abs and rel
    // paths, and return an Object that contains the result of recursively
    // evaluating the rest of the path.
    else if (typeof keys !== "object") {
        key = keys;
        requestedPath[requestedPathDepth] = key;
        optimizedPath[optimizedPathDepth] = key;
        getPathAsJSON(path, nextDepth, key,
                      root, node[key], seed, json, false, ref,
                      requestedPath, nextRequestedDepth,
                      optimizedPath, nextOptimizedDepth,
                      model, outerResults);
    }
    // If key is a Key Set, recursively call getPathAsJSON over each key inside
    // the key set
    else {
        json.$keys = keys;
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
                    requestedPath[requestedPathDepth] = key;
                    optimizedPath[optimizedPathDepth] = key;
                    getPathAsJSON(path, nextDepth, key,
                                  root, next, seed, json, false, ref,
                                  requestedPath, nextRequestedDepth,
                                  optimizedPath, nextOptimizedDepth,
                                  model, outerResults);
                }
                // if range found in keyset, recursively call getPathAsJSON over
                // each index in range
                else {
                    rangeIndex = (key.from || 0) - 1;
                    rangeCount = (key.to || (rangeIndex + (key.length || 0))) + 1;
                    while (++rangeIndex < rangeCount) {
                        next = node[rangeIndex];
                        requestedPath[requestedPathDepth] = rangeIndex;
                        optimizedPath[optimizedPathDepth] = rangeIndex;
                        getPathAsJSON(path, nextDepth, rangeIndex,
                                      root, next, seed, json, false, ref,
                                      requestedPath, nextRequestedDepth,
                                      optimizedPath, nextOptimizedDepth,
                                      model, outerResults);
                    }
                }
            } while (++keyIndex < keyCount);
        }
        // if range, recursively call getPathAsJSON over each index in range
        else {
            key = keys;
            rangeIndex = (key.from || 0) - 1;
            rangeCount = (key.to || (rangeIndex + (key.length || 0))) + 1;
            while (++rangeIndex < rangeCount) {
                next = node[rangeIndex];
                requestedPath[requestedPathDepth] = rangeIndex;
                optimizedPath[optimizedPathDepth] = rangeIndex;
                getPathAsJSON(path, nextDepth, rangeIndex,
                              root, next, seed, json, false, ref,
                              requestedPath, nextRequestedDepth,
                              optimizedPath, nextOptimizedDepth,
                              model, outerResults);
            }
        }
    }

    return json;
}

function onValueType(path, depth, node, key, type, seed, json,
                     model, outer, fromRef,
                     requestedPath, optimizedPath, optimizedPathDepth) {

    if (!node || !type) {
        if (isMaterialized(model)) {
            outer.hasValue = true;
            return json && (json[key] = {$type:$atom}) || undefined;
        } else {
            return onMissing(model, path, depth, outer,
                             requestedPath, optimizedPath, optimizedPathDepth);
        }
    } else if (isExpired(node)) {
        if (!node.ツinvalidated) {
            expireNode(node, model._root.expired, model._root);
        }
        return onMissing(model, path, depth, outer,
                         requestedPath, optimizedPath, optimizedPathDepth);
    } else if (seed) {
        if (fromRef) {
            requestedPath[depth] = null;
        }
        return onValue(path, depth, node, key, type, seed, json,
                       model, outer, requestedPath);
    }
}

function onValue(path, depth, node, key, type, seed, json,
                 model, outer, requestedPath) {

    promote(model._root, node);

    if (!seed) {
        return;
    }

    if (type === $error && !model._treatErrorsAsValues) {
        return onError(model, node, depth, requestedPath, outer);
    } else {
        var value = node && node.value;
        var requiresMaterializedToReport = type && value === undefined;
        if (requiresMaterializedToReport) {
            if (model._materialized) {
                outer.hasValue = true;
                return json[key] = {$type:$atom};
            }
        } else if (model._boxed) {
            outer.hasValue = true;
            return json[key] = clone(node);
        } else {
            outer.hasValue = true;
            return json[key] = value;
        }
    }
}
