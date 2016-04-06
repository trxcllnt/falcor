module.exports = onValueType;

var $atom = require("./../../types/atom");

var onValue = require("./../../get/jsonGraph/onValue");
var onMissing = require("./../../get/onMissing");
var isExpired = require("./../../get/util/isExpired");
var expireNode = require("./../../support/expireNode");
var isMaterialized = require("./../../get/util/isMaterialzed");

function onValueType(path, depth, node, type, seed,
                     model, outer, fromRef,
                     requestedPath, optimizedPath, optimizedPathDepth) {

    if (!node || !type) {
        if (isMaterialized(model)) {
            outer.hasValue = true;
            return onValue(path, depth, {$type:$atom}, type, seed,
                           model, outer, optimizedPath, optimizedPathDepth);
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
        var paths = seed.paths;
        if (!paths) {
            seed.paths = [requestedPath.slice(0, depth)];
        } else {
            paths.push(requestedPath.slice(0, depth));
        }
        return onValue(path, depth, node, type, seed,
                       model, outer, optimizedPath, optimizedPathDepth);
    }
}
