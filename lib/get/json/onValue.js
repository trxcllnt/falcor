module.exports = onValue;

var $atom = require("./../../types/atom");
var $error = require("./../../types/error");

var clone = require("./../../get/util/clone");
var promote = require("./../../lru/promote");
var onError = require("./../../get/onError");

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
