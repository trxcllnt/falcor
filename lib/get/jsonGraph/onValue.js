module.exports = onValue;

var isArray = Array.isArray;
var $atom = require("./../../types/atom");
var clone = require("./../../get/util/clone");
var promote = require("./../../lru/promote");

function onValue(path, depth, node, type, seed,
                 model, outer, optimizedPath, optimizedPathDepth) {

    promote(model._root, node);

    if (!seed) {
        return;
    }

    outer.hasValue = true;

    var value = node.value;
    var materialized = value === undefined ? model._materialized : false;

    if (type !== $atom ||
        model._boxed   || !(
        node.ツmodelCreated) || (
        value && typeof value === "object")) {
        value = clone(node);
    } else {
        value = materialized ? {$type:$atom} : value;
    }

    debugger
    insertValue(optimizedPath, -1, optimizedPathDepth, value, seed, 'jsonGraph');

    return value;
}

function insertValue(path, depth, height, value, json, keys) {

    var nextDepth = depth + 1;
    var key, isLeaf = nextDepth >= height;
    var keysIndex, keysCount, rangeIndex, rangeCount;

    if (typeof keys !== "object") {
        key = keys;
        json[key] = isLeaf ?
            value : insertValue(path, nextDepth, height, value,
                                json[key] || {}, path[nextDepth]);
    } else if (isArray(keys)) {
        keysIndex = 0;
        keysCount = keys.length;
        do {
            key = keys[keysIndex];
            if (typeof key !== "object") {
                json[key] = isLeaf ?
                    value : insertValue(path, nextDepth, height, value,
                                        json[key] || {}, path[nextDepth]);
            } else {
                rangeIndex = (key.from || 0) - 1;
                rangeCount = (key.to || (rangeIndex + (key.length || 0))) + 1;
                while (++rangeIndex < rangeCount) {
                    key = rangeIndex;
                    json[key] = isLeaf ?
                        value : insertValue(path, nextDepth, height, value,
                                            json[key] || {}, path[nextDepth]);
                }
            }
        } while (++keysIndex < keysCount);
    } else {
        rangeIndex = (keys.from || 0) - 1;
        rangeCount = (keys.to || (rangeIndex + (keys.length || 0))) + 1;
        while (++rangeIndex < rangeCount) {
            key = rangeIndex;
            json[key] = isLeaf ?
                value : insertValue(path, nextDepth, height, value,
                                    json[key] || {}, path[nextDepth]);
        }
    }
    return json;
}
