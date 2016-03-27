var get = require("./get");
var walkPath = require("./walkPath");
var walkPathRec = require("./walkPathRec");

var getWithPathsAsPathMap = get(walkPathRec, false);
var getWithPathsAsJSONGraph = get(walkPath, true);

module.exports = {
    getValueSync: require("./../get/getValueSync"),
    getBoundValue: require("./../get/getBoundValue"),
    getWithPathsAsPathMap: getWithPathsAsPathMap,
    getWithPathsAsJSONGraph: getWithPathsAsJSONGraph
};
