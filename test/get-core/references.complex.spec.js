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
            'to-both-refs': ref([['to-bars', 'to-foos']]),
            'foos': ref(['things', ['a', 'b']]),
            'bars': ref(['things', ['c', 'd']]),
            'both': ref([['bars', 'foos']]),
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
            input: [[['bars', 'foos'], 'name']],
            output: {
                json: {
                    $keys: ['bars', 'foos'],
                    bars: {
                        $type: 'nodeset',
                        $keys: ['c','d'],
                        $path: ['things'],
                        c: { $path: ['things', 'c'], name: 'c' },
                        d: { $path: ['things', 'd'], name: 'd' }
                    },
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
            input: [[['to-bars', 'to-foos'], 'name']],
            output: {
                json: {
                    $keys: ['to-bars', 'to-foos'],
                    'to-bars': {
                        $type: 'nodeset',
                        $keys: ['c','d'],
                        $path: ['things'],
                        c: { $path: ['things', 'c'], name: 'c' },
                        d: { $path: ['things', 'd'], name: 'd' }
                    },
                    'to-foos': {
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

    it('should get values through a complex reference that points to multiple complex references.', function() {
        getCoreRunner({
            input: [['both', 'name']],
            output: {
                json: {
                    both: {
                        $keys: ['bars', 'foos'],
                        $type: 'nodeset',
                        bars: {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        },
                        foos: {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
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
                        $keys: ['bars', 'foos'],
                        $type: 'nodeset',
                        bars: {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        },
                        foos: {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
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
                        $keys: ['to-bars', 'to-foos'],
                        'to-bars': {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        },
                        'to-foos': {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get values through references, complex references, references that point to complex references, complex references that point to references, and more, via complex paths.', function() {
        getCoreRunner({
            input: [[['both', 'to-both', 'to-both-refs'], 'name']],
            output: {
                json: {
                    $keys: ['both', 'to-both', 'to-both-refs'],
                    both: {
                        $type: 'nodeset',
                        $keys: ['bars', 'foos'],
                        bars: {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        },
                        foos: {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        }
                    },
                    'to-both': {
                        $type: 'nodeset',
                        $keys: ['bars', 'foos'],
                        bars: {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        },
                        foos: {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        }
                    },
                    'to-both-refs': {
                        $type: 'nodeset',
                        $keys: ['to-bars', 'to-foos'],
                        'to-bars': {
                            $keys: ['c','d'],
                            $type: 'nodeset', $path: ['things'],
                            c: { $path: ['things', 'c'], name: 'c' },
                            d: { $path: ['things', 'd'], name: 'd' }
                        },
                        'to-foos': {
                            $keys: ['a','b'],
                            $type: 'nodeset', $path: ['things'],
                            a: { $path: ['things', 'a'], name: 'a' },
                            b: { $path: ['things', 'b'], name: 'b' }
                        }
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get JSONGraph through a complex reference.', function() {
        getCoreRunner({
            input: [['foos', 'name']],
            isJSONG: true,
            collapse: true,
            output: {
                paths: [['foos', 'name']],
                jsonGraph: {
                    'foos': ref(['things', ['a', 'b']]),
                    'things': {
                        a: { name: atom('a') },
                        b: { name: atom('b') },
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get JSONGraph through a complex reference with a complex path.', function() {
        getCoreRunner({
            input: [[['bars', 'foos'], 'name']],
            isJSONG: true,
            collapse: true,
            output: {
                paths: [[['bars', 'foos'], 'name']],
                jsonGraph: {
                    'foos': ref(['things', ['a', 'b']]),
                    'bars': ref(['things', ['c', 'd']]),
                    'things': {
                        a: { name: atom('a') },
                        b: { name: atom('b') },
                        c: { name: atom('c') },
                        d: { name: atom('d') },
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get JSONGraph through a reference that points to a complex reference.', function() {
        getCoreRunner({
            input: [['to-foos', 'name']],
            isJSONG: true,
            collapse: true,
            output: {
                paths: [['to-foos', 'name']],
                jsonGraph: {
                    'to-foos': ref(['foos']),
                    'foos': ref(['things', ['a', 'b']]),
                    'things': {
                        a: { name: atom('a') },
                        b: { name: atom('b') },
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get JSONGraph through references that points to complex references with a complex path.', function() {
        getCoreRunner({
            input: [[['to-bars', 'to-foos'], 'name']],
            isJSONG: true,
            collapse: true,
            output: {
                paths: [[['to-bars', 'to-foos'], 'name']],
                jsonGraph: {
                    'to-foos': ref(['foos']),
                    'to-bars': ref(['bars']),
                    'foos': ref(['things', ['a', 'b']]),
                    'bars': ref(['things', ['c', 'd']]),
                    'things': {
                        a: { name: atom('a') },
                        b: { name: atom('b') },
                        c: { name: atom('c') },
                        d: { name: atom('d') },
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get JSONGraph through a complex reference that points to multiple complex references.', function() {
        getCoreRunner({
            input: [['both', 'name']],
            isJSONG: true,
            collapse: true,
            output: {
                paths: [['both', 'name']],
                jsonGraph: {
                    'both': ref([['bars', 'foos']]),
                    'foos': ref(['things', ['a', 'b']]),
                    'bars': ref(['things', ['c', 'd']]),
                    'things': {
                        a: { name: atom('a') },
                        b: { name: atom('b') },
                        c: { name: atom('c') },
                        d: { name: atom('d') },
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get JSONGraph through a reference that points to a complex reference that points to other complex references.', function() {
        getCoreRunner({
            input: [['to-both', 'name']],
            isJSONG: true,
            collapse: true,
            output: {
                paths: [['to-both', 'name']],
                jsonGraph: {
                    'to-both': ref(['both']),
                    'both': ref([['bars', 'foos']]),
                    'foos': ref(['things', ['a', 'b']]),
                    'bars': ref(['things', ['c', 'd']]),
                    'things': {
                        a: { name: atom('a') },
                        b: { name: atom('b') },
                        c: { name: atom('c') },
                        d: { name: atom('d') },
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get JSONGraph through a complex reference that points to references that each point to a complex reference.', function() {
        getCoreRunner({
            input: [['to-both-refs', 'name']],
            isJSONG: true,
            collapse: true,
            output: {
                paths: [['to-both-refs', 'name']],
                jsonGraph: {
                    'to-both-refs': ref([['to-bars', 'to-foos']]),
                    'to-foos': ref(['foos']),
                    'to-bars': ref(['bars']),
                    'foos': ref(['things', ['a', 'b']]),
                    'bars': ref(['things', ['c', 'd']]),
                    'things': {
                        a: { name: atom('a') },
                        b: { name: atom('b') },
                        c: { name: atom('c') },
                        d: { name: atom('d') },
                    }
                }
            },
            cache: refsCache()
        });
    });

    it('should get JSONGraph through references, complex references, references that point to complex references, complex references that point to references, and more, via complex paths.', function() {
        getCoreRunner({
            input: [[['both', 'to-both', 'to-both-refs'], 'name']],
            isJSONG: true,
            collapse: true,
            output: {
                paths: [[['both', 'to-both', 'to-both-refs'], 'name']],
                jsonGraph: {
                    'to-foos': ref(['foos']),
                    'to-bars': ref(['bars']),
                    'to-both': ref(['both']),
                    'to-both-refs': ref([['to-bars', 'to-foos']]),
                    'foos': ref(['things', ['a', 'b']]),
                    'bars': ref(['things', ['c', 'd']]),
                    'both': ref([['bars', 'foos']]),
                    'things': {
                        a: { name: atom('a') },
                        b: { name: atom('b') },
                        c: { name: atom('c') },
                        d: { name: atom('d') },
                    }
                }
            },
            cache: refsCache()
        });
    });
});
