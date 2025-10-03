const { add, multiply, greet } = require('../src/app');
describe('Math functions', () => {
    test('adds 2 + 3 to equal 5', () => {
        expect(add(2, 3)).toBe(5);
    });
    test('multiplies 4 * 5 to equal 20', () => {
        expect(multiply(4, 5)).toBe(20);
    });
    test('should fail this test initially', () => {
        expect(add(1, 1)).toBe(3); // Специально неверный тест
    });
});
describe('Greet function', () => {
    test('greets user correctly', () => {
        expect(greet('World')).toBe('Hello, World!');
    });
})