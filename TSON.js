var TSON;
(function (TSON) {
    var fnSignature = 'return ';
    var fnHeader = 'function ';
    var fnSignatureLn = fnSignature.length;
    var __name__ = '__name__';
    var __subs__ = '__subs__';
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
    function attachBindings(obj, rootObj, path) {
        if (!rootObj)
            rootObj = obj;
        if (!path)
            path = '';
        for (var key in obj) {
            var childObj = obj[key];
            var newPath = path ? path + '.' + key : key;
            var cn = childObj[__name__];
            var typ = typeof childObj;
            if (cn) {
                if (!rootObj[__subs__])
                    rootObj[__subs__] = {};
                rootObj[__subs__][newPath] = cn;
            }
            else {
                switch (typ) {
                    case 'function':
                        if (!rootObj[__subs__])
                            rootObj[__subs__] = {};
                        rootObj[__subs__][newPath] = childObj.toString();
                        break;
                }
            }
            switch (typ) {
                case 'function':
                case 'object':
                    attachBindings(childObj, rootObj, newPath);
                    break;
            }
        }
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
        attachBindings(obj);
        if (fnString) {
            obj[__name__] = fnString;
        }
        return JSON.stringify(obj);
    }
    TSON.stringify = stringify;
    function getObjFromPath(startingObj, path, createIfNotFound, truncateNo) {
        if (!truncateNo)
            truncateNo = 0;
        var paths = path.split('.');
        var modulePath = startingObj;
        var n = paths.length;
        for (var i = 0; i < n - truncateNo; i++) {
            var word = paths[i];
            var newModulePath = modulePath[word];
            if (createIfNotFound) {
                if (!newModulePath) {
                    newModulePath = {};
                    modulePath[word] = newModulePath;
                }
            }
            else if (!newModulePath) {
                throw path + "not found.";
            }
            modulePath = newModulePath;
        }
        var returnObj = {
            obj: modulePath
        };
        if (truncateNo) {
            returnObj.nextWord = paths[n - truncateNo];
        }
        return returnObj;
    }
    function objectify(tson, options) {
        var obj = JSON.parse(tson);
        if (options) {
            var getter = options.getter;
            if (getter) {
                var fnString = getModuleName(getter.toString());
                if (fnString) {
                    if (obj[__name__] !== fnString) {
                        throw "Destination path does not match signature of object";
                    }
                    var moduleInfo = getObjFromPath(getGlobalObject(), fnString, true, 1);
                    moduleInfo.obj[moduleInfo.nextWord] = obj;
                }
                else {
                    throw "No namespace found";
                }
            }
        }
        var subs = obj[__subs__];
        if (subs) {
            for (var path in subs) {
                var valPath = subs[path];
                var pathInfo = getObjFromPath(obj, path, false, 1);
                if (valPath.indexOf(fnHeader) === 0) {
                    var fn = eval("(" + valPath + ")");
                    pathInfo.obj[pathInfo.nextWord] = fn;
                }
                else {
                    var val = getObjFromPath(window, subs[path]);
                    pathInfo.obj[pathInfo.nextWord] = val.obj;
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
    function compare2Objects(x, y) {
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
    function validateIdempotence(objOrGetter, stringifyOptions, objectifyOptions) {
        var str = stringify(objOrGetter, stringifyOptions);
        if (objectifyOptions && objectifyOptions.getter) {
            var g = getGlobalObject();
            var path = getModuleName(objectifyOptions.getter.toString());
            var objContainer = getObjFromPath(g, path, false, 1);
            var splitPath = path.split('.');
            var lastWord = splitPath[splitPath.length - 1];
            delete objContainer.obj[lastWord];
            debugger;
        }
    }
    TSON.validateIdempotence = validateIdempotence;
    ////from http://stackoverflow.com/questions/2008279/validate-a-javascript-function-name
    //const validIdentifierName = /^[$A-Z_][0-9A-Z_$]*$/i;
    //function isValidIdentifierName(s: string) {
    //    return validIdentifierName.test(s);
    //}
    function getGlobalObject() {
        return typeof window !== "undefined" ? window :
            typeof WorkerGlobalScope !== "undefined" ? self :
                typeof global !== "undefined" ? global :
                    Function("return this;")();
    }
    TSON.getGlobalObject = getGlobalObject;
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
})(TSON.getGlobalObject());
