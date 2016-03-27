var promote = require("./../lru/promote");
var __innerRefs = require("./../internal/innerRefs");
var __refTarget = require("./../internal/refTarget");
var iterateKeySet = require("falcor-path-utils").iterateKeySet;

module.exports = function getRefComplement(node, refs, lru) {

    promote(lru, node);

    var path = node.value;
    var innerRefs = node[__innerRefs];

    if (!innerRefs) {
        return path;
    }

    var target = node[__refTarget];

    if (!target) {
        return path;
    }

    var refsIndex = refs.length;

    if (typeof target === 'string') {
        if (!(target = innerRefs[target])) {
            return path;
        }
        refs[refsIndex] = target;
        refs[refsIndex + 1] = target.ツparent;
        refs[refsIndex + 2] = innerRefs;
        refs[refsIndex + 3] = target.ツabsolutePath.slice(0);
        return undefined;
    }

    var missing = [];
    var targets = target;
    var missingCount = 0;
    var targetsIndex = 0;
    var targetsCount = targets.length;

    do {
        target = targets[targetsIndex];
        if (!(target = innerRefs[target])) {
            targets[targetsIndex] = undefined;
            missing[missingCount++] = targetsIndex;
        } else {
            refs[refsIndex] = target;
            refs[refsIndex + 1] = target.ツparent;
            refs[refsIndex + 2] = innerRefs;
            refs[refsIndex + 3] = target.ツabsolutePath.slice(0);
            refsIndex += 4;
        }
    } while (++targetsIndex < targetsCount);

    if (missingCount === 0) {
        return undefined;
    }

    return complementMissing(path, missing);
};

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
