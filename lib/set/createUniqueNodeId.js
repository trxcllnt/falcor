var globalCount = 0;
module.exports = function createUniqueNodeId(node) {
    return node.ツkey + '~' + globalCount++;
};
