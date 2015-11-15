///<reference path='Scripts/typings/node/node.d.ts'/>
///<reference path='TSON.ts'/>
if (typeof (global) !== 'undefined') {
    require('./TSON');
}
var myObjectWithAFunction = {
    fnTest: function (a, b, c) {
        return a + b - c;
    }
};
console.log(myObjectWithAFunction.fnTest(1, 2, 3));
var serializedObjectWithAFunction = TSON.stringify(myObjectWithAFunction);
var clonedObjectWithAFunction = TSON.objectify(serializedObjectWithAFunction);
console.log(clonedObjectWithAFunction.fnTest(1, 2, 3));
//0
var referenceObject = {
    refString: 'originalValue'
};
var referencerObject = {
    myRef: referenceObject
};
var stringifyOptions = {
    refs: [function () { return referenceObject; }]
};
var objectifyOptions = {
    resolver: function (s) { return eval(s); }
};
var serializedString = TSON.stringify(referencerObject, stringifyOptions);
debugger;
var clonedObject = TSON.objectify(serializedString, objectifyOptions);
referenceObject.refString = 'newValue';
console.log(clonedObject.myRef.refString);
//# sourceMappingURL=demo.js.map