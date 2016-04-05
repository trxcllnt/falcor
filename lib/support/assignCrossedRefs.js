var __id = require("./../internal/id");
var __priorRefs = require("./../internal/priorRefs");
var createUniqueNodeId = require('./../support/createUniqueNodeId');

module.exports = function assignCrossedRefs(crossedRef, innerRefs, fromRef, lru, promote) {

    promote && promote(lru, crossedRef);

    var crossedRefId = crossedRef[__id] || (crossedRef[__id] = createUniqueNodeId(crossedRef));

    if (innerRefs) {
        innerRefs[crossedRefId] = crossedRef;
    }

    if (fromRef) {
        var fromRefId = fromRef[__id];
        var priorRefs = crossedRef[__priorRefs] || (crossedRef[__priorRefs] = {});
        priorRefs[fromRefId] = fromRef;
    }
};
