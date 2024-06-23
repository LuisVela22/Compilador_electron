function compilar() {
    const code = document.getElementById('code-input').value;
    const tokens = lexer(code);
    const parser = new Parser(tokens);
    const result = parser.parse();

    const output = document.getElementById('output');
    output.innerHTML = ''; // Limpiar la salida anterior

    if (result.success) {
        output.innerHTML = "COMPILACION EXITOSA!!!";
    } else {
        output.innerHTML = `Errores:<br><pre>${result.errors.join('<br>')}</pre>`;
    }
}

function ejecutar() {
    const code = document.getElementById('code-input').value;
    const tokens = lexer(code);
    const parser = new Parser(tokens);

    const output = document.getElementById('output');
    output.innerHTML = ''; // Limpiar la salida anterior

    try {
        parser.parse();
        output.innerHTML = 'Ejecutando... (aquí se implementaría la ejecución)';
    } catch (e) {
        output.innerHTML = `Error: ${e.message}`;
    }
}

function showTokens() {
    const code = document.getElementById('code-input').value;
    const tokens = lexer(code);

    const output = document.getElementById('output');
    output.innerHTML = ''; // Limpiar la salida anterior

    tokens.forEach(token => {
        const div = document.createElement('div');
        div.textContent = `Tipo: ${token.type}, Valor: ${token.value}`;
        output.appendChild(div);
    });
}
