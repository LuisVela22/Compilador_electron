// Definición de los tipos de tokens
const TokenType = {
    KEYWORD: 'KEYWORD',
    IDENTIFIER: 'IDENTIFIER',
    OPERATOR: 'OPERATOR',
    NUMBER: 'NUMBER',
    SEMICOLON: 'SEMICOLON',
    SYMBOL: 'SYMBOL',
    INVALID: 'INVALID'
};

// Conjunto de palabras clave
const keywords = new Set(['int', 'INICIO', 'FIN', 'for', 'vacio']);

// Función lexer para convertir código en tokens
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
                tokens.push({ type: TokenType.OPERATOR, value: char, line, column })
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

// Parser
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentPos = 0;
        this.errors = [];
    }

    currentToken() {
        return this.tokens[this.currentPos];
    }

    match(type) {
        if (this.currentToken() && this.currentToken().type === type) {
            this.currentPos++;
            return true;
        }
        return false;
    }

    matchValue(type, value) {
        if (this.currentToken() && this.currentToken().type === type && this.currentToken().value === value) {
            this.currentPos++;
            return true;
        }
        return false;
    }

    error(message) {
        const token = this.currentToken();
        const line = token ? token.line : 'unknown';
        const column = token ? token.column : 'unknown';
        this.errors.push(`Error: ${message} en la línea ${line}, columna ${column}`);
    }

    parse() {
        this.errors = [];

        if (this.parsePrograma()) {
            if (this.errors.length === 0) {
                console.log('COMPILACION EXITOSA!!!');
            } else {
                console.log('Errores de compilación:\n');
            }
        } else {
            console.log('Errores de compilación:\n');
        }
    }

    parsePrograma() {
        if (this.matchValue(TokenType.KEYWORD, 'INICIO') && this.matchValue(TokenType.SYMBOL, '{')) {
            this.parseCuerpo();
            if (this.matchValue(TokenType.SYMBOL, '}') && this.matchValue(TokenType.KEYWORD, 'FIN')) {
                if (this.currentPos < this.tokens.length) {
                    this.error("Tokens adicionales después de 'FIN'");
                }
                return true;
            } else {
                this.error("Se esperaba '}' o 'FIN'");
            }
        } else {
            this.error("Se esperaba 'INICIO' seguido de '{'");
        }
        return false;
    }
        
    
    parseCuerpo() {
        // Intentar parsear cada componente del cuerpo
        if (this.parseDeclaracion() || this.parseAsignacion() || this.parseCiclo() || this.parseFuncion()) {
            // Si alguno de los parseos fue exitoso, retornar true
            return true;
        } 
        //else if
        else {
            // Manejar el caso de un token inesperado
            const token = this.currentToken();
            if (token && token.type !== TokenType.SYMBOL && token.type !== TokenType.KEYWORD) {
                this.error(`Token inesperado '${token.value}' en la línea ${token.line}, columna ${token.column}`);
                // Avanzar la posición de los tokens para intentar continuar con el análisis
                this.currentPos++;
                return false;
            }
            // No se encontró ningún elemento esperado, retornar false
            return false;
        }
    }
    
    
    parseDeclaracion() {
        if (this.matchValue(TokenType.KEYWORD, 'int')) {
            if (this.match(TokenType.IDENTIFIER) && this.matchValue(TokenType.SYMBOL, '=')) {
                if (this.parseExpresion()) {
                    return true;
                } else {
                    this.error("Error en la expresión");
                }
            } else {
                this.error("Error en la declaración de variable");
            }
        }
        return false;
    }
    
    parseAsignacion() {
        if (this.match(TokenType.IDENTIFIER) && this.matchValue(TokenType.SYMBOL, '=')) {
            if (this.parseExpresion()) {
                return true;
            } else {
                this.error("Error en la asignación");
            }
        }
        return false;
    }
    
    parseExpresion() {
        let left = this.parseExpresionPrima();
        if (!left) return false;
    
        while (this.matchValue(TokenType.OPERATOR, '+') || this.matchValue(TokenType.OPERATOR, '-')) {
            let operator = this.tokens[this.currentPos - 1];
            let right = this.parseExpresionPrima();
            if (!right) return false;
            left = new BinaryOperation(left, operator.value, right);
        }
        return left;
    }
    
    parseExpresionPrima() {
        let left = this.parseF();
        if (!left) return false;
    
        while (this.matchValue(TokenType.OPERATOR, '*') || this.matchValue(TokenType.OPERATOR, '/')) {
            let operator = this.tokens[this.currentPos - 1];
            let right = this.parseF();
            if (!right) return false;
            left = new BinaryOperation(left, operator.value, right);
        }
        return left;
    }
    
    parseF() {
        if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.NUMBER)) {
            return new Var(this.tokens[this.currentPos - 1].value);
        } else if (this.matchValue(TokenType.SYMBOL, '(')) {
            let expression = this.parseExpresion();
            if (!expression) return false;
            if (!this.matchValue(TokenType.SYMBOL, ')')) {
                this.error("Se esperaba ')' después de la expresión");
                return false;
            }
            return expression;
        }
        return false;
    }
    
    parseCiclo() {
        if (this.matchValue(TokenType.KEYWORD, 'for') && this.matchValue(TokenType.SYMBOL, '(')) {
            if (this.match(TokenType.NUMBER) && this.matchValue(TokenType.SYMBOL, ')') && this.matchValue(TokenType.SYMBOL, '{')) {
                while (this.parseCuerpo()) { } // Aquí se parsea el cuerpo del ciclo correctamente
                if (!this.matchValue(TokenType.SYMBOL, '}')) {
                    this.error("Se esperaba '}' al final del ciclo 'for'");
                    return false;
                }
                return true;
            } else {
                this.error("Error en la estructura del ciclo 'for'");
            }
        }
        return false;
    }
    
    parseFuncion() {
        if (this.matchValue(TokenType.KEYWORD, 'vacio')) {
            if (this.match(TokenType.IDENTIFIER) && this.matchValue(TokenType.SYMBOL, '(')) {
                if (this.matchValue(TokenType.SYMBOL, ')') && this.matchValue(TokenType.SYMBOL, '{')) {
                    while (this.parseAsignacion() || this.parseDeclaracion() || this.parseCiclo() || this.parseFuncion()) { }
                    if (!this.matchValue(TokenType.SYMBOL, '}')) {
                        this.error("Se esperaba '}' al final de la función");
                        return false;
                    }
                    return true;
                } else {
                    this.error("Error en la estructura de la función");
                }
            } else {
                this.error("Error en la declaración de la función");
            }
        }
        return false;
    }
}     

// Código de ejemplo
const code = `
INICIO {
    int x = 5
    x = x + 10
    for (5) {
        x = x * 2
    }
    vacio main() {
        x = x - 1
    }
}
FIN
`;

// Convertir código en tokens
const tokens = lexer(code);

// Crear una instancia del parser y analizar los tokens
const parser = new Parser(tokens);
parser.parse();
