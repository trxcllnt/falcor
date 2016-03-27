var hasOwn = require("./../support/hasOwn");
var __id = require("./../internal/id");
var __innerRefs = require("./../internal/innerRefs");
var __priorRefs = require("./../internal/priorRefs");
var __refTarget = require("./../internal/refTarget");

var isArray = Array.isArray;

module.exports = function unlinkForwardReference(reference) {

    var refId = reference[__id];
    var innerRefs = reference[__innerRefs];

    if (innerRefs) {

        var refTarget = reference[__refTarget];
        var refTargetList = isArray(refTarget);
        var i = 0, n = refTargetList && refTarget.length || 0;

        do {
            var targetId = refTargetList && refTarget[i] || refTarget;
            var targetRef = innerRefs[targetId];
            var priorRefs = targetRef && targetRef[__priorRefs];

            if (priorRefs) {
                priorRefs[refId] = undefined;
            }

            if (!refTargetList) {
                break;
            }
        } while (++i < n);
    }

    reference[__innerRefs] = undefined;
    reference[__refTarget] = undefined;

    return reference;
}
