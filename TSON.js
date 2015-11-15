///<reference path='Scripts/typings/node/node.d.ts'/>
var TSON;
(function (TSON) {
    var fnSignature = 'return ';
    var fnHeader = 'function ';
    var fnSignatureLn = fnSignature.length;
    var __name__ = '__name__';
    var __subs__ = '__subs__';
    var jsNameRegex = /^[$A-Z_][0-9A-Z_$]*$/i;
    Object.defineProperty(String.prototype, '$', {
        get: function () {
            return this;
        }
    });
    function labelObject(getter) {
        //debugger;
        var fnString = getModuleName(getter.toString());
        var obj = getter();
        labelObjectWithStr(obj, fnString);
    }
    TSON.labelObject = labelObject;
    function labelObjectWithStr(obj, label) {
        obj[__name__] = label;
        for (var key in obj) {
            var childObj = obj[key];
            var typ = typeof childObj;
            switch (typ) {
                case 'function':
                case 'object':
                    var childLbl = label + '.' + key;
                    labelObjectWithStr(childObj, childLbl);
                    break;
            }
        }
    }
    function attachBindings(originalObjectPointer, rootClonedObj, path, clonedObjectPointer) {
        if (!rootClonedObj) {
            if (path || clonedObjectPointer) {
                throw "Improper usage";
            }
            rootClonedObj = {};
            path = '';
            clonedObjectPointer = rootClonedObj;
        }
        for (var key in originalObjectPointer) {
            var childOfOriginalObject = originalObjectPointer[key];
            var newPath = path ? path + '.' + key : key;
            var cn = childOfOriginalObject[__name__];
            var typ = typeof childOfOriginalObject;
            if (cn) {
                if (!rootClonedObj[__subs__])
                    rootClonedObj[__subs__] = {};
                rootClonedObj[__subs__][newPath] = cn;
            }
            else {
                switch (typ) {
                    case 'function':
                        if (!rootClonedObj[__subs__])
                            rootClonedObj[__subs__] = {};
                        rootClonedObj[__subs__][newPath] = childOfOriginalObject.toString();
                        break;
                    case 'object':
                        clonedObjectPointer[key] = {};
                        attachBindings(childOfOriginalObject, rootClonedObj, path, clonedObjectPointer[key]);
                        break;
                    default:
                        clonedObjectPointer[key] = childOfOriginalObject;
                }
            }
        }
        return rootClonedObj;
    }
    function stringify(objOrGetter, options) {
        if (options) {
            var refs = options.refs;
            if (refs) {
                refs.forEach(function (ref) { return labelObject(ref); });
            }
        }
        var obj;
        var fnString = '';
        if (typeof (objOrGetter) === 'object') {
            obj = objOrGetter;
        }
        else {
            obj = objOrGetter();
            fnString = getModuleName(objOrGetter.toString());
        }
        var clonedObj = attachBindings(obj);
        if (fnString) {
            clonedObj[__name__] = fnString;
        }
        return JSON.stringify(clonedObj);
    }
    TSON.stringify = stringify;
    function getObjFromPath(startingObj, path, createIfNotFound, truncateNo) {
        var paths = path.split('.');
        return getObjFromPathTokens(startingObj, paths, createIfNotFound, truncateNo);
    }
    function getObjFromPathTokens(startingObj, paths, createIfNotFound, truncateNo) {
        if (!truncateNo)
            truncateNo = 0;
        var resolvedObj = startingObj;
        var n = paths.length;
        for (var i = 1; i < n - truncateNo; i++) {
            var word = paths[i];
            var newModulePath = resolvedObj[word];
            if (createIfNotFound) {
                if (!newModulePath) {
                    newModulePath = {};
                    resolvedObj[word] = newModulePath;
                }
            }
            else if (!newModulePath) {
                throw word + " not found.";
            }
            resolvedObj = newModulePath;
        }
        var returnObj = {
            obj: resolvedObj
        };
        if (truncateNo) {
            returnObj.nextWord = paths[n - truncateNo];
        }
        return returnObj;
    }
    function objectify(tson, options) {
        var obj = JSON.parse(tson);
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
        var subs = obj[__subs__];
        if (subs) {
            var resolver = (options && options.resolver) ? options.resolver : eval;
            for (var destPath in subs) {
                var srcPath = subs[destPath];
                var targetObjectInfo = getObjFromPath(obj, destPath, false, 1);
                if (srcPath.indexOf(fnHeader) === 0) {
                    var fn = resolver("(" + srcPath + ")");
                    targetObjectInfo.obj[targetObjectInfo.nextWord] = fn;
                }
                else {
                    //#region Resolve reference pointer
                    var srcPathTokns = srcPath.split('.');
                    var rootPath = srcPathTokns[0];
                    if (!jsNameRegex.test(rootPath)) {
                        throw "Invalid expression: " + srcPath;
                    }
                    var rootObj = resolver(rootPath);
                    if (!rootObj) {
                        throw "Unable to resolve " + rootPath;
                    }
                    var resolvedReferenceObj = getObjFromPathTokens(rootObj, srcPathTokns.slice(1));
                    targetObjectInfo.obj[targetObjectInfo.nextWord] = resolvedReferenceObj.obj;
                }
            }
        }
        return obj;
    }
    TSON.objectify = objectify;
    function getModuleName(fnString) {
        var iPosReturn = fnString.indexOf(fnSignature);
        fnString = fnString.substr(iPosReturn + fnSignatureLn);
        var iPosSemi = fnString.indexOf(';');
        fnString = fnString.substr(0, iPosSemi);
        return fnString;
    }
    function isEqual(x, y) {
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
            if (p === __name__)
                continue;
            if (p === __subs__)
                continue;
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }
        for (p in x) {
            if (p === __name__)
                continue;
            if (p === __subs__)
                continue;
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }
        return true;
    }
    TSON.isEqual = isEqual;
    function validateIdempotence(objOrGetter, stringifyOptions, objectifyOptions) {
        var originalObj = objOrGetter;
        if (typeof originalObj !== 'object') {
            originalObj = objOrGetter();
        }
        var str = stringify(objOrGetter, stringifyOptions);
        //if(objectifyOptions && objectifyOptions.getter){
        //    const g = getGlobalObject();
        //    const path = getModuleName(objectifyOptions.getter.toString());
        //    const objContainer = getObjFromPath(g, path, false, 1);
        //    const splitPath = path.split('.');
        //    const lastWord = splitPath[splitPath.length - 1];
        //    delete objContainer.obj[lastWord];
        //}
        var objTest = objectify(str, objectifyOptions);
        return isEqual(originalObj, objTest);
    }
    TSON.validateIdempotence = validateIdempotence;
})(TSON || (TSON = {}));
(function (__global) {
    var modInfo = {
        name: 'TSON',
        mod: TSON
    };
    if (typeof __global[modInfo.name] !== "undefined") {
        if (__global[modInfo.name] !== modInfo.mod) {
            for (var p in modInfo.mod) {
                __global[modInfo.name][p] = modInfo.mod[p];
            }
        }
    }
    else {
        __global[modInfo.name] = modInfo.mod;
    }
})(typeof window !== "undefined" ? window :
    typeof WorkerGlobalScope !== "undefined" ? self :
        typeof global !== "undefined" ? global :
            Function("return this;")());
//#endregion
//# sourceMappingURL=TSON.js.map