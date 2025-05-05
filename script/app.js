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
        { type: 'KEYWORD', pattern: /\b(if|else|while|return|int|char|float|double|string|bool)\b/ }, 
        { type: 'IDENTIFIER', pattern: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/ },
        { type: 'NUMBER', pattern: /\b\d+(\.\d+)?\b/ },
        { type: 'STRING', pattern: /"[^"]*"/ },  // Solo comillas dobles para strings
        { type: 'CHAR', pattern: /'[^']?'/ },    // Caracteres entre comillas simples
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
    symbolTable = [];
    
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
            i += 2;
            
            if (i >= tokens.length) {
                throw new Error(`Error: Se esperaba un valor después del '='`);
            }
            
            const valueToken = tokens[i];
            let type = 'desconocido';
            let value = valueToken.value;
            
            // Determinar el tipo automáticamente
            if (valueToken.type === 'CHAR') {
                type = 'char';
                value = valueToken.value.replace(/^'|'$/g, ''); // Eliminar comillas
            }
            else if (valueToken.type === 'STRING') {
                type = 'string';
                value = valueToken.value.replace(/^"|"$/g, '');
            }
            else if (valueToken.type === 'NUMBER') {
                type = valueToken.value.includes('.') ? 'float' : 'int';
            }
            else if (valueToken.type === 'BOOLEAN') {
                type = 'bool';
            }
            else if (valueToken.type === 'IDENTIFIER') {
                const existingVar = symbolTable.find(v => v.identificador === valueToken.value);
                if (existingVar) {
                    type = existingVar.tipo;
                    value = existingVar.valor;
                }
            }
            
            updateSymbolTable(identifier, type, value);
            i++;
        }
        // Detectar declaraciones (tipo identificador = valor)
        else if (tokens[i].type === 'KEYWORD' && 
                 i+1 < tokens.length && tokens[i+1].type === 'IDENTIFIER') {
            
            const type = tokens[i].value;
            const identifier = tokens[i+1].value;
            i += 2;
            
            if (i < tokens.length && tokens[i].value === '=') {
                i++;
                
                if (i >= tokens.length) {
                    throw new Error(`Error: Se esperaba un valor después del '='`);
                }
                
                const valueToken = tokens[i];
                let value = valueToken.value;
                
                // Validar tipo para caracteres
                if (type === 'char' && valueToken.type !== 'CHAR') {
                    throw new Error(`Error de tipo: Se esperaba un carácter entre comillas simples para '${identifier}'`);
                }
                
                if (type === 'char' && valueToken.type === 'CHAR') {
                    value = valueToken.value.replace(/^'|'$/g, '');
                }
                
                // Resto de validaciones de tipos...
                
                updateSymbolTable(identifier, type, value);
                i++;
            } else {
                updateSymbolTable(identifier, type, 'no asignado');
            }
        }
        
        if (i < tokens.length && tokens[i].value === ';') {
            i++;
        } else if (i < tokens.length) {
            i++;
        }
    }
    
    return output || "Análisis sintáctico completado sin errores";
}

function updateSymbolTable(identificador, tipo, valor) {
    let displayValue = valor;
    
    // Formatear caracteres para mostrar
    if (tipo === 'char') {
        displayValue = `'${valor}'`;  // Mostrar con comillas simples
    } else if (tipo === 'string') {
        displayValue = `"${valor}"`; // Mostrar con comillas dobles
    }
    
    const existingIndex = symbolTable.findIndex(entry => entry.identificador === identificador);
    
    if (existingIndex >= 0) {
        symbolTable[existingIndex] = { identificador, tipo, valor: displayValue };
    } else {
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
// Versión optimizada de showError
function showError(error, position = null, input = null) {
    const modalBody = document.getElementById('errorModalBody');
    if (!modalBody) {
        console.error('No se encontró el elemento errorModalBody');
        return;
    }

    let errorMessage = '';
    const errorLower = error.toLowerCase();

    // Mensajes personalizados mejorados
    if (errorLower.includes('unterminated string') || errorLower.includes('comillas')) {
        errorMessage = createErrorHTML(
            '❌ Error de sintaxis: Cadena incompleta',
            'Faltan comillas de cierre en tu cadena de texto o carácter.',
            position,
            `Ejemplo correcto: nombre = "Juan" o letra = 'a'`
        );
    }
    else if (error.includes('Cannot set properties of null')) {
        errorMessage = createErrorHTML(
            '⚠️ Error de análisis',
            'El código contiene una estructura no válida que impide el análisis completo.',
            position,
            `Revisa especialmente las asignaciones como: grupo = 'f' (usa comillas simples para caracteres)`
        );
    }
    else if (errorLower.includes('invalid syntax') || errorLower.includes('sintaxis')) {
        errorMessage = createErrorHTML(
            '❌ Error de sintaxis',
            'La estructura del código no es válida.',
            position,
            `Ejemplo de error común: grupo = 'f' (asegúrate que sea una asignación válida)`
        );
    }
    else if (errorLower.includes('no soportado') || errorLower.includes('tipo de dato')) {
        errorMessage = createErrorHTML(
            '❌ Error de tipo',
            'Tipo de dato no compatible en la operación.',
            position,
            `Para caracteres usa: letra = 'a' (comillas simples)`
        );
    }
    else {
        errorMessage = createErrorHTML(
            '⚠️ Error encontrado',
            error,
            position,
            `Código problemático: ${input ? input.substring(position?.index || 0, (position?.index || 0) + 20) : ''}`
        );
    }

    modalBody.innerHTML = errorMessage;
    $('#errorModal').modal('show');
}

// Función auxiliar para crear HTML de error
function createErrorHTML(title, description, position, solution = '') {
    return `
        <div class="alert alert-danger">
            <h5>${title}</h5>
            <p>${description}</p>
            ${position ? `
                <p><strong>Ubicación:</strong> 
                    Línea ${position.line}, Columna ${position.column}
                    ${position.index ? `(posición ${position.index})` : ''}
                </p>
            ` : ''}
            ${solution ? `<p><strong>Solución:</strong> ${solution}</p>` : ''}
        </div>
    `;
}

// Función mejorada para obtener posición del error
function getErrorPosition(input, errorIndex) {
    if (!input) return { line: 1, column: 1, index: 0 };
    
    const lines = input.split('\n');
    let line = 1;
    let column = 1;
    let currentPos = 0;
    
    for (const currentLine of lines) {
        if (currentPos + currentLine.length >= errorIndex) {
            column = errorIndex - currentPos + 1;
            return { line, column, index: errorIndex };
        }
        currentPos += currentLine.length + 1;
        line++;
    }
    return { line: 1, column: 1, index: 0 };
}

// Versión optimizada de sintactico()
function sintactico(tokens, input) {
    let i = 0;
    symbolTable = [];
    
    try {
        while (i < tokens.length) {
            // Detectar identificadores inválidos
            if (tokens[i].type === 'IDENTIFIER' && /^\d/.test(tokens[i].value)) {
                const errorPos = getErrorPosition(input, tokens[i].index || 0);
                throw new Error(`Nombre de variable inválido: '${tokens[i].value}'. No puede comenzar con número`, errorPos);
            }
            
            // Detectar asignaciones (identificador = valor)
            if (tokens[i].type === 'IDENTIFIER' && tokens[i+1]?.value === '=') {
                const identificador = tokens[i].value;
                const assignPos = tokens[i].index || 0;
                i += 2;
                
                if (i >= tokens.length) {
                    throw new Error('Asignación incompleta: falta el valor después del =', 
                                  getErrorPosition(input, assignPos));
                }
                
                // Manejo mejorado de tipos
                let tipo, valor;
                switch (tokens[i].type) {
                    case 'NUMBER':
                        tipo = tokens[i].value.includes('.') ? 'float' : 'int';
                        valor = tokens[i].value;
                        break;
                    case 'STRING':
                        tipo = 'string';
                        valor = tokens[i].value.slice(1, -1); // Eliminar comillas
                        break;
                    case 'CHAR':
                        tipo = 'char';
                        valor = tokens[i].value.slice(1, -1); // Eliminar comillas simples
                        break;
                    case 'BOOLEAN':
                        tipo = 'bool';
                        valor = tokens[i].value;
                        break;
                    case 'IDENTIFIER':
                        const varRef = symbolTable.find(v => v.identificador === tokens[i].value);
                        if (!varRef) {
                            throw new Error(`Variable no declarada: '${tokens[i].value}'`, 
                                          getErrorPosition(input, tokens[i].index || 0));
                        }
                        tipo = varRef.tipo;
                        valor = varRef.valor;
                        break;
                    default:
                        throw new Error(`Tipo de dato no soportado: '${tokens[i].type}' para '${identificador}'`, 
                                      getErrorPosition(input, tokens[i].index || 0));
                }
                
                updateSymbolTable(identificador, tipo, valor);
            }
            
            i++;
        }
        return "Análisis completado sin errores";
    } catch (error) {
        const errorPos = error.position || getErrorPosition(input, 0);
        showError(error.message, errorPos, input);
        return "Error en el análisis";
    }
}

// Modificación en el event listener del botón
document.getElementById('btnEnviar')?.addEventListener('click', function() {
    const input = document.getElementById('inputTexto')?.value;
    if (!input) {
        showError('No se ingresó código para analizar');
        return;
    }

    try {
        const tokens = lexico(input);
        const resultado = sintactico(tokens, input); // Pasamos el input original para mejores mensajes de error
        document.getElementById('resultadoSintactico').value = resultado;
        updateTokenTable();
    } catch (error) {
        showError(error.message, getErrorPosition(input, error.index || 0), input);
    }
});