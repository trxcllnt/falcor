var isObject = require("./../support/isObject");
var insertNode = require("./../support/insertNode");
var transferBackReferences = require("./../support/transferBackReferences");
var removeNodeAndDescendants = require("./../support/removeNodeAndDescendants");

module.exports = function replaceNode(node, replacement, parent, key,
                                      version, lru, optimizedPath,
                                      optimizedPathDepth) {
    if (node !== replacement && isObject(node)) {
        transferBackReferences(node, replacement);
        removeNodeAndDescendants(node, parent, key, lru);
    }
    return insertNode(replacement, parent, key, version, optimizedPath, optimizedPathDepth);
};
