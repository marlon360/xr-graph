import { MathExpression } from './MathExpression';

test('parse with f(x,y)', () => {
    let expression = new MathExpression('f(x,y) = cos(x) + sin(y)')
    expect(expression.getOutputSize()).toBe(1);
    expect(expression.getInputSize()).toBe(2);
});

test('parse without f(x,y)', () => {
    let expression = new MathExpression('cos(x) + sin(y)')
    expect(expression.getOutputSize()).toBe(1);
    expect(expression.getInputSize()).toBe(2);
});

test('parse data parameter x,y without f(x,y)', () => {
    let expression = new MathExpression('cos(a * x) + sin(b * y)')
    expect(expression.getParameters()).toStrictEqual(["x", "y"]);
    expect(expression.getVariables()).toStrictEqual(["a", "b"]);
});

test('parse data parameter u,v without f(u,v)', () => {
    let expression = new MathExpression('cos(a * u) + sin(b * v)')
    expect(expression.getParameters()).toStrictEqual(["u", "v"]);
    expect(expression.getVariables()).toStrictEqual(["a", "b"]);
});

test('parse vector output', () => {
    let expression = new MathExpression('[x, y, x]')
    expect(expression.getOutputSize()).toBe(3);
    expect(expression.getInputSize()).toBe(2);
});

test('parse data parameters', () => {
    let expression = new MathExpression('f(x,y) = cos(x) + sin(y)')
    expect(expression.getParameters()).toStrictEqual(["x", "y"]);
});

test('parse extra parameters', () => {
    let expression = new MathExpression('f(x,y) = cos(a * x) + sin(b * y)')
    expect(expression.getVariables()).toStrictEqual(["a", "b"]);
});

test('parse data and extra parameters with curve', () => {
    let expression = new MathExpression('f(t) = [cos(t), sin(t), t]')
    expect(expression.getParameters()).toStrictEqual(["t"]);
    expect(expression.getVariables().length).toBe(0);
});

