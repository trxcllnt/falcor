var getCoreRunner = require('./../getCoreRunner');
var cacheGenerator = require('./../CacheGenerator');
var jsonGraph = require('falcor-json-graph');
var atom = jsonGraph.atom;
var ref = jsonGraph.ref;
var _ = require('lodash');

describe('Reference Sets', function() {
    var refsetCache = function() {
        return {
            'to-foos': ref(['foos']),
            'to-bars': ref(['bars']),
            'to-both': ref(['both']),
            'to-both-refs': {
                $type: 'refset',
                value: [['to-foos', 'to-bars']],
            },
            foos: {
                $type: 'refset',
                value: ['things', ['a', 'b']]
            },
            bars: {
                $type: 'refset',
                value: ['things', ['c', 'd']]
            },
            both: {
                $type: 'refset',
                value: [['foos', 'bars']]
            },
            things: {
                a: { name: atom('a'), type: atom('foo') },
                b: { name: atom('b'), type: atom('foo') },
                c: { name: atom('c'), type: atom('bar') },
                d: { name: atom('d'), type: atom('bar') },
            }
        };
    };

    it('should get values through a refset.', function() {
        getCoreRunner({
            input: [['foos', 'name']],
            output: {
                json: {
                    foos: {
                        a: { name: 'a' },
                        b: { name: 'b' }
                    }
                }
            },
            cache: refsetCache()
        });
    });

    it('should get values through a refset with a complex path.', function() {
        getCoreRunner({
            input: [[['foos', 'bars'], 'name']],
            output: {
                json: {
                    foos: {
                        a: { name: 'a' },
                        b: { name: 'b' }
                    },
                    bars: {
                        c: { name: 'c' },
                        d: { name: 'd' }
                    }
                }
            },
            cache: refsetCache()
        });
    });

    it('should get values through a reference that points to a refset.', function() {
        getCoreRunner({
            input: [['to-foos', 'name']],
            output: {
                json: {
                    'to-foos': {
                        a: { name: 'a' },
                        b: { name: 'b' }
                    }
                }
            },
            cache: refsetCache()
        });
    });

    it('should get values through references that points to refsets with a complex path.', function() {
        getCoreRunner({
            input: [[['to-foos', 'to-bars'], 'name']],
            output: {
                json: {
                    'to-foos': {
                        a: { name: 'a' },
                        b: { name: 'b' }
                    },
                    'to-bars': {
                        c: { name: 'c' },
                        d: { name: 'd' }
                    }
                }
            },
            cache: refsetCache()
        });
    });

    it('should get values through a refset that points to multiple refsets.', function() {
        getCoreRunner({
            input: [['both', 'name']],
            output: {
                json: {
                    both: {
                        foos: {
                            a: { name: 'a' },
                            b: { name: 'b' }
                        },
                        bars: {
                            c: { name: 'c' },
                            d: { name: 'd' }
                        }
                    }
                }
            },
            cache: refsetCache()
        });
    });

    it('should get values through a reference that points to a refset that points to other refsets.', function() {
        getCoreRunner({
            input: [['to-both', 'name']],
            output: {
                json: {
                    'to-both': {
                        foos: {
                            a: { name: 'a' },
                            b: { name: 'b' }
                        },
                        bars: {
                            c: { name: 'c' },
                            d: { name: 'd' }
                        }
                    }
                }
            },
            cache: refsetCache()
        });
    });

    it('should get values through a refset that points to references that each point to a refset.', function() {
        getCoreRunner({
            input: [['to-both-refs', 'name']],
            output: {
                json: {
                    'to-both-refs': {
                        'to-foos': {
                            a: { name: 'a' },
                            b: { name: 'b' }
                        },
                        'to-bars': {
                            c: { name: 'c' },
                            d: { name: 'd' }
                        }
                    }
                }
            },
            cache: refsetCache()
        });
    });

    it('should get values through refs, refsets, refs that point to refsets, refsets that point to refs, and more, via complex paths.', function() {
        getCoreRunner({
            input: [[['to-both-refs', 'to-both', 'both'], 'name']],
            output: {
                json: {
                    'to-both-refs': {
                        'to-foos': {
                            a: { name: 'a' },
                            b: { name: 'b' }
                        },
                        'to-bars': {
                            c: { name: 'c' },
                            d: { name: 'd' }
                        }
                    },
                    'to-both': {
                        foos: {
                            a: { name: 'a' },
                            b: { name: 'b' }
                        },
                        bars: {
                            c: { name: 'c' },
                            d: { name: 'd' }
                        }
                    },
                    both: {
                        foos: {
                            a: { name: 'a' },
                            b: { name: 'b' }
                        },
                        bars: {
                            c: { name: 'c' },
                            d: { name: 'd' }
                        }
                    }
                }
            },
            cache: refsetCache()
        });
    });
});
