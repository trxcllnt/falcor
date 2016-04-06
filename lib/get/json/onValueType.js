module.exports = onValueType;

var $atom = require("./../../types/atom");

var onValue = require("./../../get/json/onValue");
var onMissing = require("./../../get/onMissing");
var isExpired = require("./../../get/util/isExpired");
var expireNode = require("./../../support/expireNode");
var isMaterialized = require("./../../get/util/isMaterialzed");

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
