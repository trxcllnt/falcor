var hasOwn = require("./../support/hasOwn");
var __id = require("./../internal/id");
var __innerRefs = require("./../internal/innerRefs");
var __priorRefs = require("./../internal/priorRefs");
var __refTarget = require("./../internal/refTarget");

var isArray = Array.isArray;

module.exports = function transferBackReferences(fromNode, destNode) {

    var fromId = fromNode[__id];
    var destId = destNode[__id];
    var fromPriorRefs = fromNode[__priorRefs];
    var destPriorRefs = destNode[__priorRefs] || (destNode[__priorRefs] = {});

    for (refId in fromPriorRefs) {

        if (!hasOwn(fromPriorRefs, refId)) {
            continue;
        }

        var ref = fromPriorRefs[refId];
        var innerRefs = ref[__innerRefs];
        var refTarget = ref[__refTarget];

        innerRefs[destId] = destNode;
        innerRefs[fromId] = undefined;

        if (refTarget === fromId) {
            ref[__refTarget] = destId;
        } else if (isArray(refTarget)) {
            var index = refTarget.indexOf(fromId);
            if (~index) {
                refTarget[index] = destId;
            }
        }

        destPriorRefs[refId] = ref;
        fromPriorRefs[refId] = undefined;
    }

    fromNode[__priorRefs] = undefined;

    return destNode;
}
