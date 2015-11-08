///<reference path='Scripts/typings/node/node.d.ts'/>
///<reference path='TSON.ts'/>
if(typeof(global) !== 'undefined'){
    require('./TSON');
}
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
