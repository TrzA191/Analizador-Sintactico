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


// Variables globales
// Variables globales
let tokens = [];
let symbolTable = [];

document.getElementById('btnEnviar').addEventListener('click', function() {
    const input = document.getElementById('inputTexto').value;
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = '';
    
    // Limpiar resultados anteriores
    document.getElementById('resultadoLexico').value = '';
    document.getElementById('resultadoSintactico').value = '';
    
    try {
        // Análisis léxico
        tokens = lexico(input);
        
        // Análisis sintáctico (que actualiza la tabla de símbolos)
        const sintacticoResult = sintactico(tokens);
        document.getElementById('resultadoSintactico').value = sintacticoResult;
        
        // Mostrar tokens léxicos
        document.getElementById('resultadoLexico').value = tokens.map(t => `${t.type}: ${t.value}`).join('\n');
        
    } catch (error) {
        errorContainer.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
});

function lexico(input) {
    const tokenPatterns = [
        { type: 'KEYWORD', pattern: /\b(int|char|float|double|string|bool)\b/ },
        { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/ },
        { type: 'NUMBER', pattern: /\b\d+(\.\d+)?\b/ },
        { type: 'STRING', pattern: /"[^"]*"|'[^']*'/ },
        { type: 'BOOLEAN', pattern: /\b(true|false)\b/ },
        { type: 'OPERATOR', pattern: /[+\-*/%=]/ },
        { type: 'DELIMITER', pattern: /[;,(){}[\]]/ },
        { type: 'WHITESPACE', pattern: /\s+/ },
        { type: 'UNKNOWN', pattern: /./ }
    ];

    let tokens = [];
    let position = 0;

    while (position < input.length) {
        let match = null;

        for (const { type, pattern } of tokenPatterns) {
            pattern.lastIndex = 0;
            const regex = new RegExp('^' + pattern.source);
            const substring = input.substring(position);
            match = regex.exec(substring);

            if (match) {
                if (type !== 'WHITESPACE') {
                    tokens.push({ type, value: match[0] });
                }
                position += match[0].length;
                break;
            }
        }

        if (!match) {
            throw new Error(`Carácter no reconocido: ${input[position]} en posición ${position}`);
        }
    }

    return tokens;
}

function sintactico(tokens) {
    let i = 0;
    let output = "";
    symbolTable = []; // Reiniciar tabla de símbolos
    
    // Expresiones regulares para identificar tipos
    const typePatterns = {
        'int': /^-?\d+$/,
        'float': /^-?\d+\.\d+$/,
        'char': /^'.'$/,
        'string': /^".*"$/,
        'bool': /^(true|false)$/
    };

    while (i < tokens.length) {
        // Detectar asignaciones (identificador = valor)
        if (tokens[i].type === 'IDENTIFIER' && 
            i+1 < tokens.length && tokens[i+1].value === '=') {
            
            const identifier = tokens[i].value;
            i += 2; // Saltar identificador y '='
            
            if (i >= tokens.length) {
                throw new Error(`Error: Se esperaba un valor después del '='`);
            }
            
            const valueToken = tokens[i];
            let type = 'desconocido';
            let value = valueToken.value;
            
            // Determinar el tipo automáticamente
            for (const [tipo, pattern] of Object.entries(typePatterns)) {
                if (pattern.test(valueToken.value)) {
                    type = tipo;
                    break;
                }
            }
            
            // Manejar casos especiales
            if (valueToken.type === 'IDENTIFIER') {
                // Buscar si el identificador está en la tabla de símbolos
                const existingVar = symbolTable.find(v => v.identificador === valueToken.value);
                if (existingVar) {
                    type = existingVar.tipo;
                    value = existingVar.valor;
                } else {
                    type = 'desconocido';
                }
            }
            
            // Actualizar tabla de símbolos
            updateSymbolTable(identifier, type, value);
            
            i++; // Avanzar al siguiente token
        }
        // Detectar declaraciones (tipo identificador = valor)
        else if (tokens[i].type === 'KEYWORD' && 
                 i+1 < tokens.length && tokens[i+1].type === 'IDENTIFIER') {
            
            const type = tokens[i].value;
            const identifier = tokens[i+1].value;
            i += 2; // Saltar tipo e identificador
            
            // Verificar si hay asignación
            if (i < tokens.length && tokens[i].value === '=') {
                i++; // Saltar '='
                
                if (i >= tokens.length) {
                    throw new Error(`Error: Se esperaba un valor después del '='`);
                }
                
                const valueToken = tokens[i];
                let value = valueToken.value;
                
                // Validar tipo
                if (!typePatterns[type].test(valueToken.value) && 
                    !(valueToken.type === 'IDENTIFIER' && 
                      symbolTable.find(v => v.identificador === valueToken.value && v.tipo === type))) {
                    throw new Error(`Error de tipo: No se puede asignar '${valueToken.value}' a variable de tipo '${type}'`);
                }
                
                // Si es identificador, obtener su valor
                if (valueToken.type === 'IDENTIFIER') {
                    const varRef = symbolTable.find(v => v.identificador === valueToken.value);
                    if (varRef) value = varRef.valor;
                }
                
                updateSymbolTable(identifier, type, value);
                i++; // Avanzar al siguiente token
            } else {
                // Declaración sin asignación
                updateSymbolTable(identifier, type, 'no asignado');
            }
        }
        
        // Avanzar al siguiente token
        if (i < tokens.length) {
            // Saltar delimitadores
            if (tokens[i].value === ';') {
                i++;
            } else {
                i++;
            }
        }
    }
    
    return output || "Análisis sintáctico completado sin errores";
}

function updateSymbolTable(identificador, tipo, valor) {
    // Eliminar comillas de strings/chars para mostrar
    let displayValue = valor;
    if ((tipo === 'string' || tipo === 'char') && typeof valor === 'string') {
        displayValue = valor.replace(/^['"]|['"]$/g, '');
    }
    
    // Buscar si el identificador ya existe
    const existingIndex = symbolTable.findIndex(entry => entry.identificador === identificador);
    
    if (existingIndex >= 0) {
        // Actualizar entrada existente
        symbolTable[existingIndex] = { identificador, tipo, valor: displayValue };
    } else {
        // Agregar nueva entrada
        symbolTable.push({ identificador, tipo, valor: displayValue });
    }
    
    updateTokenTable();
}

function updateTokenTable() {
    const tableBody = document.getElementById('tokenTableBody');
    tableBody.innerHTML = '';
    
    // Ordenar por identificador
    const sortedSymbols = [...symbolTable].sort((a, b) => a.identificador.localeCompare(b.identificador));
    
    // Llenar la tabla
    sortedSymbols.forEach(symbol => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${symbol.identificador}</td>
            <td>${symbol.tipo}</td>
            <td>${symbol.valor}</td>
        `;
        tableBody.appendChild(row);
    });
}   


// Función para mostrar errores en modal
// Función mejorada para mostrar errores
function showError(error, position = null) {
    const modalBody = document.getElementById('errorModalBody');
    let errorMessage = '';
    
    // Mensajes personalizados para cada tipo de error
    if (error.includes('unterminated string literal')) {
        errorMessage = `
            <div class="alert alert-danger">
                <h5>❌ Error de sintaxis: Cadena incompleta</h5>
                <p>Te falta cerrar las comillas en tu cadena de texto.</p>
                <p><strong>Solución:</strong> Asegúrate que todas las cadenas tengan comillas de cierre ("" o '').</p>
                ${position ? `<p><strong>Posición:</strong> Línea ${position.line}, Columna ${position.column}</p>` : ''}
                <pre>Ejemplo correcto: nombre = "Juan"</pre>
            </div>
        `;
    }
    else if (error.includes('Cannot set properties of null')) {
        errorMessage = `
            <div class="alert alert-danger">
                <h5>⚠️ Error interno del sistema</h5>
                <p>Ocurrió un problema al intentar mostrar los resultados.</p>
                <p><strong>Posible causa:</strong> El código contiene elementos no válidos que impiden el análisis.</p>
                <p><strong>Solución:</strong> Revisa tu código en busca de sintaxis incorrecta.</p>
            </div>
        `;
    }
    else if (error.includes('invalid syntax')) {
        errorMessage = `
            <div class="alert alert-danger">
                <h5>❌ Error de sintaxis</h5>
                <p>La estructura del código no es válida.</p>
                ${position ? `<p><strong>Ubicación del error:</strong> Línea ${position.line}</p>` : ''}
                <p><strong>Revisa:</strong></p>
                <ul>
                    <li>Que todos los paréntesis/llaves estén cerrados</li>
                    <li>Que no haya comas o puntos faltantes</li>
                    <li>Que la indentación sea correcta</li>
                </ul>
            </div>
        `;
    }
    else {
        errorMessage = `
            <div class="alert alert-danger">
                <h5>⚠️ Error encontrado</h5>
                <p>${error}</p>
                ${position ? `<p><strong>Ubicación:</strong> Línea ${position.line}, Columna ${position.column}</p>` : ''}
            </div>
        `;
    }
    
    modalBody.innerHTML = errorMessage;
    $('#errorModal').modal('show');
    
    // Limpiar resultados previos
    document.getElementById('tokenTableBody').innerHTML = '';
    document.getElementById('resultadoLexico').value = 'Ocurrió un error (ver ventana emergente)';
    document.getElementById('resultadoSintactico').value = 'Ocurrió un error (ver ventana emergente)';
}

// Función para obtener posición del error (línea/columna)
function getErrorPosition(input, errorIndex) {
    const lines = input.split('\n');
    let line = 1;
    let column = 1;
    let currentPos = 0;
    
    for (const currentLine of lines) {
        if (currentPos + currentLine.length >= errorIndex) {
            column = errorIndex - currentPos + 1;
            return { line, column };
        }
        currentPos += currentLine.length + 1;
        line++;
    }
    return { line: 1, column: 1 };
}

// Modificación en la función sintactico()
function sintactico(tokens) {
    let i = 0;
    symbolTable = []; // Reiniciamos la tabla para cada análisis
    
    while (i < tokens.length) {
        try {
            // Ejemplo: Detectar identificadores inválidos
            if (tokens[i].type === 'IDENTIFIER' && /^\d/.test(tokens[i].value)) {
                throw new Error(`Nombre de variable inválido: '${tokens[i].value}'. No puede comenzar con número`);
            }
            
            // Detectar asignaciones
            if (tokens[i].type === 'IDENTIFIER' && tokens[i+1]?.value === '=') {
                const identificador = tokens[i].value;
                i += 2; // Saltar identificador y '='
                
                if (i >= tokens.length) {
                    throw new Error('Asignación incompleta');
                }
                
                // Determinar tipo y valor
                let tipo, valor;
                if (tokens[i].type === 'NUMBER') {
                    tipo = 'int';
                    valor = tokens[i].value;
                } else if (tokens[i].type === 'STRING') {
                    tipo = 'str';
                    valor = tokens[i].value.replace(/^['"]|['"]$/g, '');
                } else {
                    throw new Error(`Tipo de dato no soportado para '${identificador}'`);
                }
                
                // Agregar a tabla solo si no hay errores
                symbolTable.push({
                    identificador,
                    tipo,
                    valor
                });
            }
            i++;
        } catch (error) {
            showError(error.message);
            return; // Detener análisis si hay error
        }
    }
    return "Análisis completado sin errores";
}

// Modificación en el event listener del botón
document.getElementById('btnEnviar').addEventListener('click', function() {
    const input = document.getElementById('inputTexto').value;
    
    try {
        tokens = lexico(input);
        const resultado = sintactico(tokens);
        document.getElementById('resultadoSintactico').value = resultado;
        updateTokenTable();
    } catch (error) {
        showError(error.message);
    }
});