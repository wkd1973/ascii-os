"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = void 0;
const parseArgs = (line) => {
    const tokens = [];
    let current = "";
    let inQuotes = false;
    let escaping = false;
    for (const char of line) {
        if (escaping) {
            current += char;
            escaping = false;
            continue;
        }
        if (char === "\\") {
            escaping = true;
            continue;
        }
        if (char === "\"") {
            inQuotes = !inQuotes;
            continue;
        }
        if (!inQuotes && /\s/.test(char)) {
            if (current.length > 0) {
                tokens.push(current);
                current = "";
            }
            continue;
        }
        current += char;
    }
    if (escaping) {
        current += "\\";
    }
    if (current.length > 0) {
        tokens.push(current);
    }
    return tokens;
};
exports.parseArgs = parseArgs;
