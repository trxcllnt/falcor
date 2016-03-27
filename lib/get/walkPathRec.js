module.exports = walkPathRec;

// var $ref = require("./../types/ref");
// var __ref = require("./../internal/ref");
// var $error = require("./../types/error");
// var promote = require("./../lru/promote");
// var $refset = require("./../types/refset");
// var onError = require("./onError");
// var onMissing = require("./onMissing");
// var isExpired = require("./util/isExpired");
// var expireNode = require("./../support/expireNode");
// var isMaterialized = require("./util/isMaterialzed");
// var createHardlink = require("./../support/createHardlink");
// var iterateKeySet = require("falcor-path-utils").iterateKeySet;

var isArray = Array.isArray;
var clone = require("./util/clone");
var isMaterialized = require("./util/isMaterialzed");

function walkPathRec(model, root, curr, path, depth, seed,
                     outerResults, branchInfo, requestedPath,
                     optimizedPathArg, optimizedLength, isJSONG,
                     fromReferenceArg, referenceContainerArg) {

    var errors = model._treatErrorsAsValues || isJSONG ?
        null : outerResults.errors || (outerResults.errors = []);
    var local = isMaterialized(model);
    var result = get$(
        root, curr, path, local,
        model._boxed, model._materialized, errors);
    var missingRelPaths = result.missingRelPaths;
    var missingAbsPaths = result.missingAbsPaths;

    if (seed) {
        seed.json = result.json;
    }

    if (missingRelPaths.length) {
        var requestedMissingPaths = outerResults.requestedMissingPaths || (
            outerResults.requestedMissingPaths = []);
        requestedMissingPaths.push.apply(requestedMissingPaths, missingRelPaths);
    }
    if (missingAbsPaths.length) {
        var optimizedMissingPaths = outerResults.optimizedMissingPaths || (
            outerResults.optimizedMissingPaths = []);
        optimizedMissingPaths.push.apply(optimizedMissingPaths, missingAbsPaths);
    }
}


function get$(cache, parent, pathSet, local, boxed, materialize, errors) {
    var missingAbsPaths = [];
    var missingRelPaths = [];
    var result = {
        json: getPath(cache, parent, pathSet, 0, [], [], missingAbsPaths, missingRelPaths, local, boxed, materialize, errors),
        missingAbsPaths: missingAbsPaths,
        missingRelPaths: missingRelPaths
    };
    return result;
}

function getPath(
      // root of the cache and the currentNode we're evaluating path against
      root, curNode,
      // pathSet being evaluated and the index of where we are in pathSet
      pathSet, pathSetIndex,
      // the absolute path and relative path we've already evaluated
      absPathSoFar, relPathSoFar,
      // collection of missing absolute and relative paths
      missingAbsPaths, missingRelPaths,
      // modes that control how JSON data is delivered
      local, boxed, materialize, errors) {

   var pathSetLength = pathSet.length;

   // ============ Check for base cases ================

   // if nothing found in cache, add paths to set of abs and rel missing paths
    if (curNode === undefined) {
        if (local) {
            return { $type: "atom" };
        }
        var restOfKeys = pathSet.slice(pathSetIndex + 1);
        absPathSoFar.push.apply(absPathSoFar, restOfKeys);
        missingAbsPaths[missingAbsPaths.length] = absPathSoFar;

        if (missingRelPaths !== undefined) {
            relPathSoFar.push.apply(relPathSoFar, restOfKeys);
            missingRelPaths[missingRelPaths.length] = relPathSoFar;
        }
        return curNode;
    }

   // if atom or error JSON Graph primitive found, short curcuit
   var type = curNode.$type;
   if (type === "atom") {
      return boxed || materialize ? clone(curNode) : curNode.value;
   } else if (type === "error") {
      var error = boxed || materialize ? clone(curNode) : curNode.value;
      // if errors are being collected outside of JSON message...
      if (errors) {
         // add error to errors collection and place undefined in message
         errors[errors.length] = error;
         return undefined;
      }
      else {
         return error;
      }
   } else if (pathSetIndex === pathSetLength) {
      if (type) {
         return materialize ? clone(curNode) : curNode.value;
      }
      else {
         throw new Error("Illegal attempt to retrieve non-primitive value.");
      }
   }

   // if ref JSON Graph primitive found, in-line the target of the reference
   // and continue evaluating path.
   if (type === "ref") {
      var refPath = curNode.value;
      var refTarget =
         getRefTarget(
            root, root,
            refPath, 0, // <- evaluate reference path
            [], // <- absPathSoFar resets to root []
            pathSet, pathSetIndex,
            missingAbsPaths,
            materialize, errors);

      return getPath(
         root, refTarget,
         pathSet, pathSetIndex,
         refPath.slice(), relPathSoFar, // <- absPathSoFar is ref path now
         missingAbsPaths, missingRelPaths,
         local, boxed, materialize, errors);
   }
   // curNode will only be an Array if getRefTarget encountered a pathSet in
   // a ref or a refset and consequently returned a nodeset. For example
   // getRefTarget($ref(["lists",[52,99]])) produces
   // [ cache["lists"][52], cache["lists"][99] ]. When getPath
   // is called on this output, it has to replace each ref target in the
   // array with the result of evaluating the rest of path on the target.
   else if (type === "nodeset") {
      var keySet = curNode.$key;
      var hasMissingValue = curNode.$hasMissingValue;

      // If a nodeset contains a single missing value, the rest of the
      // relative path is considered missing. The getRefTarget method
      // has already added the absolute paths of the missing nodes to
      // missingAbsPaths array by this point. The only thing that
      // getPath has to do is ensure that relativePath only gets added
      // to missingRelPaths once - not once for every node in the
      // nodeset. To that end, we set the missingRelPaths to undefined
      // if any of the reftargets in the nodeset are undefined. This
      // will prevent any of the getPath calls performed on the ref
      // targets from adding the relativePath to the missingRelPaths
      // array. After call getPath on each refTarget we add the
      // relative missing path _once_, at the bottom of the loop.
      var missingChildRelPaths = hasMissingValue ? undefined : missingRelPaths;

      if (isArray(keySet)) {
         for (var keySetIndex = 0, keySetLength = keySet.length; keySetIndex < keySetLength; keySetIndex++) {
            var keyOrRange = keySet[keySetIndex];
            if (typeof keyOrRange === 'object') {
               var range = keyOrRange;
               var from = range.from || 0;
               var to = range.to;
               to = to == null ? from + range.length - 1 : to;
               for (var rangeIndex = from; rangeIndex <= to; rangeIndex++) {
                  var childNode = curNode[rangeIndex];

                  if (childNode !== undefined) {
                     getPath(
                        // evaluate the rest of the path, starting with the ref target
                        root, childNode,
                        pathSet, pathSetIndex,
                        // append pathSetIndex within
                        absPathSoFar.concat(rangeIndex), relPathSoFar.concat(rangeIndex),
                        missingAbsPaths, missingChildRelPaths,
                        local, boxed, materialize, errors);
                  }
               }
            } else {
               var childNode = curNode[keyOrRange];
               if (childNode !== undefined) {
                  curNode[keyOrRange] =
                     getPath(
                        // evaluate the rest of the path, starting with the ref target
                        root, childNode,
                        pathSet, pathSetIndex,
                        // append pathSetIndex within
                        absPathSoFar.concat(keyOrRange), relPathSoFar.concat(keyOrRange),
                        missingAbsPaths, missingChildRelPaths,
                        local, boxed, materialize, errors);
               }
            }
         }
      }
      // if not keyset it must be a range
      else {
         var range = keySet;
         var from = range.from || 0;
         var to = range.to;
         to = to == null ? from + range.length - 1 : to;
         for (var rangeIndex = from; rangeIndex <= to; rangeIndex++) {
            var childNode = curNode[rangeIndex];

            if (childNode !== undefined) {
               curNode[rangeIndex] =
                  getPath(
                     // evaluate the rest of the path, starting with the ref target
                     root, childNode,
                     pathSet, pathSetIndex,
                     // append pathSetIndex within
                     absPathSoFar.concat(rangeIndex), relPathSoFar.concat(rangeIndex),
                     missingAbsPaths, missingChildRelPaths,
                     local, boxed, materialize, errors);
            }
         }
      }

      // if nodeset contains one missing value, add relative path to
      // relMissingPaths once.
      if (hasMissingValue && missingRelPaths) {
         var restOfKeys = pathSet.slice(pathSetIndex);
         relPathSoFar.push.apply(relPathSoFar, restOfKeys);
         missingRelPaths[missingRelPaths.length] = relPathSoFar;
      }

      return curNode;
   }

   // ============= Is Path Key null, a Key Set, a Range, or a primitive key?   ===================
   var key = pathSet[pathSetIndex];

   // A null key can only appear at the end of a path. It's only useful for
   // indicating that the target of ref should be returned rather than the
   // ref itself. Inserting null at the end of path lengthens the path and
   // ensures we follow the ref before hitting the end condition above
   // (exit when pathIndex === pathSetLength).
   if (key == null) {
      if (pathSetIndex === pathSetLength - 1) {
         return getPath(
            root, curNode,
            pathSet, pathSetIndex + 1, // <- just skip to the next key in the path
            absPathSoFar, relPathSoFar,
            missingAbsPaths, missingRelPaths,
            local, boxed, materialize, errors);
      } else {
         throw new Error("Unexpected null key found before last pathSetIndex of pathSet: " + JSON.stringify(pathSet));
      }
   }
   // If key is a Key Set, recursively call getPath over each key inside the key set
    else if (isArray(key)) {
        var node = { $key: key };
        if (pathSetIndex > 0) {
            node.$__path = curNode.ツabsolutePath;
        }
        var keySet = key;
        for (var keySetIndex = 0, keySetLength = keySet.length; keySetIndex < keySetLength; keySetIndex++) {
           var keyOrRange = keySet[keySetIndex];
           if (keyOrRange == null) {
              throw new Error("Unexpected null key found in keyset: " + JSON.stringify(pathSet));
           }
           // if range found in keyset, recursively call getPath over each index in range
           else if (typeof keyOrRange === 'object') {
              var range = keyOrRange;
              var from = range.from || 0;
              var to = range.to;
              to = to == null ? from + range.length - 1 : to;
              for (var rangeIndex = from; rangeIndex <= to; rangeIndex++) {
                 node[rangeIndex] =
                    getPath(
                       root, curNode[rangeIndex], // <- evaluate pathSetIndex on curNode
                       pathSet, pathSetIndex + 1, // <- move to next key in pathSet
                       // append key to both rel and abs paths
                       absPathSoFar.concat(rangeIndex), relPathSoFar.concat(rangeIndex),
                       missingAbsPaths, missingRelPaths,
                       local, boxed, materialize, errors);
              }
           }
           // otherwise evaluate primitive key against curNode and bump pathIndex
           else {
              node[keyOrRange] =
                 getPath(
                    root, curNode[keyOrRange], // <- keyOrRange is just key
                    pathSet, pathSetIndex + 1, // <- bump pathIndex
                    absPathSoFar.concat(keyOrRange), relPathSoFar.concat(keyOrRange),
                    missingAbsPaths, missingRelPaths,
                    local, boxed, materialize, errors);
           }
        }
        return node;
    }
   // If key is a Range, recursively call getPath over each pathSetIndex
    else if (typeof key === 'object') {
        var node = { $key: key };
        if (pathSetIndex > 0) {
            node.$__path = curNode.ツabsolutePath;
        }
        var range = key;
        var from = range.from || 0;
        var to = range.to;
        to = to == null ? from + range.length - 1 : to;
        for (var rangeIndex = from; rangeIndex <= to; rangeIndex++) {
           node[rangeIndex] =
              getPath(
                 root, curNode[rangeIndex], // <- evaluate pathSetIndex on curNode
                 pathSet, pathSetIndex + 1, // <- move to next key in pathSet
                 // append key to both rel and abs paths
                 absPathSoFar.concat(rangeIndex), relPathSoFar.concat(rangeIndex),
                 missingAbsPaths, missingRelPaths,
                 local, boxed, materialize, errors);
        }
        return node;
    }
    // The key in the pathSet is just a primitive if we've reached this point.
    // We add the key to the end of the abs and rel paths, and
    // return an Object that contains the result of recursively evaluating
    // the rest of the pathSet at the primitive key.
    absPathSoFar[absPathSoFar.length] = key;
    relPathSoFar[relPathSoFar.length] = key;

    var node = {};

    if (pathSetIndex > 0) {
        node.$__path = curNode.ツabsolutePath;
    }
    node[key] =
        getPath(
            root, curNode[key],
            pathSet, pathSetIndex + 1,
            absPathSoFar, relPathSoFar,
            missingAbsPaths, missingRelPaths,
            local, boxed, materialize, errors);

    return node;
}

function getRefTarget(
      // root of the cache and the currentNode we're evaluating path against
      root, curNode,
      // pathSet being evaluated and the index of where we are in pathSet
      pathSet, pathSetIndex,
      // the absolute path we've already evaluated
      absPathSoFar,
      //
      relPathSet, relPathSetIndex,
      // collection of missing absolute paths
      missingAbsPaths) {

   var pathSetLength = pathSet.length;

   // while loop used to simulate tail recursion
   while(true) {

      // ============ Check for base cases ================

      // if nothing found in cache, add paths to set of abs and rel missing paths
      if (curNode === undefined) {
         var restOfAbsKeys = pathSet.slice(pathSetIndex);
         absPathSoFar.push.apply(absPathSoFar, restOfAbsKeys);

         var restOfRelKeys = relPathSet.slice(relPathSetIndex)
         absPathSoFar.push.apply(absPathSoFar, restOfRelKeys);

         missingAbsPaths[missingAbsPaths.length] = absPathSoFar;

         return curNode;
      }

      // if atom or error JSON Graph primitive found, or we're at end of
      // path, short-curcuit and return currentNode.
      var type = curNode.$type;
      if (type === "atom" || type === "error" || pathSetIndex === pathSetLength) {
        return curNode;
      }

      // if ref JSON Graph primitive found, grab target of the reference
      // and continue evaluating rest of ref path against it.
      if (type === "ref") {
         var refPath = curNode.value;
         var refTarget =
            getRefTarget(
               root, root,
               refPath, 0,
               [],
               relPathSet, relPathSetIndex,
               missingAbsPaths);

         return getRefTarget(
            root, refTarget,
            pathSet, pathSetIndex,
            refPath.slice(),
            relPathSet, relPathSetIndex,
            missingAbsPaths);

      }
      else if (type === "nodeset") {
         var keySet = curNode.$key;
         if (isArray(keySet)) {
            for (var keySetIndex = 0, keySetLength = keySet.length; keySetIndex < keySetLength; keySetIndex++) {
               var keyOrRange = keySet[keySetIndex];
               if (typeof keyOrRange === 'object') {
                  var range = keyOrRange;
                  var from = range.from || 0;
                  var to = range.to;
                  to = to == null ? from + range.length - 1 : to;
                  for (var rangeIndex = from; rangeIndex <= to; rangeIndex++) {
                     var childNode = curNode[rangeIndex];

                     if (childNode !== undefined) {
                        curNode[rangeIndex] =
                           getRefTarget(
                              root, childNode,
                              pathSet, pathSetIndex,
                              absPathSoFar.concat(rangeIndex),
                              relPathSet, relPathSetIndex,
                              missingAbsPaths);
                     }
                  }
               } else {
                  var childNode = curNode[keyOrRange];
                  if (childNode !== undefined) {
                     curNode[keyOrRange] =
                        getRefTarget(
                           root, childNode,
                           pathSet, pathSetIndex,
                           absPathSoFar.concat(keyOrRange),
                           relPathSet, relPathSetIndex,
                           missingAbsPaths);
                  }
               }
            }
         }
         else {
            var range = keyOrRange;
            var from = range.from || 0;
            var to = range.to;
            to = to == null ? from + range.length - 1 : to;
            for (var rangeIndex = from; rangeIndex <= to; rangeIndex++) {
               var childNode = curNode[rangeIndex];

               if (childNode !== undefined) {
                  curNode[rangeIndex] =
                     getRefTarget(
                        root, childNode,
                        pathSet, pathSetIndex,
                        absPathSoFar.concat(rangeIndex),
                        relPathSet, relPathSetIndex,
                        missingAbsPaths);
               }
            }
         }

         return curNode;
      }

      // ============= Is Path Key null, a Key Set, a Range, or a primitive key?   ===================

      var key = pathSet[pathSetIndex];
      if (key == null) {
         throw new Error("Unexpected null key found in ref value: " + JSON.stringify(pathSet));
      }
      else if (typeof key !== "object") {
         // simulate tail recursion
         // absPathSoFar.push(key);
         // return getRefTarget(root, curNode[key], pathSet, pathSetIndex + 1, absPathSoFar, missingAbsPaths);

         curNode = curNode[key];
         absPathSoFar[absPathSoFar.length] = key;
         pathSetIndex += 1;
         continue;
      }
      // curNode will only be an Array if getRefTarget encountered a pathSet in
      // a ref or a refset. For example getRefTarget($ref(["lists",[52,99]]))
      // produces [ cache["lists"][52], cache["lists"][99] ]. When getPath
      // is called on this output, it has to replace each ref target in the
      // array with the result of evaluating the rest of path on the target.
      else if (isArray(key)) {
         var node = { $type: "nodeset", $key: key };
         var nodeLength = 0;
         var keySet = key;
         var hasMissingValue = false;
         for (var keySetIndex = 0, keySetLength = keySet.length; keySetIndex < keySetLength; keySetIndex++) {
            var keyOrRange = keySet[keySetIndex];
            if (keyOrRange == null) {
               throw new Error("Unexpected null key found in keyset: " + JSON.stringify(pathSet));
            } else if (typeof keyOrRange === 'object') {
               var range = keyOrRange;
               var from = range.from || 0;
               var to = range.to;
               to = to == null ? from + range.length - 1 : to;
               for (var rangeIndex = from; rangeIndex <= to; rangeIndex++) {
                  var childNode =
                     node[nodeLength++] =
                        getRefTarget(
                           root, curNode[rangeIndex],
                           pathSet, pathSetIndex + 1,
                           absPathSoFar.concat(rangeIndex),
                           relPathSet, relPathSetIndex,
                           missingAbsPaths);

                  if (childNode === undefined) {
                     hasMissingValue = true;
                  }
               }
            } else {
               var childNode =
                  node[nodeLength++] =
                     getRefTarget(
                        root, curNode[keyOrRange],
                        pathSet, pathSetIndex + 1,
                        absPathSoFar.concat(keyOrRange),
                        relPathSet, relPathSetIndex,
                        missingAbsPaths);

               if (childNode === undefined) {
                  hasMissingValue = true;
               }
            }
         }

         if (hasMissingValue) {
            node.$hasMissingValue = hasMissingValue;
         }
         return node;
      }
      // if range
      else {
         var node = { $type: "nodeset", $key: key };
         var hasMissingValue = false;
         var range = key;
         var from = range.from || 0;
         var to = range.to;
         to = to == null ? from + range.length - 1 : to;
         for (var rangeIndex = from; rangeIndex <= to; rangeIndex++) {
            var childNode =
               node[rangeIndex] =
                  getRefTarget(
                     root, curNode[rangeIndex],
                     pathSet, pathSetIndex + 1,
                     absPathSoFar.concat(rangeIndex),
                     relPathSet, relPathSetIndex,
                     missingAbsPaths);

            if (childNode === undefined) {
               hasMissingValue = true;
            }
         }

         if (hasMissingValue) {
            node.$hasMissingValue = hasMissingValue;
         }
         return node;
      }
   }
}

