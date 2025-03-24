// Definir los patrones de tokens
const TOKEN_PATTERNS = [
    { pattern: /\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})\b/, type: 'Correo' }, // Correo electrónico
    { pattern: /\b(if|else|while|return)\b/, type: 'Palabra reservada' },
    { pattern: /\b\d+(\.\d+)?\b/, type: 'Número' },
    { pattern: /[+\-*/=<>!]=?/, type: 'Operador' }, // Soporte para operadores relacionales
    { pattern: /[{}()\[\];]/, type: 'Símbolo' },
    { pattern: /\s+/, type: null }, // Ignorar espacios en blanco
    { pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/, type: 'Texto' },
];

function lexer(code) {
    const tokens = [];
    let pos = 0;
    while (pos < code.length) {
        let matchFound = false;
        for (const { pattern, type } of TOKEN_PATTERNS) {
            pattern.lastIndex = 0;
            const match = pattern.exec(code.slice(pos));
            if (match && match.index === 0) {
                matchFound = true;
                if (type) tokens.push({ value: match[0], type });
                pos += match[0].length;
                break;
            }
        }
        if (!matchFound) {
            tokens.push({ value: code[pos], type: 'Texto no válido' });
            pos++;
        }
    }
    return tokens;
}

function parser(tokens) {
    let index = 0;
    let resultado = [];
    
    function match(expectedType) {
        if (index < tokens.length && tokens[index].type === expectedType) {
            return tokens[index++].value;
        }
        return null;
    }
    
    function parseExpression() {
        let token = tokens[index];
        if (!token) return null;
        
        if (token.type === 'Palabra reservada' && token.value === 'if') {
            index++;
            if (match('Símbolo') === '(') {
                let condition = parseCondition();
                if (condition && match('Símbolo') === ')') {
                    if (match('Símbolo') === '{') {
                        let blockResult = parseBlock();
                        if (blockResult) {
                            resultado.push("Condición y bloque detectados correctamente en if.");
                            return true;
                        } else resultado.push("Error: Bloque de código inválido en if.");
                    } else resultado.push("Error: Falta '{' después de la condición.");
                } else resultado.push("Error: Condición inválida o falta ')'.");
            } else resultado.push("Error: Falta '(' en la condición.");
        } else if (token.type === 'Correo') {
            index++;
            return true;
        } else {
            resultado.push(`Error: Token inesperado '${token.value}' de tipo '${token.type}'.`);
            index++;
        }
        return null;
    }

    function parseCondition() {
        let left = match('Número') || match('Texto');
        if (left) {
            let operator = match('Operador');
            if (operator) {
                let right = match('Número') || match('Texto');
                if (right) return { left, operator, right };
                else resultado.push("Error: Falta el lado derecho de la condición.");
            } else resultado.push("Error: Falta operador en la condición.");
        } else resultado.push("Error: Condición inválida.");
        return null;
    }

    function parseBlock() {
        let token = tokens[index];
        if (token && token.type === 'Palabra reservada' && token.value === 'return') {
            index++;
            let returnValue = match('Número') || match('Texto');
            if (returnValue) {
                if (match('Símbolo') === ';') {
                    if (match('Símbolo') === '}') return true;
                    else resultado.push("Error: Falta '}' al final del bloque.");
                } else resultado.push("Error: Falta ';' después del return.");
            } else resultado.push("Error: Valor de retorno inválido.");
        } else resultado.push("Error: Bloque de código inválido.");
        return null;
    }

    while (index < tokens.length) {
        parseExpression();
    }
    return resultado.length ? resultado.join("\n") : "Estructura sintáctica correcta.";
}

document.getElementById('btnEnviar').addEventListener('click', () => {
    const inputTexto = document.getElementById('inputTexto').value;
    if (!inputTexto.trim()) {
        alert("Por favor, ingresa un código válido.");
        return;
    }
    const tokens = lexer(inputTexto);
    console.log("Tokens generados:", tokens);
    document.getElementById('resultadoLexico').value = tokens.map(token => `${token.value}: ${token.type}`).join('\n');
    const resultadoSintactico = parser(tokens);
    console.log("Resultado sintáctico:", resultadoSintactico);
    document.getElementById('resultadoSintactico').value = resultadoSintactico;
});
