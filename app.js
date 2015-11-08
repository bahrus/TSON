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
    })(whatever = myModule.whatever || (myModule.whatever = {}));
})(myModule || (myModule = {}));
var stringifyOptions = {
    refs: [function () { return myReferencedModule; }]
};
var objectifyOptions = {
    getter: function () { return myModule.whatever; }
};
var testS = TSON.stringify(function () { return myModule.whatever; }, stringifyOptions);
var test2 = TSON.validateIdempotence(function () { return myModule.whatever; }, stringifyOptions, objectifyOptions);
debugger;
console.log(testS);
//# sourceMappingURL=app.js.map