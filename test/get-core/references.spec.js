var getCoreRunner = require('./../getCoreRunner');
var cacheGenerator = require('./../CacheGenerator');
var jsonGraph = require('falcor-json-graph');
var atom = jsonGraph.atom;
var ref = jsonGraph.ref;
var _ = require('lodash');

describe('References', function() {
    var referenceCache = function() {
        return {
            toReference: ref(['to', 'reference']),
            short: ref(['toShort', 'next']),
            circular: ref(['circular', 'next']),
            to: {
                reference: ref(['too']),
                toValue: ref(['too', 'title']),
                title: 'Title'
            },
            too: {
                title: 'Title'
            },
            toShort: 'Short'
        };
    };

    it('should follow a reference to reference', function() {
        var toReference = {
            title: 'Title'
        };
        toReference.$path = ['too'];

        // Should be the second references reference not
        // toReferences reference.
        getCoreRunner({
            input: [['toReference', 'title']],
            output: {
                json: {
                    toReference: toReference
                }
            },
            cache: referenceCache
        });
    });

    it('should follow a reference to value', function() {
        getCoreRunner({
            input: [['short', 'title']],
            output: {
                json: {
                    short: 'Short'
                }
            },
            cache: referenceCache
        });
    });

    xit('should never follow inner references.', function() {
        getCoreRunner({
            input: [['circular', 'title']],
            output: {
                json: {
                    circular: ['circular', 'next']
                }
            },
            cache: referenceCache
        });
    });

    it('should ensure that values are followed correctly when through references and previous paths have longer lengths to litter the requested path.', function() {
        getCoreRunner({
            input: [
                ['to', ['reference', 'toValue'], 'title'],
            ],
            output: {
                json: {
                    to: {
                        $path: ['to'],
                        $keys: ["reference", "toValue"],
                        reference: {
                            $path: ['too'],
                            title: 'Title'
                        },
                        toValue: 'Title'
                    }
                }
            },
            cache: referenceCache
        });
    });

    it('should validate that _fromWhenceYouCame does correctly pluck the paths for references.', function() {
        getCoreRunner({
            input: [
                ['lolomo', 0, 0, 'item', 'title'],
            ],
            fromWhenceYouCame: true,
            output: {
                json: {
                    lolomo: {
                        $path: ['lolomos', 1234],
                        $refPath: ['lolomos', 1234],
                        $toReference: ['lolomo'],
                        0: {
                            $path: ['lists', 'A'],
                            $refPath: ['lists', 'A'],
                            $toReference: ['lolomos', 1234, 0],
                            0: {
                                $path: ['lists', 'A', 0],
                                $refPath: ['lists', 'A'],
                                $toReference: ['lolomos', 1234, 0],
                                item: {
                                    $path: ['videos', 0],
                                    $refPath: ['videos', 0],
                                    $toReference: ['lists', 'A', 0, 'item'],
                                    title: 'Video 0'
                                }
                            }
                        }
                    }
                }
            },
            cache: cacheGenerator(0, 1)
        });
    });
});

