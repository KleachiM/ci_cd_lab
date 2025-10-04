const { add, multiply, greet, subtract, divide, power } = require('../src/app');
describe('Math functions', () => {
    test('adds 2 + 3 to equal 5', () => {
        expect(add(2, 3)).toBe(6);
    });
    test('multiplies 4 * 5 to equal 20', () => {
        expect(multiply(4, 5)).toBe(20);
    });
    test('should fail this test initially', () => {
        expect(add(1, 1)).toBe(2); // Специально неверный тест
    });
});
describe('Greet function', () => {
    test('greets user correctly', () => {
        expect(greet('World')).toBe('Hello, World!');
    });
})
describe('Additional math functions', () => {
    test('subtracts 5 - 3 to equal 2', () => {
        expect(subtract(5, 3)).toBe(2);
    });
    test('divides 10 / 2 to equal 5', () => {
        expect(divide(10, 2)).toBe(5);
    });
    test('throws error on division by zero', () => {
        expect(() => divide(10, 0)).toThrow('Division by zero');
    });
});