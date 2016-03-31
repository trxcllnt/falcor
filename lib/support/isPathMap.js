var isArray = Array.isArray;
var isObject = require("./../support/isObject");

module.exports = function isPathMap(pathMap) {
    return isObject(pathMap) && isArray(pathMap.$keys);
};
