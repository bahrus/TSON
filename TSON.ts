///<reference path='Scripts/typings/node/node.d.ts'/>



module TSON{

    const fnSignature = 'return ';
    const fnHeader = 'function ';

    const fnSignatureLn = fnSignature.length;
    const __name__ = '__name__';
    const __subs__ = '__subs__';

    const jsNameRegex = /^[$A-Z_][0-9A-Z_$]*$/i;

    Object.defineProperty(String.prototype, '$', {
        get: function(){
            return this;
        }
    });

    

    type objOrObjGetter = Object | (() => Object);

    export function labelObject(getter: () => Object){
        //debugger;
        const fnString = getModuleName ( getter.toString() );
        const obj = getter();
        labelObjectWithStr(obj, fnString);
    }
    
    function labelObjectWithStr(obj: Object, label: string){
        obj[__name__] = label;
        for(var key in obj){
            const childObj = obj[key];
            const typ = typeof childObj;
            switch(typ){
                case 'function':
                case 'object':
                    const childLbl = label + '.' + key;
                    labelObjectWithStr(childObj, childLbl);
                    break;
            }
        }
    }

    function attachBindings(originalObjectPointer: Object, rootClonedObj?: Object, path?: string, clonedObjectPointer?: Object){
        if(!rootClonedObj){
            if(path || clonedObjectPointer){
                throw "Improper usage";
            }
            rootClonedObj = {};
            path = '';
            clonedObjectPointer = rootClonedObj;
        }
        for(let key in originalObjectPointer){
            const childOfOriginalObject = originalObjectPointer[key];
            const newPath = path ? path + '.' + key : key;
            const cn = childOfOriginalObject[__name__];
            const typ = typeof childOfOriginalObject;
            if(cn){

                if(!rootClonedObj[__subs__]) rootClonedObj[__subs__] = {};
                rootClonedObj[__subs__][newPath] = cn;
            }else{

                switch(typ){
                    case 'function':
                        if(!rootClonedObj[__subs__]) rootClonedObj[__subs__] = {};
                        rootClonedObj[__subs__][newPath] = childOfOriginalObject.toString();
                        break;
                    case 'object':
                        clonedObjectPointer[key] = {};
                        attachBindings(childOfOriginalObject, rootClonedObj, path, clonedObjectPointer[key])
                        break;
                    default:
                        clonedObjectPointer[key] = childOfOriginalObject;

                }
            }


        }
        return rootClonedObj;
    }

    export interface IStringifyOptions{
        refs?: (() => Object)[];
    }
    export function stringify(objOrGetter: objOrObjGetter, options?: IStringifyOptions){
        if(options){
            const refs = options.refs;
            if(refs){
                refs.forEach(ref => labelObject(ref));
            }
        }
        
        let obj : Object;
        let fnString = '';
        if(typeof(objOrGetter) === 'object'){
            obj = objOrGetter;
        }else{
            obj = (<any>objOrGetter)();
            fnString = getModuleName ( objOrGetter.toString() );
        }
        const clonedObj = attachBindings(obj);
        if(fnString){
            clonedObj[__name__] = fnString;
        }
        return JSON.stringify(clonedObj);
    }

    function getObjFromPath(startingObj: Object, path: string, createIfNotFound?: boolean, truncateNo?: number) : {obj: Object, nextWord?: string} {
        const paths = path.split('.');
        return getObjFromPathTokens(startingObj, paths, createIfNotFound, truncateNo);

    }

    function getObjFromPathTokens (startingObj: Object, paths: string[], createIfNotFound?: boolean, truncateNo?: number) : {obj: Object, nextWord?: string}{
        if(!truncateNo) truncateNo = 0;
        let resolvedObj = startingObj;
        let n = paths.length;
        for(let i = 1; i < n - truncateNo; i++){
            const word = paths[i];
            let newModulePath = resolvedObj[word];
            if(createIfNotFound){
                if(!newModulePath){
                    newModulePath = {};
                    resolvedObj[word] = newModulePath;

                }
            }else if(!newModulePath){
                throw word + " not found."
            }
            resolvedObj = newModulePath;
        }
        const returnObj : {obj: Object, nextWord?: string} = {
            obj: resolvedObj,
        }
        if(truncateNo){
            returnObj.nextWord = paths[n - truncateNo];
        }
        return returnObj;
    }

    export interface IObjectifyOptions{
        ///**
        // * Put the deserialized object into the path indicated by this simple getter.
        // * Getter must be a simple path statement, like () => myNameSpace.myModule.myObject;
        // */
        //getter?: () => Object;

        ///**
        // * If a getter is provided, the objectifier will check first if the rootObject property is specified.
        // * If not found, it will start from the global object
        // * (window in browser setting, global in a node.js context, WorkerGlobalScope in a web worker)
        // *
        // */
        //getterRootObject?: Object;

        ///**
        // * eval for local scope
        // */
        resolver?: (s: string) => any;
    }

    export function objectify(tson: string, options?: IObjectifyOptions){
        const obj = JSON.parse(tson);
        //let rootGlobalObj = getGlobalObject();
        //if(options){
        //    //const getter = options.getter;
        //    //if(getter){
        //    //    const fnString = getModuleName (  getter.toString() );
        //    //    if(fnString){
        //    //        if(obj[__name__] !== fnString){
        //    //            throw "Destination path does not match signature of object";
        //    //        }
        //    //        //if(options.getterRootObject) rootGlobalObj = options.getterRootObject;
        //    //        const moduleInfo = getObjFromPath(rootGlobalObj, fnString, true, 1);
        //    //        moduleInfo.obj[moduleInfo.nextWord] = obj;
        //    //    }else{
        //    //        throw "No namespace found";
        //    //    }
        //    //}
        //}
        

        const subs =  <{[key: string]: string;}> obj[__subs__];
        if(subs){
            const resolver = (options && options.resolver) ? options.resolver : eval;
            
            for(var destPath in subs){
                const srcPath = subs[destPath];
                const targetObjectInfo = getObjFromPath(obj, destPath, false, 1);
                if(srcPath.indexOf(fnHeader) === 0){
                    const fn = resolver(`(${srcPath})`);
                    targetObjectInfo.obj[targetObjectInfo.nextWord] = fn;
                }else{

                    //#region Resolve reference pointer
                    const srcPathTokns = srcPath.split('.');
                    const rootPath = srcPathTokns[0];
                    if(!jsNameRegex.test(rootPath)){
                        throw "Invalid expression: " + srcPath;
                    }
                    let rootObj = resolver(rootPath);
                    if(!rootObj) {
                        throw "Unable to resolve " + rootPath;
                    }


                    const resolvedReferenceObj = getObjFromPathTokens(rootObj, srcPathTokns.slice(1));
                    targetObjectInfo.obj[targetObjectInfo.nextWord] = resolvedReferenceObj.obj;
                    //#endregion

                }

            }
        }
        return obj;
    }

    function getModuleName(fnString: string) : string {
        const iPosReturn = fnString.indexOf(fnSignature);
        fnString = fnString.substr(iPosReturn + fnSignatureLn);
        const iPosSemi = fnString.indexOf(';');
        fnString = fnString.substr(0, iPosSemi);
        return fnString;
    }

    export function isEqual (x, y) {
        var p;

        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
            return true;
        }

        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on step when comparing prototypes
        if (x === y) {
            return true;
        }

        // Works in case when functions are created in constructor.
        // Comparing dates is a common scenario. Another built-ins?
        // We can even handle functions passed across iframes
        if ((typeof x === 'function' && typeof y === 'function') ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        // At last checking prototypes as good a we can
        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
            return false;
        }

        if (x.constructor !== y.constructor) {
            return false;
        }

        if (x.prototype !== y.prototype) {
            return false;
        }

        // Check for infinitive linking loops


        // Quick checking of one object beeing a subset of another.
        // todo: cache the structure of arguments[0] for performance
        for (p in y) {
            if(p === __name__) continue;
            if(p === __subs__) continue;
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (p in x) {
            if(p === __name__) continue;
            if(p === __subs__) continue;
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }


        }

        return true;
    }

    export function validateIdempotence(objOrGetter: objOrObjGetter, 
        stringifyOptions?: IStringifyOptions,
        objectifyOptions?: IObjectifyOptions
    ) : boolean {
        let originalObj = objOrGetter;
        if(typeof originalObj !== 'object'){
            originalObj = (<any>objOrGetter)();
        }
        const str = stringify(objOrGetter, stringifyOptions);
        //if(objectifyOptions && objectifyOptions.getter){
        //    const g = getGlobalObject();
        //    const path = getModuleName(objectifyOptions.getter.toString());
        //    const objContainer = getObjFromPath(g, path, false, 1);
        //    const splitPath = path.split('.');
        //    const lastWord = splitPath[splitPath.length - 1];
        //    delete objContainer.obj[lastWord];
        //}
        const objTest = objectify(str, objectifyOptions);
        return isEqual(originalObj, objTest);
    }

    ////from http://stackoverflow.com/questions/2008279/validate-a-javascript-function-name
    //const validIdentifierName = /^[$A-Z_][0-9A-Z_$]*$/i;
    //function isValidIdentifierName(s: string) {
    //    return validIdentifierName.test(s);
    //}


    //export function getGlobalObject() : Object{
    //    return typeof window !== "undefined" ? window :
    //    typeof WorkerGlobalScope !== "undefined" ? self :
    //        typeof global !== "undefined" ? global :
    //            Function("return this;")()
    //}

}

//#region hood global TSON
//region  hook global TSON
declare const WorkerGlobalScope: any;

(function(__global: any) {
    const modInfo = {
        name: 'TSON',
        mod: TSON,
        //subMod: todo.CommonActions,
    }
    if (typeof __global[modInfo.name] !== "undefined") {
        if (__global[modInfo.name] !== modInfo.mod) {
            for (var p in modInfo.mod) {
                __global[modInfo.name][p] = (<any>modInfo.mod)[p];
            }
        }
    }
    else {
        __global[modInfo.name] = modInfo.mod;
    }
})(
    typeof window !== "undefined" ? window :
        typeof WorkerGlobalScope !== "undefined" ? self :
            typeof global !== "undefined" ? global :
                Function("return this;")());
//#endregion
