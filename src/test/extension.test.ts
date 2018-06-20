//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';
import { LgtmService } from '../lgtm';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
// import * as hola from '../lgtm';

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", function () {

    // Defines a Mocha unit test
    test("Something 1", function () {
        var lgtm = new LgtmService();
        assert.equal(false, lgtm.isInitiated());
    });

    test("Something 2", function () {
        // var lgtm = new LgtmService();
        // lgtm.init(() => {
        //     assert.equal(true, lgtm.isInitiated());
        // });
    });

    test("parseQueryArgs", function () {
        // const args = Lgtm.parseQueryArgs("//#lang=hola\n//#keys=[[1,2,3,4]]\nquery".split("\n", 2));
        // console.log(args);
        // assert.equal(Object.keys(args).length, 2);
        // assert.equal(args["lang"], "hola");
        // assert.equal(args["keys"], "[[1,2,3,4]]");
    });

});