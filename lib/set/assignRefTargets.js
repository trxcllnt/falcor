var __id = require("./../internal/id");
var __innerRefs = require("./../internal/innerRefs");
var __priorRefs = require("./../internal/priorRefs");
var __refTarget = require("./../internal/refTarget");
var createUniqueNodeId = require('./../set/createUniqueNodeId');
var __priorRefsContainer = require("./../internal/priorRefsContainer");

module.exports = function assignRefTargets(node, innerRefs, ref, refTarget) {

    var refId = ref[__id];
    var nodeId = node[__id] || (node[__id] = createUniqueNodeId(node));
    var priorRefs = node[__priorRefs] || (node[__priorRefs] = {});

    refTarget = refTarget || ref[__refTarget];

    if (refTarget === undefined) {
        ref[__refTarget] = nodeId;
    } else if (typeof refTarget === 'string') {
        if (refTarget !== nodeId) {
            ref[__refTarget] = [refTarget, nodeId];
        }
    } else {
        var targetIndex = 0;
        var targetCount = refTarget.length;
        var priorRefsContainer = node[__priorRefsContainer] || (
            node[__priorRefsContainer] = {});
        do {
            if (refTarget[targetIndex] === undefined) {
                refTarget[targetIndex] = nodeId;
                priorRefsContainer[refId] = refTarget;
                break;
            }
        } while (++targetIndex <= targetCount);
    }

    priorRefs[refId] = ref;
    innerRefs[nodeId] = node;
    ref[__innerRefs] = innerRefs;
};
