module.exports = function insertNode(node, parent, key, version, optimizedPath, optimizedPathDepth) {
    node.ツkey = key;
    node.ツparent = parent;

    if (version !== undefined) {
        node.ツversion = version;
    }
    if (!node.ツabsolutePath) {
        node.ツabsolutePath = optimizedPath.slice(0, optimizedPathDepth + 1);
    }

    parent[key] = node;

    return node;
};
