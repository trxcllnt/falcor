var __id = require("./../internal/id");
var __innerRefs = require("./../internal/innerRefs");
var __priorRefs = require("./../internal/priorRefs");
var createUniqueNodeId = require('./../support/createUniqueNodeId');
var __priorRefsContainer = require("./../internal/priorRefsContainer");

module.exports = function assignRefTargets(node, nodeKey, innerRefs, ref, refTarget) {

    var refId = ref[__id];
    var nodeId = node[__id] || (node[__id] = createUniqueNodeId(node));
    var priorRefs = node[__priorRefs] || (node[__priorRefs] = {});

    refTarget[nodeKey] = nodeId;

    priorRefs[refId] = ref;
    innerRefs[nodeId] = node;
    ref[__innerRefs] = innerRefs;
};
