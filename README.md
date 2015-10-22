# TSON

An extension of JSON that supports functions, and references to static objects and functions present in the runtime environment.

What does TSON stand for?

1)  Tasmanian School of Nursing
2)  TypeScript Object Notation, or 
2)  Textual Serialization Of eNtities (for people who don't like to use TypeScript).

What problems does TSON solve?

## Problem 1

The set of objects for which the output of the JSON.stringify function  can be reversed using the standard JSON.parse function -- 
resulting in an object with the same exact data and behavior -- is quite small.  This is because critical JavaScript elements, such as inline or
referenced functions, get washed away when performing JSON.stringify(), and thus is unrecoverable when performing JSON.parse().  In 
mathematical terms, let's refer to the transformation T => JSON.parse(JSON.stringify(T)) as 
the JSON clone process. [See this mention of using JSON to clone an object](http://heyjavascript.com/4-creative-ways-to-clone-objects/).

The set of objects obj for which the JSON clone process results in a true clone, where objCopy is indistinguishable from obj,
after apply the JSON clone process:

```javascript
    const objClone = JSON.parse(JSON.stringify(obj))
```

is quite restrictive.   What qualifies?  Basically, objects with only fields of primitive numbers, strings, booleans, and/or, 
recursively, sub objects / arrays of sub objects, with the same limitation. This is the entirety of the "idempotent" universe 
of JavaScript objects, from the point of view of the JSON clone function.

TSON expands the universe of cloneable objects, by adding support for inline functions.  But that's not the only added support TSON provides.


## Problem 2:

A JavaScript object may have fields which are references to large, complex external objects.  The standard JSON serialization lacks support for 
binding expressions to external objects.  The resulting JSON text thus must contain a copy of the object, which is wasteful.  Aso, if the referenced object
contains inline functions, those too will be washed away.  Furthermore
should we deserialize the string, it winds up with a forked copy of the referenced object.

TSON can preserve these references after doing a TSON clone, and the size of the TSON serialization string is significantly smaller in these cases.

TSON uses the native JSON function under the hood, and the serialized string is fully compatible with JSON parsers.  But the serialized text has enough
extra information to be able to restore the inline functions (Problem 1) as well as object references (Problem 2), assuming you use the TSON api.

## The TSON API

### Simple

The simplest example is very similar to the JavaScript native JSON api:

```javascript
    const serializedString = TSON.stringify(entity);
```

To reverse the serialization back to an object:

```javascript
    const copyOfEntity = TSO.objectify(serializedString)
```

To test whether copyOfObject matches the original entity, TSON includes a reference object comparer function:

```javascript
    const isEqual = TSO.isEqual(entity, copyOfEntity)
```

The implementation of TSO.isEqual was lifted from [Stack Overflow -- see 
the slow and generic method] ( http://stackoverflow.com/questions/1068834/object-comparison-in-javascript )
