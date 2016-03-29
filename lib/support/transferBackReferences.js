var hasOwn = require("./../support/hasOwn");
var __id = require("./../internal/id");
var __innerRefs = require("./../internal/innerRefs");
var __priorRefs = require("./../internal/priorRefs");
var __refTarget = require("./../internal/refTarget");
var createUniqueNodeId = require('./../set/createUniqueNodeId');
var __priorRefsContainer = require("./../internal/priorRefsContainer");

module.exports = function transferBackReferences(fromNode, destNode) {

    var fromId = fromNode[__id];
    var destId = destNode[__id] || (
        destNode[__id] = createUniqueNodeId(destNode));
    var fromPriorRefs = fromNode[__priorRefs];
    var destPriorRefs, fromPriorRefsContainer, destPriorRefsContainer;

    for (refId in fromPriorRefs) {

        if (!hasOwn(fromPriorRefs, refId)) {
            continue;
        }

        var ref = fromPriorRefs[refId];
        var innerRefs = ref[__innerRefs];
        var refTarget = ref[__refTarget];

        innerRefs[destId] = destNode;
        innerRefs[fromId] = undefined;

        fromPriorRefs[refId] = undefined;
        destPriorRefs = destPriorRefs || (
                destNode[__priorRefs] || (
                    destNode[__priorRefs] = {}));
        destPriorRefs[refId] = ref;

        if (!refTarget) {
            continue;
        } else if (refTarget === fromId) {
            ref[__refTarget] = destId;
        } else if (fromPriorRefsContainer || (
            fromPriorRefsContainer = fromNode[__priorRefsContainer])) {
            var refTargetContainer = fromPriorRefsContainer[refId];
            var index = refTargetContainer.indexOf(fromId);
            if (~index) {
                refTargetContainer[index] = destId;
            }
            destPriorRefsContainer = destPriorRefsContainer || (
                             destNode[__priorRefsContainer] || (
                                destNode[__priorRefsContainer] = {}));
            destPriorRefsContainer[refId] = refTargetContainer;
        }
    }

    fromNode[__priorRefs] = undefined;
    fromNode[__priorRefsContainer] = undefined;

    return destNode;
}
