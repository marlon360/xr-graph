import { Parser } from 'expr-eval';

export function parse(input) {
    input = stripFunctionDeclaration(input);
    const func = Parser.parse(input).toJSFunction(getVariables(input).join(","));
    const inputSize = Parser.parse(input).variables().length;
    const parameterArray = new Array(inputSize).fill(0);

    const tempResult = Parser.parse(input).toJSFunction(getVariables(input).join(","))(...parameterArray);
    let outputSize = 1;
    if (Array.isArray(tempResult)) {
        outputSize = tempResult.length;
    }

    return {
        func, inputSize, outputSize
    }
}

function getVariables(input) {
    return Parser.parse(input).variables();
}

function stripFunctionDeclaration(input) {
    const stringParts = input.split("=");
    return stringParts[stringParts.length - 1];
}

