const { spawn } = require('child_process');
const path = require('path');
describe('Integration tests', () => {
    test('application starts without errors', (done) => {
        const appPath = path.join(__dirname, '..', 'src', 'app.js');
        const child = spawn('node', [appPath], { stdio: 'pipe' });
        let output = '';
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        child.on('close', (code) => {
            expect(code).toBe(0);
            expect(output).toContain('Application started!');
            expect(output).toContain('2 + 3 = 5');
            done();
        });
// Завершить процесс через небольшой промежуток времени
        setTimeout(() => {
            child.kill();
        }, 1000);
    });
});