// Definición de los tipos de tokens
const TokenType = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    OPERATOR: 'OPERATOR',
    NUMBER: 'NUMBER',
    SYMBOL: 'SYMBOL',
    INVALID: 'INVALID',
    ADDSUB: 'ADDSUB',
    EQUAL: 'EQUAL',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    LEFT1: 'LEFT1',
    RIGHT2: 'RIGHT2'
};

// Conjunto de palabras clave
const keywords = new Set(['int', 'INICIO', 'FIN', 'for', 'vacio']);

// lexico
function lexer(code) {
    let tokens = [];
    let currentPos = 0;
    const len = code.length;
    let line = 1;
    let column = 1;
    let inProgram = false; // Para rastrear si estamos dentro de INICIO y FIN

    while (currentPos < len) {
        let char = code[currentPos];

        if (!inProgram) {
            // Buscar la palabra clave 'INICIO' antes de comenzar a tokenizar
            if (char === 'I' && code.slice(currentPos, currentPos + 6) === 'INICIO') {
                inProgram = true;
                tokens.push({ type: TokenType.KEYWORD, value: 'INICIO', line, column });
                currentPos += 6;
                column += 6;
                continue;
            } else {
                currentPos++;
                column++;
                if (char === '\n') {
                    line++;
                    column = 1;
                }
                continue;
            }
        }

        if (char === ' ' || char === '\n') {
            if (char === '\n') {
                line++;
                column = 1;
            } else {
                column++;
            }
            currentPos++;
            continue;
        }

        if (char === '/' && currentPos + 1 < len && code[currentPos + 1] === '/') {
            currentPos += 2;
            while (currentPos < len && code[currentPos] !== '\n') {
                currentPos++;
                column++;
            }
            continue;
        }

        if (char === '/' && currentPos + 1 < len && code[currentPos + 1] === '*') {
            currentPos += 2;
            while (currentPos + 1 < len && !(code[currentPos] === '*' && code[currentPos + 1] === '/')) {
                if (code[currentPos] === '\n') {
                    line++;
                    column = 1;
                } else {
                    column++;
                }
                currentPos++;
            }
            currentPos += 2;
            column += 2;
            continue;
        }

        if (/^[a-zA-Z]+$/.test(char)) {
            let token = '';
            let tokenStartColumn = column;
            while (currentPos < len && /^[a-zA-Z0-9]+$/.test(code[currentPos])) {
                token += code[currentPos];
                currentPos++;
                column++;
            }
            if (keywords.has(token)) {
                tokens.push({ type: TokenType.KEYWORD, value: token, line, column: tokenStartColumn });
                if (token === 'FIN') {
                    inProgram = false; // Detener el analisis después de FIN
                    break;
                }
            } else {
                tokens.push({ type: TokenType.IDENTIFIER, value: token, line, column: tokenStartColumn });
            }
            continue;
        }

        if (/\d/.test(char)) {
            let token = '';
            let tokenStartColumn = column;
            while (currentPos < len && /\d/.test(code[currentPos])) {
                token += code[currentPos];
                currentPos++;
                column++;
            }
            tokens.push({ type: TokenType.NUMBER, value: token, line, column: tokenStartColumn });
            continue;
        }

        switch (char) {
            case '+':
            case '-':
                tokens.push({ type: TokenType.ADDSUB, value: char, line, column });
                currentPos++;
                column++;
                break;
            case '*':
            case '/':
                tokens.push({ type: TokenType.OPERATOR, value: char, line, column });
                currentPos++;
                column++;
                break;
            case '=':
                tokens.push({ type: TokenType.EQUAL, value: char, line, column });
                currentPos++;
                column++;
                break;
            case '(':
                tokens.push({ type: TokenType.LEFT, value: char, line, column });
                currentPos++;
                column++;
                break;
            case ')':
                tokens.push({ type: TokenType.RIGHT, value: char, line, column });
                currentPos++;
                column++;
                break;
            case '{':
                tokens.push({ type: TokenType.LEFT1, value: char, line, column });
                currentPos++;
                column++;
                break;
            case '}':
                tokens.push({ type: TokenType.RIGHT2, value: char, line, column });
                currentPos++;
                column++;
                break;
            default:
                let invalidToken = '';
                let invalidTokenStartColumn = column;
                while (currentPos < len && !/[a-zA-Z0-9]/.test(code[currentPos]) && code[currentPos] !== ' ' && code[currentPos] !== '\n') {
                    invalidToken += code[currentPos];
                    currentPos++;
                    column++;
                }
                tokens.push({ type: TokenType.INVALID, value: invalidToken, line, column: invalidTokenStartColumn });
                break;
        }
    }

    return tokens;
}

// Definicion de las clases de nodos del AST
class Num {
    constructor(value) {
        this.value = value;
    }
}

class Var {
    constructor(name) {
        this.name = name;
    }
}

class BinaryOperation {
    constructor(left, operator, right) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

class Declaration {
    constructor(identifier, expression) {
        this.identifier = identifier;
        this.expression = expression;
    }
}

class Assignment {
    constructor(identifier, expression) {
        this.identifier = identifier;
        this.expression = expression;
    }
}

class ForLoop {
    constructor(iterations, body) {
        this.iterations = iterations;
        this.body = body;
    }
}

class Function {
    constructor(name, body) {
        this.name = name;
        this.body = body;
    }
}

class Program {
    constructor(body) {
        this.body = body;
    }
}

//analisis sintactico descendente recursivo
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentTokenIndex = 0;
        this.errors = []; // Agregar arreglo para almacenar errores
    }

    getCurrentToken() {
        return this.tokens[this.currentTokenIndex];
    }

    eat(tokenType) {
        if (this.getCurrentToken().type === tokenType) {
            this.currentTokenIndex++;
        } else {
            this.errors.push(`Error: en linea ${this.getCurrentToken().line}`);
            // Avanzar el índice del token aunque haya un error para seguir parseando
            this.currentTokenIndex++;
        }
    }

    parse() {
        try {
            const programNode = this.parseProgram();
            if (this.errors.length > 0) {
                return { success: false, errors: this.errors };
            }
            return { success: true, ast: programNode };
        } catch (error) {
            console.error(error.message);
            return { success: false, error: error.message, errors: this.errors };
        }
    }

    parseProgram() {
        this.eat(TokenType.KEYWORD); // INICIO
        this.eat(TokenType.LEFT1); // {
        const body = this.parseCuerpo();
        this.eat(TokenType.RIGHT2); // }
        this.eat(TokenType.KEYWORD); // FIN
        return new Program(body);
    }

    parseCuerpo() {
        const body = [];
        while (this.getCurrentToken().type !== TokenType.RIGHT2) { 
            if (this.getCurrentToken().type === TokenType.KEYWORD && this.getCurrentToken().value === 'int') {
                body.push(this.parseDeclaracion());
            } else if (this.getCurrentToken().type === TokenType.IDENTIFIER) {
                body.push(this.parseAsignacion());
            } else if (this.getCurrentToken().type === TokenType.KEYWORD && this.getCurrentToken().value === 'for') {
                body.push(this.parseCiclo());
            } else if (this.getCurrentToken().type === TokenType.KEYWORD && this.getCurrentToken().value === 'vacio') {
                body.push(this.parseFuncion());
            } else {
                this.errors.push(`Error inesperado: en línea ${this.getCurrentToken().line}`);
                this.currentTokenIndex++; // Avanzar al siguiente token
            }
        }
        return body;
    }

    parseDeclaracion() {
        this.eat(TokenType.KEYWORD); // int
        const identifier = this.getCurrentToken().value;
        this.eat(TokenType.IDENTIFIER);
        this.eat(TokenType.EQUAL); 
        const expression = this.parseExpresion();
        return new Declaration(identifier, expression);
    }

    parseAsignacion() {
        const identifier = this.getCurrentToken().value;
        this.eat(TokenType.IDENTIFIER);
        this.eat(TokenType.EQUAL); 
        const expression = this.parseExpresion();
        return new Assignment(identifier, expression);
    }

    parseCiclo() {
        this.eat(TokenType.KEYWORD); // for
        this.eat(TokenType.LEFT); // (
        const iterations = parseInt(this.getCurrentToken().value);
        this.eat(TokenType.NUMBER);
        this.eat(TokenType.RIGHT); // )
        this.eat(TokenType.LEFT1); // {
        const body = this.parseCuerpo();
        this.eat(TokenType.RIGHT2); // }
        return new ForLoop(iterations, body);
    }

    parseFuncion() {
        this.eat(TokenType.KEYWORD); // vacio
        const name = this.getCurrentToken().value;
        this.eat(TokenType.IDENTIFIER);
        this.eat(TokenType.LEFT); // (
        this.eat(TokenType.RIGHT); // )
        this.eat(TokenType.LEFT1); // {
        const body = this.parseCuerpo();
        this.eat(TokenType.RIGHT2); // }
        return new Function(name, body);
    }

    parseExpresion() {
        let node = this.parseTermino();
        while (this.getCurrentToken().type === TokenType.ADDSUB) {
            const operator = this.getCurrentToken().value;
            this.eat(TokenType.ADDSUB);
            node = new BinaryOperation(node, operator, this.parseTermino());
        }
        return node;
    }

    parseTermino() {
        let node = this.parseFactor();
        while (this.getCurrentToken().type === TokenType.OPERATOR && (this.getCurrentToken().value === '*' || this.getCurrentToken().value === '/')) {
            const operator = this.getCurrentToken().value;
            this.eat(TokenType.OPERATOR);
            node = new BinaryOperation(node, operator, this.parseFactor());
        }
        return node;
    }

    parseFactor() {
        const token = this.getCurrentToken();
        if (token.type === TokenType.NUMBER) {
            this.eat(TokenType.NUMBER);
            return new Num(parseInt(token.value));
        } else if (token.type === TokenType.IDENTIFIER) {
            this.eat(TokenType.IDENTIFIER);
            return new Var(token.value);
        } else if (token.type === TokenType.LEFT) {
            this.eat(TokenType.LEFT); // (
            const node = this.parseExpresion();
            this.eat(TokenType.RIGHT); // )
            return node;
        } else {
            this.errors.push(`Error: en linea ${token.line}`);
            this.currentTokenIndex++; // Avanzar al siguiente token
            return null; // Retornar nulo si hay un error
        }
    }
}