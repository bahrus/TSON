///<reference path='Scripts/typings/node/node.d.ts'/>
///<reference path='StringUtil.ts'/>
///<reference path='TSON.ts'/>
if (typeof (global) !== 'undefined') {
    require('./TSON');
}
var myReferencedModule;
(function (myReferencedModule) {
    var something;
    (function (something) {
        something.myString = 'test'.$;
        function addOne(num) {
            return num + 1;
        }
        something.addOne = addOne;
    })(something = myReferencedModule.something || (myReferencedModule.something = {}));
})(myReferencedModule || (myReferencedModule = {}));
var myModule;
(function (myModule) {
    var whatever;
    (function (whatever) {
        whatever.test = 'hello';
        whatever.test2 = myReferencedModule.something.myString;
        whatever.test3 = myReferencedModule.something.addOne;
        whatever.test4 = function (a) {
            //my comment
            return a + 2;
        };
        whatever.test5 = function (i) { return i.something; };
        whatever.test6 = [function (i) { return i.something1; }, function (i) { return i.something2; }];
        // const stringifyOptions : TSON.IStringifyOptions = {
        //     refs: [() => myReferencedModule],
        // };
        // const objectifyOptions : TSON.IObjectifyOptions = {
        //     getter: () => myModule.whatever,
        // };
        // const testS = TSON.stringify(() => myModule.whatever, stringifyOptions);
        // const test2 = TSON.validateIdempotence(() => myModule.whatever, stringifyOptions, objectifyOptions);
        // debugger;
        // console.log(testS);
    })(whatever = myModule.whatever || (myModule.whatever = {}));
})(myModule || (myModule = {}));
