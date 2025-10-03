function add(a, b) {
    return a + b;
}

function multiply(a, b) {
    return a * b;
}

function greet(name) {
    return `Hello, ${name}!`;
}

module.exports = { add, multiply, greet };
if (require.main === module) {
    console.log('Application started!');
    console.log('2 + 3 =', add(2, 3));
    console.log('4 * 5 =', multiply(4, 5));
    console.log(greet('Student'));
}