var getCoreRunner = require('./../getCoreRunner');
var cacheGenerator = require('./../CacheGenerator');
var jsonGraph = require('falcor-json-graph');
var atom = jsonGraph.atom;
var ref = jsonGraph.ref;
var _ = require('lodash');

describe('Complex references', function() {
    var refsCache = function() {
        return {
            'to-foos': ref(['foos']),
            'to-bars': ref(['bars']),
            'to-both': ref(['both']),
            'to-both-refs': ref([['to-foos', 'to-bars']]),
            'foos': ref(['things', ['a', 'b']]),
            'bars': ref(['things', ['c', 'd']]),
            'both': ref([['foos', 'bars']]),
            'things': {
                a: { name: atom('a'), type: atom('foo') },
                b: { name: atom('b'), type: atom('foo') },
                c: { name: atom('c'), type: atom('bar') },
                d: { name: atom('d'), type: atom('bar') },
            }
        };
    };

    it('should get values through a complex reference.', function() {
        getCoreRunner({
            input: [['foos', 'name']],
            output: {
                json: {
                    foos: {
                        $type: 'nodeset',
                        $keys: ['a','b'],
                        $path: ['things'],
                        a: { $path: ['things', 'a'], name: 'a' },
                        b: { $path: ['things', 'b'], name: 'b' }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get values through a complex reference with a complex path.', function() {
        getCoreRunner({
            input: [[['foos', 'bars'], 'name']],
            output: {
                json: {
                    $keys: ['foos', 'bars'],
                    foos: {
                        $type: 'nodeset',
                        $keys: ['a','b'],
                        $path: ['things'],
                        a: { $path: ['things', 'a'], name: 'a' },
                        b: { $path: ['things', 'b'], name: 'b' }
                    },
                    bars: {
                        $type: 'nodeset',
                        $keys: ['c','d'],
                        $path: ['things'],
                        c: { $path: ['things', 'c'], name: 'c' },
                        d: { $path: ['things', 'd'], name: 'd' }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get values through a reference that points to a complex reference.', function() {
        getCoreRunner({
            input: [['to-foos', 'name']],
            output: {
                json: {
                    'to-foos': {
                        $keys: ['a','b'],
                        $type: 'nodeset',
                        $path: ['things'],
                        a: { $path: ['things', 'a'], name: 'a' },
                        b: { $path: ['things', 'b'], name: 'b' }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get values through references that points to complex references with a complex path.', function() {
        getCoreRunner({
            input: [[['to-foos', 'to-bars'], 'name']],
            output: {
                json: {
                    $keys: ['to-foos','to-bars'],
                    'to-foos': {
                        $type: 'nodeset',
                        $keys: ['a','b'],
                        $path: ['things'],
                        a: { $path: ['things', 'a'], name: 'a' },
                        b: { $path: ['things', 'b'], name: 'b' }
                    },
                    'to-bars': {
                        $type: 'nodeset',
                        $keys: ['c','d'],
                        $path: ['things'],
                        c: { $path: ['things', 'c'], name: 'c' },
                        d: { $path: ['things', 'd'], name: 'd' }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get values through a complex reference that points to multiple complex references.', function() {
        getCoreRunner({
            input: [['both', 'name']],
            output: {
                json: {
                    both: {
                        $keys: ['foos','bars'],
                        $type: 'nodeset',
                        foos: {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        },
                        bars: {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get values through a reference that points to a complex reference that points to other complex references.', function() {
        getCoreRunner({
            input: [['to-both', 'name']],
            output: {
                json: {
                    'to-both': {
                        $keys: ['foos','bars'],
                        $type: 'nodeset',
                        foos: {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        },
                        bars: {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get values through a complex reference that points to references that each point to a complex reference.', function() {
        getCoreRunner({
            input: [['to-both-refs', 'name']],
            output: {
                json: {
                    'to-both-refs': {
                        $type: 'nodeset',
                        $keys: ['to-foos','to-bars'],
                        'to-foos': {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        },
                        'to-bars': {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get values through references, complex references, references that point to complex references, complex references that point to references, and more, via complex paths.', function() {
        getCoreRunner({
            input: [[['to-both-refs', 'to-both', 'both'], 'name']],
            output: {
                json: {
                    $keys: ['to-both-refs', 'to-both', 'both'],
                    'to-both-refs': {
                        $type: 'nodeset',
                        $keys: ['to-foos','to-bars'],
                        'to-foos': {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        },
                        'to-bars': {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        }
                    },
                    'to-both': {
                        $type: 'nodeset',
                        $keys: ['foos','bars'],
                        foos: {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        },
                        bars: {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        }
                    },
                    both: {
                        $type: 'nodeset',
                        $keys: ['foos','bars'],
                        foos: {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        },
                        bars: {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        }
                    }
                }
            },
            cache: refsCache()
        });
    });
});
