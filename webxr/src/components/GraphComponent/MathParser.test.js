import { parse } from './MathParser';

test('parse f(x,y) = cos(x) + sin(y)', () => {
    let result = parse('f(x,y) = cos(x) + sin(y)')
    expect(result.outputSize).toBe(1);
    expect(result.inputSize).toBe(2);
});

