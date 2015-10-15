# TSON

An extension of JSON that supports functions, and references to static objects and functions present in the runtime environment.

What problems does TSON solve?

Problem 1:  

The set of objects for which the output of the JSON.stringify function  can be reversed using the standard JSON.parse function - 
resulting in an object with the same exact data and behavior --  is quite small.  This is because critical JavaScript elements, such as inline or 
referenced functions, get washed away when performing JSON.stringify(), and thus is unrecoverable when performing
JSON.parse().  In mathematical terms, the set of objects obj for which objCopy is indistinguishable from obj
in the following transformation / mapping:

    objCopy = JSON.parse(JSON.stringify(obj))

is quite restrictive.  What qualifies?  Basically, objects with only fields of primitive numbers, strings, booleans, and/or, 
recursively, sub objects / arrays, with the same limitation. This is the entirety of the "idempotent" universe 
of JavaScript objects, from the point of view of T => JSON.parse(JSON.stringify(T)).

Problem 2:

A JavaScript object may have fields which are references to external objects.  The standard JSON serialization lacks support for 
binding expressions to external objects.  The resulting JSON text thus must contain a copy of the object, which is wasteful.  Furthermore
should we deserialize the string, it winds up with a forked copy of the referenced object.

Syntax:
