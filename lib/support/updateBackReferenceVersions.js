var hasOwn = require("./../support/hasOwn");
var __priorRefs = require("./../internal/priorRefs");

module.exports = function updateBackReferenceVersions(nodeArg, version) {
    var stack = [nodeArg];
    var count = 0;
    do {
        var node = stack[count];
        if (node && node.ツversion !== version) {
            node.ツversion = version;
            stack[count++] = node.ツparent;
            var priorRefs = node[__priorRefs];
            for (var refId in priorRefs) {
                if (!hasOwn(priorRefs, refId)) {
                    continue;
                }
                stack[count++] = priorRefs[refId];
            }
        }
    } while (--count > -1);
    return nodeArg;
}
