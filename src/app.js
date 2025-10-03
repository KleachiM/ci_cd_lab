function add(a, b) {
    return a + b;
}

function multiply(a, b) {
    return a * b;
}

function greet(name) {
    return `Hello, ${name}!`;
}

function subtract(a, b) {
    return a - b;
}
function divide(a, b) {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return a / b;
}
module.exports = { add, multiply, greet, subtract, divide };
if (require.main === module) {
    console.log('Application started!');
    console.log('2 + 3 =', add(2, 3));
    console.log('4 * 5 =', multiply(4, 5));
    console.log(greet('Student'));
}