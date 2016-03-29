var __id = require("./../internal/id");
var __innerRefs = require("./../internal/innerRefs");
var __priorRefs = require("./../internal/priorRefs");
var __refTarget = require("./../internal/refTarget");
var __priorRefsContainer = require("./../internal/priorRefsContainer");

module.exports = function unlinkForwardReference(reference) {

    var refId = reference[__id];
    var innerRefs = reference[__innerRefs];

    if (innerRefs) {
        unlinkRefTarget(refId, reference[__refTarget], innerRefs);
    }

    reference[__innerRefs] = undefined;
    reference[__refTarget] = undefined;

    return reference;
};

function unlinkRefTarget(refId, refTarget, innerRefs) {
    var targetRef, priorRefs, priorRefsContainer;
    if (!refTarget) {
        return;
    } else if (typeof refTarget === 'string') {
        if (targetRef = innerRefs[refTarget]) {
            if (priorRefs = targetRef[__priorRefs]) {
                priorRefs[refId] = undefined;
            }
            if (priorRefsContainer = targetRef[__priorRefsContainer]) {
                priorRefsContainer[refId] = undefined;
            }
        }
    } else {
        var refTargetIndex = -1;
        var refTargetCount = refTarget.length;
        while (++refTargetIndex < refTargetCount) {
            unlinkRefTarget(refId, refTarget[refTargetIndex], innerRefs);
        }
    }
}
