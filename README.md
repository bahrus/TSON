# TSON

An extension of JSON that supports functions, and references to static objects and functions present in the runtime environment.

What does TSON stand for?

1.  Tasmanian School of Nursing
2.  TypeScript Object Notation (the library is written in TypeScript and is inspired by some TypeScript features, but using it doesn't require TypeScript), or 
3.  Textual Serialization Of eNtities (for people who don't like to use TypeScript).

## What problems does TSON solve?

### Problem 0

Really, the goal of TSON is to enable more robust configuration DSL's than what JSON provides.  But that is not very precise.  The following problems provide
more precision.

### Problem 1

The set of objects for which the output of the JSON.stringify function  can be reversed using the standard JSON.parse function -- 
resulting in an object with the same exact data and behavior -- is quite small.  Although JSON stands for "JavaScript Object Notation", 
objects are supposed to encompass more than just data.  They should encompass methods / functions as well.  But with JSON.stringify,  the methods get 
washed away when performing JSON.stringify(), and thus is unrecoverable when performing JSON.parse().  Let's refer to 
the transformation T => JSON.parse(JSON.stringify(T)) as 
"the JSON clone process". [See this mention of using JSON to clone an object](http://heyjavascript.com/4-creative-ways-to-clone-objects/).

The set of objects obj for which the JSON clone process results in a true clone, where objCopy is indistinguishable from obj,
after applying the JSON clone process:

```javascript
    const objClone = JSON.parse(JSON.stringify(obj))
```

is quite restrictive.   What qualifies?  Basically, objects with only fields of primitive numbers, strings, booleans, and/or, 
recursively, sub objects / arrays of sub objects, with the same limitation. In mathematical terms, this is the entirety of the "idempotent" universe 
of JavaScript objects, from the point of view of the JSON clone process.

TSON expands the universe of cloneable objects, where the TSON clone process is idempotent, by adding support for inline functions.  But that's not the 
only added support TSON provides.


### Problem 2:

A JavaScript object may have fields which are references to large, complex externally (or internally) defined objects.  The standard JSON serialization lacks support for 
binding expressions to other objects.  The resulting JSON text thus must contain a copy of the object, which is wasteful, if the deserialization process
will have access to those already defined objects.  Also, if the referenced object contains inline functions, those too will be washed 
away (see problem 1).  Furthermore, should we deserialize the string using JSON.parse, it winds up with a forked copy of the referenced object.

TSON can preserve these references after doing a TSON clone, and as a result, the size of the TSON serialization string is significantly 
smaller in these cases.  Furthermore, we may want these references to remain references after deserializing, so that changes to the external reference
are reflected in the deserialized object.

## TSON builds on JSON

TSON uses the native JSON function under the hood, and the serialized string is fully compatible with JSON parsers.  But the serialized text has enough
extra information to be able to restore the inline functions (Problem 1) as well as object references (Problem 2), assuming 
you use the TSON api properly (or some variation).

## Aspects of JSON that TSON does not sacrifice (ish)

One important constraint on JSON, which TSON mostly adheres to, is the principle that one can parse a JSON string with absolute confidence that 
doing so will have no side effects, other than those caused by the necessary cpu and memory requirements of performing the parse operation.

TSON is not quite so airtight when it comes to guaranteeing no side effects.  In particular, because of its support for external references (Problem 2), 
if one defines an external reference binding which contains a static property getter, then it is possible for the deserialization process to 
execute code.  We will look at an example of this below, just to make this abundantly clear.  But typically property getters are not expected 
to have side effects, and some extra precautions can be utilized to prevent this, which we will show below. 

But this constraint is responsible for some limitations on the universe of idempotent objects with respect to the TSON clone process.

## Problems TSON does not solve

### Problem 1:  Dry, wrinkly skin

### Problem 2:  Deserializing to a new instance of a class

Many lanuages, like Java and C#, allow deserializing to an instance of a class, where that class could have a constructor which performs operations,
which can easily result in side effects.  Our interest in adhering to the side-effect guarantee means that TSON does not support instantiating ES 2015 classes
during deserialization.

## The TSON API

### Simple

Say we start with a simple object, holding a single function:

```javascript
    const myObjectWithAFunction = {
        fnTest: function(a, b, c){
            return a + b - c;
        }
    };
```

To serialize and deserialize this objectis very similar to the JavaScrfipt native JSON api:

```javascript
const serializedObjectWithAFunction = TSON.stringify(myObjectWithAFunction);
const clonedObjectWithAFunction = TSON.objectify(serializedObjectWithAFunction);
console.log(clonedObjectWithAFunction.fnTest(1, 2, 3));
//0

```
Whereas the JSON equivelent would have given an error (fnTest not defined), TSON is able to recover the function during
deserialization.

### Other helper functions.

To test whether copyOfObject matches the original entity, TSON includes a reference object comparer function:

```javascript
    const isEqual = TSO.isEqual(entity, copyOfEntity)
```

The implementation of TSON.isEqual was lifted from [Stack Overflow -- see 
the slow and generic method] ( http://stackoverflow.com/questions/1068834/object-comparison-in-javascript ).  Note that
this comparer does compare function via comparison of applying the toString() method on them.

Another convenience function TSON provides is a validator function:

```javascript
    const isSerializable = TSO.validateIdempotence(obj)
```

A demo page {TODO] allows you to try your hand at creating a Javascript object, and testing if it is idempotent under
the TSON clone process.

So far in what we've discussed, we have solved Problem 1 above, and we have done so without sacrificing JSON's side-effect free guarantee.

But to solve problem 2 above, the API gets slight more complicated.

### Custom Serializing

A number of customizations are available to enhance and fine tune how the serialization process works.  

The most important customization relates to references.  

Take this example

```javascript
const referenceObject = {
    refString: 'originalValue'
};
const referencerObject = {
    myRef: referenceObject,
};
referenceObject.refString = 'newValue';
console.log(referencerObject.myRef.refString);
//newValue
```

But if we first clone referencerObject, using JSON or simple TSON, we break the connection with the referenceObject

```javascript
const referenceObject = {
    refString: 'originalValue'
};
const referencerObject = {
    myRef: referenceObject,
};
const clonedObject = JSON.parse(JSON.stringify(referencerObject));
referenceObject.refString = 'newValue';
console.log(clonedObject.myRef.refString);
//originalValue
```

If this is not the desired behavior, TSON can fix this thusly:

```javascript
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
//newValue                     
```

In this case, the refs array refers to a variable in local scope.  One can also reference objects from the global scope, depending