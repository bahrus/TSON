///<reference path='Scripts/typings/node/node.d.ts'/>
///<reference path='TSON.ts'/>
if(typeof(global) !== 'undefined'){
    require('./TSON');
}

const myObjectWithAFunction = {
    fnTest: function(a, b, c){
        return a + b - c;
    }
};
console.log(myObjectWithAFunction.fnTest(1, 2, 3));
const serializedObjectWithAFunction = TSON.stringify(myObjectWithAFunction);
const clonedObjectWithAFunction = TSON.objectify(serializedObjectWithAFunction);
console.log(clonedObjectWithAFunction.fnTest(1, 2, 3));
//0

const referenceObject = {
    refString: 'originalValue'
};
const referencerObject = {
    myRef: referenceObject,
};
const stringifyOptions : TSON.IStringifyOptions = {
    refs: [() => referenceObject]
}
const objectifyOptions: TSON.IObjectifyOptions = {
    resolver: s => {
        return eval(s);
    }
}
const serializedString = TSON.stringify(referencerObject, stringifyOptions);
const clonedObject = TSON.objectify(serializedString, objectifyOptions);
referenceObject.refString = 'newValue';
console.log(clonedObject.myRef.refString);
