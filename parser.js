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
        //const column = token ? token.column : 'unknown';
        this.errors.push(`Error: ${message} en la línea ${line}`);
    }

    parse() {
        const output = document.getElementById('output');
        output.innerHTML = '';
        this.errors = [];

        if (this.parsePrograma()) {
            if (this.errors.length === 0) {
                output.innerHTML = 'COMPILACION EXITOSA!!!';
            } else {
                output.innerHTML = 'Errores de compilación:<br>' + this.errors.join('<br>');
            }
        } else {
            output.innerHTML = 'Errores de compilación:<br>' + this.errors.join('<br>');
        }
        
    }

    parsePrograma() {
        if (this.matchValue(TokenType.KEYWORD, 'INICIO') && this.matchValue(TokenType.SYMBOL, '{')) {
            if (this.parseCuerpo()) {
                if (this.matchValue(TokenType.SYMBOL, '}') && this.matchValue(TokenType.KEYWORD, 'FIN')) {
                    if (this.currentPos < this.tokens.length) {
                       // this.error("Tokens adicionales después de 'FIN'");
                    }
                    return true;
                } else {
                    this.error("Se esperaba '}' o 'FIN'");
                }
            } else {
                // Si parseCuerpo() retorna false, ya habrá manejado el error apropiadamente
            }
        } else {
            this.error("Se esperaba 'INICIO' seguido de '{'");
        }
        return false;
    }

    parseCuerpo() {
        // Intentar parsear cada componente del cuerpo
        
        if (this.parseDeclaracion() || this.parseAsignacion() || this.parseCiclo() || this.parseFuncion()) {
            // Si alguno de los parseos fue exitoso, continuar parseando el cuerpo
            if (this.parseCuerpo()) {
                return true; // Retorna true si se encontró y parseó al menos un componente
            } else {
                return false; // Si parseCuerpo retorna false, ya habrá manejado el error apropiadamente
            }
        } else {
            //this.error("FOR ME MANDO A LLAMAR");
            // Maneja el caso de que no se encuentre ningún componente válido
            // Esto permite que la producción sea ε
            return true;
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
        if(this.parseExpresionPrima()){
            if(this.matchValue(TokenType.OPERATOR, '+') || this.matchValue(TokenType.OPERATOR, '-')){
                if(this.parseExpresion()) return true;
            }
            return true;
        }
        return false;
    }
    
    parseExpresionPrima() {
        if(this.parseF()){
            if(this.matchValue(TokenType.OPERATOR, '*') || this.matchValue(TokenType.OPERATOR, '/')){
                if(this.parseExpresionPrima()) return true;
            }
            return true;
        }
        return false;
    }
    
    parseF() {
        if(this.matchValue(TokenType.IDENTIFIER) || this.matchValue(TokenType.NUMBER)){
            return true;
        }

        else if(this.matchValue(TokenType.SYMBOL, '(')){
            if(this.parseExpresion()){
                if(this.matchValue(TokenType.SYMBOL, ')')){
                    return true;
                }
            }
        }
        return false;
    }
    
    parseCiclo(){ 
        if (this.matchValue(TokenType.KEYWORD, 'for') && this.matchValue(TokenType.SYMBOL, '(') && this.match(TokenType.NUMBER)) {
            if (this.matchValue(TokenType.SYMBOL, ')') && this.matchValue(TokenType.SYMBOL, '{')) {
                if (this.parseCuerpo() && this.matchValue(TokenType.SYMBOL, '}')) {
                    return true;
                } else {
                    this.error("Se esperaba '}' al final del ciclo 'for'");
                }
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
                    if (this.parseCuerpo() && this.matchValue(TokenType.SYMBOL, '}')) {
                        return true;
                    } else {
                        this.error("Se esperaba '}' al final de la función");
                    }
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
