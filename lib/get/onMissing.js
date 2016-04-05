module.exports = function onMissing(model, path, depth,
                                    outerResults, requestedPath,
                                    optimizedPath, optimizedLength) {

    var pathKey;
    var pathCount = path.length;
    var restPathIndex = -1;
    var restPathCount = pathCount - depth;
    var restPath = restPathCount && new Array(restPathCount) || undefined;

    while (++restPathIndex < restPathCount) {
        if (isEmptyKeySet(pathKey = path[restPathIndex + depth])) {
            return;
        }
        restPath[restPathIndex] = pathKey;
    }

    if (requestedPath) {

        var rPathCount = pathCount;
        var rPath = new Array(rPathCount);
        var rIndex = -1;
        var rCount = depth;
        while (++rIndex < rCount) {
            rPath[rIndex] = requestedPath[rIndex];
        }

        rIndex -= 1;
        restPathIndex = -1;
        rCount = rPathCount;
        while (++rIndex < rCount) {
            rPath[rIndex] = restPath[++restPathIndex];
        }

        var rPaths = outerResults.requestedMissingPaths;
        if (!rPaths) {
            outerResults.requestedMissingPaths = [rPath];
        } else {
            rPaths.push(rPath);
        }
    }

    if (optimizedPath) {

        var oPathCount = optimizedLength + (pathCount - depth);
        var oPath = new Array(oPathCount);
        var oIndex = -1;
        var oCount = optimizedLength;
        while (++oIndex < oCount) {
            oPath[oIndex] = optimizedPath[oIndex];
        }

        oIndex -= 1;
        restPathIndex = -1;
        oCount = oPathCount;
        while (++oIndex < oCount) {
            oPath[oIndex] = restPath[++restPathIndex];
        }

        var oPaths = outerResults.optimizedMissingPaths;
        if (!oPaths) {
            outerResults.optimizedMissingPaths = [oPath];
        } else {
            oPaths.push(oPath);
        }
    }
};

function isEmptyKeySet(atom) {
    var type = typeof atom;
    if (type !== "object") {
        return false;
    }

    var isArray = Array.isArray(atom);
    if (isArray && atom.length) {
        return false;
    }

    // Empty array
    else if (isArray) {
        return true;
    }

    var from = atom.from;
    var to = atom.to;
    if (from === undefined || from <= to) {
        return false;
    }

    return true;
}

/*
var support = require("./util/support");
var fastCopy = support.fastCopy;

module.exports = function onMissing(model, path, depth,
                                    outerResults, requestedPath,
                                    optimizedPath, optimizedLength) {
    var pathSlice;
    if (!outerResults.requestedMissingPaths) {
        outerResults.requestedMissingPaths = [];
        outerResults.optimizedMissingPaths = [];
    }

    if (depth < path.length) {
        // If part of path has not been traversed, we need to ensure that there
        // are no empty paths (range(1, 0) or empyt array)
        for (var i = depth; i < path.length; ++i) {
            if (isEmptyAtom(path[i])) {
                return;
            }
        }

        pathSlice = fastCopy(path, depth);
    } else {
        pathSlice = [];
    }

    concatAndInsertMissing(model, pathSlice, depth, requestedPath,
                           optimizedPath, optimizedLength, outerResults);
};

function concatAndInsertMissing(model, remainingPath, depth, requestedPath,
                                optimizedPath, optimizedLength, results) {

    // TODO: Performance.
    results.requestedMissingPaths.push(
        requestedPath.
            slice(0, depth).
            concat(remainingPath));

    results.optimizedMissingPaths.push(
        optimizedPath.slice(0, optimizedLength).concat(remainingPath));
}
*/
