var falcor = require("./../../lib/");
var Model = falcor.Model;
var expect = require('chai').expect;
var Cache = require("../data/Cache");
var ReducedCache = require("../data/ReducedCache");
var Expected = require("../data/expected");
var LocalDataSource = require("../data/LocalDataSource");
var Rx = require("rx");
var testRunner = require("../testRunner");
var References = Expected.References;
var Complex = Expected.Complex;
var Values = Expected.Values;
var Bound = Expected.Bound;
var noOp = function() {};
var _ = require('lodash');

var __id = require("./../../lib/internal/id");
var __innerRefs = require("./../../lib/internal/innerRefs");
var __priorRefs = require("./../../lib/internal/priorRefs");
var __refTarget = require("./../../lib/internal/refTarget");

var __ref = require("./../../lib/internal/ref");
var __context = require("./../../lib/internal/context");
var __ref_index = require("./../../lib/internal/ref-index");
var __refs_length = require("./../../lib/internal/refs-length");

describe('Adding', function() {
    var getPath = ['genreList', 0, 0, 'summary'];
    var setPath = {path: ['genreList', 0, 'length'], value: 4};
    var setJSON = {json: {genreList: {0: {length: 4}}}};
    describe('getPaths', function() {
        it('should perform a hard-link with back references _toJSONG.', function(done) {
            getTest(getPath, '_toJSONG').
                subscribe(noOp, done, done);
        });
        it('should perform a hard-link with back references toJSON.', function(done) {
            getTest(getPath, 'toJSON').
                subscribe(noOp, done, done);
        });
    });
    describe('setPaths', function() {
        it('should perform a hard-link with back references _toJSONG.', function(done) {
            setTest(setPath, '_toJSONG').
                subscribe(noOp, done, done);
        });
        it('should perform a hard-link with back references toJSON.', function(done) {
            setTest(setPath, 'toJSON').
                subscribe(noOp, done, done);
        });
        it('should perform a hard-link with back references toPathValues.', function(done) {
            setTest(setPath, 'toPathValues').
                subscribe(noOp, done, done);
        });
    });
    describe('setJSON', function() {
        it('should perform a hard-link with back references _toJSONG.', function(done) {
            setTest(setJSON, '_toJSONG').
                subscribe(noOp, done, done);
        });
        it('should perform a hard-link with back references toJSON.', function(done) {
            setTest(setJSON, 'toJSON').
                subscribe(noOp, done, done);
        });
        it('should perform a hard-link with back references toPathValues.', function(done) {
            setTest(setJSON, 'toPathValues').
                subscribe(noOp, done, done);
        });
    });
});

function getTest(query, output) {
    var model = new Model({cache: Cache()});
    var lhs = model._root.cache.genreList[0];
    var rhs = model._root.cache.lists.abcd;

    expect(lhs[__innerRefs]).to.not.be.ok;
    expect(rhs[__priorRefs]).to.not.be.ok;
    expect(lhs[__refTarget]).to.not.be.ok;

    return toObservable(testRunner.get(model, _.cloneDeep(query), output)).
        do(noOp, noOp, function() {

            var innerRefs = lhs[__innerRefs];
            expect(innerRefs[lhs[__refTarget]]).to.equal(rhs);
            expect(rhs[__priorRefs][lhs[__id]]).to.equal(lhs);

            for (var refKey in innerRefs) {
                var target = innerRefs[refKey];
                var priorRefs = target[__priorRefs];
                expect(priorRefs[lhs[__id]]).to.equal(lhs);
            }
        });
}

function setTest(query, output) {
    var model = new Model({cache: Cache()});
    var lhs = model._root.cache.genreList[0];
    var rhs = model._root.cache.lists.abcd;

    expect(lhs[__innerRefs]).to.not.be.ok;
    expect(rhs[__priorRefs]).to.not.be.ok;
    expect(lhs[__refTarget]).to.not.be.ok;

    return toObservable(testRunner.set(model, _.cloneDeep(query), output)).
        do(noOp, noOp, function() {

            var innerRefs = lhs[__innerRefs];
            expect(innerRefs[lhs[__refTarget]]).to.equal(rhs);
            expect(rhs[__priorRefs][lhs[__id]]).to.equal(lhs);

            for (var refKey in innerRefs) {
                var target = innerRefs[refKey];
                var priorRefs = target[__priorRefs];
                expect(priorRefs[lhs[__id]]).to.equal(lhs);
            }
        });
}
