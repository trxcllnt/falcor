var hasOwn = require("./../support/hasOwn");
var __id = require("./../internal/id");
var __innerRefs = require("./../internal/innerRefs");
var __priorRefs = require("./../internal/priorRefs");
var __refTarget = require("./../internal/refTarget");
var __priorRefsContainer = require("./../internal/priorRefsContainer");

var isArray = Array.isArray;

module.exports = function unlinkBackReferences(node) {

    var nodeId = node[__id];
    var priorRefs = node[__priorRefs];
    var priorRefsContainer;

    for (var refId in priorRefs) {

        if (!hasOwn(priorRefs, refId)) {
            continue;
        }

        var ref = priorRefs[refId];

        if (ref) {
            priorRefs[refId] = undefined;

            var innerRefs = ref[__innerRefs];
            var refTarget = ref[__refTarget];
            innerRefs[nodeId] = undefined;

            if (!refTarget) {
                continue;
            } else if (refTarget === nodeId) {
                ref[__refTarget] = undefined;
            } else if (
                priorRefsContainer || (
                priorRefsContainer = node[__priorRefsContainer])) {
                var refTargetContainer = priorRefsContainer[refId];
                var index = refTargetContainer.indexOf(nodeId);
                if (~index) {
                    refTargetContainer[index] = undefined;
                }
            }
        }
    }
    node[__priorRefs] = undefined;
    node[__priorRefsContainer] = undefined;
    return node;
};
