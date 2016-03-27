var __id = require("./../internal/id");
var __priorRefs = require("./../internal/priorRefs");
var createUniqueNodeId = require('./../set/createUniqueNodeId');

module.exports = function assignCrossedRefs(node, innerRefs, ref) {

    var nodeId = node[__id] || (node[__id] = createUniqueNodeId(node));

    if (innerRefs) {
        innerRefs[nodeId] = node;
    }

    if (ref) {
        var refId = ref[__id];
        var priorRefs = node[__priorRefs] || (node[__priorRefs] = {});
        priorRefs[refId] = ref;
    }
};
