///<reference path='Scripts/typings/node/node.d.ts'/>
///<reference path='TSON.ts'/>
if (typeof (global) !== 'undefined') {
    require('./TSON');
}
var referenceObject = {
    refString: 'originalValue'
};
var referencerObject = {
    myRef: referenceObject
};
var refs = [
    function () { return referenceObject; }
];
var stringifyOptions = {
    refs: refs
};
var objectifyOptions = {
    resolver: function (s) {
        return eval(s);
    }
};
var serializedString = TSON.stringify(referencerObject, stringifyOptions);
var clonedObject = TSON.objectify(serializedString, objectifyOptions);
referenceObject.refString = 'newValue';
console.log(clonedObject.myRef.refString);
//# sourceMappingURL=demo.js.map