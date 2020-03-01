import { Parser } from 'expr-eval';
import expressionToGlslString from './expression-to-glsl-string';


export class MathExpression {
    constructor(input, parameters = ["u", "v", "x", "y", "t"]) {

        this.Parser = new Parser();
        this.Parser.consts.e = this.Parser.consts.E;

        let declarationPart, definitionPart;

        // if in form of f(x,y) = ... choose the parameters of function declaration
        if (input.includes('=')) {
            const stringParts = input.split("=");
            if (stringParts.length > 2) {
                throw new Error("Multiple '=' are not allowed")
            }

            declarationPart = stringParts[0];
            definitionPart = stringParts[1];

            // get parameters of the decalration part
            this.parameters = this.getFunctionParameters(declarationPart);
        } else {
            definitionPart = input;
            // get all parameters of input
            this.parameters = this.getAllVariables(definitionPart);
            // if custom paramters defined, filter by this parameters
            if (parameters != null) {
                this.parameters = this.parameters.filter((param) => {
                    return parameters.includes(param);
                })
            }
        }
        
        // use all variables which are not parameters as variables
        let allVariables = this.getAllVariables(definitionPart);
        this.variables = allVariables.filter((param) => {
            return !this.parameters.includes(param)
        })


        this.expression = this.Parser.parse(definitionPart)
        this.inputSize = this.parameters.length;

        const parameterArray = new Array(this.inputSize).fill(0);
        let extraParams = {};
        this.variables.forEach(param => {
            extraParams[param] = 1
        });
        const tempFunc = this.getJSFunction(extraParams);
        const tempResult = tempFunc(...parameterArray);
        this.outputSize = 1;
        if (Array.isArray(tempResult)) {
            this.outputSize = tempResult.length;
        }

        function toGLSL(expression, variables) {
            return expressionToGlslString(expression.simplify(variables).tokens);
        }

        this.glslFunction = toGLSL(this.expression, allVariables.join(","))

    }

    getJSFunction(variables) {
        return this.expression.toJSFunction(this.parameters.join(","), variables);;
    }

    getInputSize() {
        return this.inputSize;
    }

    getOutputSize() {
        return this.outputSize;
    }

    getGLSLFunctionString() {
        return this.glslFunction
    }

    getParameters() {
        return this.parameters
    }

    getVariables() {
        return this.variables
    }

    // private methods
    
    getAllVariables(input) {
        return this.Parser.parse(input).variables();
    }

    getFunctionParameters(input) {
        const tokens = this.Parser.parse(input).tokens;
        let nstack = [];
        for (var i = 0; i < tokens.length; i++) {
            var item = tokens[i];
            var type = item.type;
            if (type === 'IFUNCALL') {
                let argCount = item.value;
                let args = [];
                while (argCount-- > 0) {
                    args.unshift(nstack.pop());
                }
                return args;
            }
            if (type === 'IVAR' || type === 'IVARNAME') {
                nstack.push(item.value);
            }
        }
    }

    stripFunctionDeclaration(input) {
        const stringParts = input.split("=");
        return stringParts[stringParts.length - 1];
    }

}

