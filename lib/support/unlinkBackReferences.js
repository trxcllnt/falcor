var hasOwn = require("./../support/hasOwn");
var __id = require("./../internal/id");
var __innerRefs = require("./../internal/innerRefs");
var __priorRefs = require("./../internal/priorRefs");
var __refTarget = require("./../internal/refTarget");

var isArray = Array.isArray;

module.exports = function unlinkBackReferences(node) {

    var nodeId = node[__id];
    var priorRefs = node[__priorRefs];

    for (var refId in priorRefs) {

        var ref = priorRefs[refId];

        if (ref) {
            priorRefs[refId] = undefined;

            var innerRefs = ref[__innerRefs];
            var refTarget = ref[__refTarget];
            innerRefs[nodeId] = undefined;

            if (refTarget === nodeId) {
                ref[__refTarget] = undefined;
            } else if (isArray(refTarget)) {
                var index = refTarget.indexOf(nodeId);
                if (~index) {
                    refTarget[index] = undefined;
                }
            }
        }
    }
    node[__priorRefs] = undefined;
    return node;
};
