// Definición de los tipos de tokens
const TokenType = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    OPERATOR: 'OPERATOR',
    NUMBER: 'NUMBER',
    SYMBOL: 'SYMBOL',
    INVALID: 'INVALID'
};

// Conjunto de palabras clave
const keywords = new Set(['int', 'INICIO', 'FIN', 'for', 'vacio']);

// Función del lexer
function lexer(code) {
    let tokens = [];
    let currentPos = 0;
    const len = code.length;
    let line = 1;
    let column = 1;

    while (currentPos < len) {
        let char = code[currentPos];

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
            case '*':
            case '/':
                tokens.push({ type: TokenType.OPERATOR, value: char, line, column });
                currentPos++;
                column++;
                break;
            case '=':
            case '(':
            case ')':
            case '{':
            case '}':
                tokens.push({ type: TokenType.SYMBOL, value: char, line, column });
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

// Definición de las clases de nodos del AST
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

// Implementación del Parser
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentTokenIndex = 0;
    }

    getCurrentToken() {
        return this.tokens[this.currentTokenIndex];
    }

    eat(tokenType) {
        if (this.getCurrentToken().type === tokenType) {
            this.currentTokenIndex++;
        } else {
            throw new Error(`Error: Expected token type ${tokenType} but got ${this.getCurrentToken().type}`);
        }
    }

    parse() {
        try {
            const programNode = this.parseProgram();
            return { success: true, ast: programNode };
        } catch (error) {
            console.error(error.message);
            return { success: false, error: error.message };
        }
    }

    parseProgram() {
        this.eat(TokenType.KEYWORD); // INICIO
        this.eat(TokenType.SYMBOL); // {
        const body = this.parseCuerpo();
        this.eat(TokenType.SYMBOL); // }
        this.eat(TokenType.KEYWORD); // FIN
        return new Program(body);
    }

    parseCuerpo() {
        const body = [];
        while (this.getCurrentToken().type !== TokenType.SYMBOL || this.getCurrentToken().value !== '}') {
            if (this.getCurrentToken().type === TokenType.KEYWORD && this.getCurrentToken().value === 'int') {
                body.push(this.parseDeclaracion());
            } else if (this.getCurrentToken().type === TokenType.IDENTIFIER) {
                body.push(this.parseAsignacion());
            } else if (this.getCurrentToken().type === TokenType.KEYWORD && this.getCurrentToken().value === 'for') {
                body.push(this.parseCiclo());
            } else if (this.getCurrentToken().type === TokenType.KEYWORD && this.getCurrentToken().value === 'vacio') {
                body.push(this.parseFuncion());
            } else {
                break;
            }
        }
        return body;
    }

    parseDeclaracion() {
        this.eat(TokenType.KEYWORD); // int
        const identifier = this.getCurrentToken().value;
        this.eat(TokenType.IDENTIFIER);
        this.eat(TokenType.SYMBOL); // =
        const expression = this.parseExpresion();
        return new Declaration(identifier, expression);
    }

    parseAsignacion() {
        const identifier = this.getCurrentToken().value;
        this.eat(TokenType.IDENTIFIER);
        this.eat(TokenType.SYMBOL); // =
        const expression = this.parseExpresion();
        return new Assignment(identifier, expression);
    }

    parseCiclo() {
        this.eat(TokenType.KEYWORD); // for
        this.eat(TokenType.SYMBOL); // (
        const iterations = parseInt(this.getCurrentToken().value);
        this.eat(TokenType.NUMBER);
        this.eat(TokenType.SYMBOL); // )
        this.eat(TokenType.SYMBOL); // {
        const body = this.parseCuerpo();
        this.eat(TokenType.SYMBOL); // }
        return new ForLoop(iterations, body);
    }

    parseFuncion() {
        this.eat(TokenType.KEYWORD); // vacio
        const name = this.getCurrentToken().value;
        this.eat(TokenType.IDENTIFIER);
        this.eat(TokenType.SYMBOL); // (
        this.eat(TokenType.SYMBOL); // )
        this.eat(TokenType.SYMBOL); // {
        const body = this.parseCuerpo();
        this.eat(TokenType.SYMBOL); // }
        return new Function(name, body);
    }

    parseExpresion() {
        let node = this.parseTermino();
        while (this.getCurrentToken().type === TokenType.OPERATOR && (this.getCurrentToken().value === '+' || this.getCurrentToken().value === '-')) {
            const operator = this.getCurrentToken().value;
            this.eat(TokenType.OPERATOR);
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
        } else if (token.type === TokenType.SYMBOL && token.value === '(') {
            this.eat(TokenType.SYMBOL); // (
            const node = this.parseExpresion();
            this.eat(TokenType.SYMBOL); // )
            return node;
        } else {
            throw new Error(`Error: Unexpected token ${token.value}`);
        }
    }
}

// Ejemplo de uso
const code = `
INICIO {
    int a = 5
    int b = 10
    for (2) {
        a = a + b * 2
        for(3){
            a = 3
            for(34){
            }
        }
    }

    vacio dfg())}
} FIN
`;

const tokens = lexer(code);
const parser = new Parser(tokens);
const result = parser.parse();
console.log(result.success); // Devuelve true si la compilación fue exitosa, false si hubo errores
console.log(JSON.stringify(result.ast, null, 2)); // Muestra el AST generado
