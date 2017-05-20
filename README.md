# TSON

An extension of JSON that supports functions, and references to static objects and functions present in the runtime environment.

What does TSON stand for?

1.  Tasmanian School of Nursing
2.  TypeScript Object Notation

## What problems does TSON solve?

### Problem 0

Really, the goal of TSON is to enable more robust configuration DSL's than what JSON provides.  But that is not very precise.  The following problems provide more precision.

### Problem 1
The extra verbiage of double quotes, lack of support for comments, trailing commas make editing JSON tedious and not very maintainable.  Lack of compile-time checks makes it quite error prone.

### Problem 2

When configuring complex components, like a grid, often JSON-like JavaScript is the preferred syntax.  But often those configuration settings should refer to functions or complex objects available elsewhere.  For example the markup might be something that needs to be loaded in the context of a UI component.

### Problem 3

The TypeScript Object Notation needs to be something than can be converted to JSON without any loss of information. This way, we can safely embed the JSON inside an html tag, for example, or retrieve the JSON via AJAX, and be guaranteed that the act of loading the JSON will have no unexpected side effects, without any developer approved actions.

