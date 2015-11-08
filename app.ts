///<reference path='Scripts/typings/node/node.d.ts'/>
///<reference path='StringUtil.ts'/>
///<reference path='TSON.ts'/>


if(typeof(global) !== 'undefined'){
    require('./TSON');
}

module myReferencedModule.something{
    export const myString = 'test'.$;
    export function addOne(num: number){
        return num + 1;
    }
}

module myModule.whatever{
    export const test = 'hello';
    export const test2 = myReferencedModule.something.myString;
    export const test3 = myReferencedModule.something.addOne;
    export const test4 = a => {
        //my comment
        return a + 2;
    };
    export const test5 = i => i.something;
    export const test6 = [i => i.something1, i => i.something2];



}

const stringifyOptions : TSON.IStringifyOptions = {
    refs: [() => myReferencedModule],
};
const objectifyOptions : TSON.IObjectifyOptions = {
    getter: () => myModule.whatever,
};

const testS = TSON.stringify(() => myModule.whatever, stringifyOptions);
const test2 = TSON.validateIdempotence(() => myModule.whatever, stringifyOptions, objectifyOptions);
debugger;
console.log(testS);