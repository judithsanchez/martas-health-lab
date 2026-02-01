import '@testing-library/jest-dom';

// Polyfill for File.arrayBuffer() which is missing in some JSDOM versions
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
    File.prototype.arrayBuffer = function () {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(this);
        });
    };
}
