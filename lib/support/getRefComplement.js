var __innerRefs = require("./../internal/innerRefs");
var __refTarget = require("./../internal/refTarget");
var iterateKeySet = require("falcor-path-utils").iterateKeySet;

module.exports = function getRefComplement(node, refs) {

    var path = node.value;
    var innerRefs = node[__innerRefs];

    if (!innerRefs) {
        return path;
    }

    var missing = [];
    var refTarget = node[__refTarget];

    if (!getRefsOrMissing(refTarget, innerRefs, refs, missing)) {
        return path;
    } else if (missing.length) {
        return complementMissing(path, missing);
    } else {
        return undefined;
    }
};

function getRefsOrMissing(refTarget, innerRefs, refs, missing) {
    var targetRef, refsIndex;
    if (!refTarget) {
        return false;
    } else if (typeof refTarget === 'string') {
        if (targetRef = innerRefs[refTarget]) {
            refsIndex = refs.length;
            refs[refsIndex] = targetRef;
            refs[refsIndex + 1] = targetRef.ツparent;
            refs[refsIndex + 2] = innerRefs;
            refs[refsIndex + 3] = targetRef.ツabsolutePath.slice(0);
            return true;
        }
        return false;
    } else {
        var refTargetIndex = -1;
        var refTargetCount = refTarget.length;
        while (++refTargetIndex < refTargetCount) {
            if (!getRefsOrMissing(refTarget[refTargetIndex], innerRefs, refs, missing)) {
                refTarget[refTargetIndex] = undefined;
                missing[missing.length] = refs.length / 4;
            }
        }
        return true;
    }
}

function complementMissing(path, missing) {

    var comp = [];
    var notes = [];
    var total = path.length;
    var totalMinusOne = total - 1;

    var pathIndex = 0;
    var missingIndex = 0;
    var missingCount = missing.length;
    var lastPathIndex = missing[missingCount - 1];

    do {
        var compIndex = missing[missingIndex];

        for (var depth = 0; depth < total; ++depth) {

            var note = notes[depth] || (notes[depth] = {});
            var key  = iterateKeySet(path[depth], note);

            if (pathIndex === compIndex) {
                var compKey = comp[depth];
                var typeofCompKey = typeof compKey;
                if (typeofCompKey === 'undefined') {
                    comp[depth] = key;
                } else if (typeofCompKey === 'string') {
                    if (key !== compKey) {
                        comp[depth] = [compKey, key];
                    }
                } else {
                    compKey[compKey.length] = key;
                }
            }

            if (note.done) {
                note.isArray = void 0;
            }
        }
        missingIndex += Number(pathIndex === compIndex);
    } while (missingIndex < missingCount && ++pathIndex <= lastPathIndex);

    return comp;
}
