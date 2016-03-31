var getCoreRunner = require('./../getCoreRunner');
var cacheGenerator = require('./../CacheGenerator');
var outputGenerator = require('./../outputGenerator');
var jsonGraph = require('falcor-json-graph');
var atom = jsonGraph.atom;
var ref = jsonGraph.ref;
var _ = require('lodash');

describe('Values', function() {
    // PathMap ----------------------------------------
    it('should get a simple value out of the cache', function() {
        getCoreRunner({
            input: [['videos', 0, 'title']],
            output: outputGenerator.videoGenerator(["0"]),
            cache: cacheGenerator(0, 1)
        });
    });
    it('should get a value through a reference.', function() {
        getCoreRunner({
            input: [['lolomo', 0, 0, 'item', 'title']],
            output: outputGenerator.lolomoGenerator([0], [0]),
            cache: cacheGenerator(0, 1)
        });
    });
    it('should get a value of type atom when in materialized mode.', function() {
        getCoreRunner({
            input: [['videos', {to:1}, 'title']],
            materialize: true,
            output: {
                json: {
                    videos: {
                        $keys: {to:1},
                        $path: ['videos'],
                        0: {
                            $path: ['videos', 0],
                            title: {$type: 'atom'}
                        },
                        1: {
                            $path: ['videos', 1],
                            title: {$type: 'atom'}
                        }
                    }
                }
            },
            cache: {
                jsonGraph: {
                    videos: {
                        0: {
                            title: {$type: 'atom'}
                        },
                        1: {
                            title: {$type: 'atom'}
                        }
                    }
                },
                paths: [
                    ['videos', {to: 1}, 'title']
                ]
            }
        });
    });
    it('should get a value through references with complex pathSet.', function() {
        getCoreRunner({
            input: [['lolomo', {to: 1}, {to: 1}, 'item', 'title']],
            output: {
                "json": {
                    "lolomo": {
                        "0": {
                            "0": {
                                "$path": ["lists", "A", 0],
                                "item": {
                                    "$path": ["videos", 0],
                                    "title": "Video 0"
                                }
                            },
                            "1": {
                                "$path": ["lists", "A", 1],
                                "item": {
                                    "$path": ["videos", 1],
                                    "title": "Video 1"
                                }
                            },
                            "$keys": {to: 1},
                            "$path": ["lists", "A"]
                        },
                        "1": {
                            "0": {
                                "$path": ["lists", "B", 0],
                                "item": {
                                    "$path": ["videos", 10],
                                    "title": "Video 10"
                                }
                            },
                            "1": {
                                "$path": ["lists", "B", 1],
                                "item": {
                                    "$path": ["videos", 11],
                                    "title": "Video 11"
                                }
                            },
                            "$keys": {to: 1},
                            "$path": ["lists", "B"]
                        },
                        "$keys": {to: 1},
                        "$path": ["lolomos", 1234]
                    }
                }
            },
            cache: {
                "lolomo": {
                    "$type": "ref",
                    "value": ["lolomos", "1234"]
                },
                "lolomos": {
                    "1234": {
                        "0": {
                            "$type": "ref",
                            "value": ["lists", "A"]
                        },
                        "1": {
                            "$type": "ref",
                            "value": ["lists", "B"]
                        },
                        "2": {
                            "$type": "ref",
                            "value": ["lists", "C"]
                        }
                    }
                },
                "lists": {
                    "A": {
                        "0": {
                            "item": {
                                "$type": "ref",
                                "value": ["videos", "0"]
                            }
                        },
                        "1": {
                            "item": {
                                "$type": "ref",
                                "value": ["videos", "1"]
                            }
                        }
                    },
                    "B": {
                        "0": {
                            "item": {
                                "$type": "ref",
                                "value": ["videos", "10"]
                            }
                        },
                        "1": {
                            "item": {
                                "$type": "ref",
                                "value": ["videos", "11"]
                            }
                        }
                    }
                },
                "videos": {
                    "0": {
                        "title": {
                            "$type": "atom",
                            "value": "Video 0"
                        }
                    },
                    "1": {
                        "title": {
                            "$type": "atom",
                            "value": "Video 1"
                        }
                    },
                    "10": {
                        "title": {
                            "$type": "atom",
                            "value": "Video 10"
                        }
                    },
                    "11": {
                        "title": {
                            "$type": "atom",
                            "value": "Video 11"
                        }
                    }
                }
            }
        });
    });
    it('should allow for multiple arguments with different length paths.', function() {
        var lolomo0 = {
            length: 1337
        };
        lolomo0.$path = ['lolomo', '0'];
        var lolomo = {
            length: 1,
            0: lolomo0
        };
        lolomo.$path = ['lolomo'];
        var output = {
            json: {
                lolomo: lolomo
            }
        };

        getCoreRunner({
            input: [
                ['lolomo', 0, 'length'],
                ['lolomo', 'length']
            ],
            output: output,
            cache: {
                lolomo: {
                    length: 1,
                    0: {
                        length: 1337
                    }
                }
            }
        });
    });
    it('should allow for a null at the end to get a value behind a reference.', function() {
        getCoreRunner({
            input: [['lolomo', null]],
            output: {
                json: {
                    lolomo: 'value'
                }
            },
            cache: {
                lolomo: jsonGraph.ref(['test', 'value']),
                test: {
                    value: atom('value')
                }
            }
        });
    });
    it('should not get the value after the reference.', function() {
        getCoreRunner({
            input: [['lolomo']],
            output: {
                json: {
                    lolomo: ['test', 'value']
                }
            },
            cache: {
                lolomo: jsonGraph.ref(['test', 'value']),
                test: {
                    value: atom('value')
                }
            }
        });
    });
    it('should have no output for empty paths.', function() {
        getCoreRunner({
            input: [['lolomo', 0, [], 'item', 'title']],
            output: {
              "json": {
                "lolomo": {
                  "0": {
                    "$path": ["lists", "A"]
                  },
                  "$path": ["lolomos", "1234"]
                }
              }
            },
            cache: cacheGenerator(0, 1)
        });
    });

    // JSONGraph ----------------------------------------
    it('should get JSONGraph for a single value out, modelCreated', function() {
        getCoreRunner({
            input: [['videos', 0, 'title']],
            isJSONG: true,
            output: {
                jsonGraph: {
                    videos: {
                        0: {
                            title: 'Video 0'
                        }
                    }
                },
                paths: [['videos', 0, 'title']]
            },
            cache: cacheGenerator(0, 1, undefined, true)
        });
    });
    it('should get JSONGraph for a single value out, !modelCreated', function() {
        getCoreRunner({
            input: [['videos', 0, 'title']],
            isJSONG: true,
            output: {
                jsonGraph: {
                    videos: {
                        0: {
                            title: atom('Video 0')
                        }
                    }
                },
                paths: [['videos', 0, 'title']]
            },
            cache: cacheGenerator(0, 1, undefined, false)
        });
    });
    it('should allow for multiple arguments with different length paths as JSONGraph.', function() {
        getCoreRunner({
            input: [
                ['lolomo', 0, 'length'],
                ['lolomo', 'length']
            ],
            output: {
                jsonGraph: {
                    lolomo: {
                        length: 1,
                        0: {
                            length: 1337
                        }
                    }
                },
                paths: [
                    ['lolomo', 0, 'length'],
                    ['lolomo', 'length']
                ]
            },
            isJSONG: true,
            cache: {
                lolomo: {
                    length: 1,
                    0: {
                        length: 1337
                    }
                }
            }
        });
    });
    it('should get JSONGraph through references.', function() {
        getCoreRunner({
            input: [['lolomo', 0, 0, 'item', 'title']],
            isJSONG: true,
            output: {
                jsonGraph: cacheGenerator(0, 1),
                paths: [['lolomo', 0, 0, 'item', 'title']]
            },
            cache: cacheGenerator(0, 10)
        });
    });
    it('should get JSONGraph through references with complex pathSet.', function() {
        getCoreRunner({
            input: [['lolomo', {to: 1}, {to: 1}, 'item', 'title']],
            isJSONG: true,
            output: {
                jsonGraph: _.merge(cacheGenerator(0, 2), cacheGenerator(10, 2, undefined, false)),
                paths: [
                    ['lolomo', 0, 0, 'item', 'title'],
                    ['lolomo', 0, 1, 'item', 'title'],
                    ['lolomo', 1, 0, 'item', 'title'],
                    ['lolomo', 1, 1, 'item', 'title']
                ]
            },
            cache: cacheGenerator(0, 30)
        });
    });
});

