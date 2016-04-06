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

    var key = 'jsonGraph',
        json = seed, index = -1;

    while (++index < optimizedPathDepth) {
        json = json[key] || (json[key] = {});
        key = optimizedPath[index];
    }

    json[key] = value;

    return value;
}
