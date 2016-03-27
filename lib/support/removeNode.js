var $ref = require("./../types/ref");
var splice = require("./../lru/splice");
var $refset = require("./../types/refset");
var isObject = require("./../support/isObject");
var unlinkBackReferences = require("./../support/unlinkBackReferences");
var unlinkForwardReference = require("./../support/unlinkForwardReference");

module.exports = function removeNode(node, parent, key, lru) {
    if (isObject(node)) {
        var type = node.$type;
        if (Boolean(type)) {
            if (type === $ref || type === $refset) {
                unlinkForwardReference(node);
            }
            splice(lru, node);
        }
        unlinkBackReferences(node);
        parent[key] = node.ツparent = void 0;
        return true;
    }
    return false;
};
