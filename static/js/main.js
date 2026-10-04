//Navegador
let grafoActual = null;
let pasos = [];
let pasoActual = 0;

// Estado modo manual
let nodosManuales = [];
let flechasManuales = [];
let siguienteIdNodo = 0;

// Posiciones guardadas (para preservar al ejecutar algoritmo)
let posicionesGuardadas = {};

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MIN_NODOS = 7;
const MAX_NODOS = 16;

const contenedor = document.getElementById('grafo');
let red = null;

// Datasets en vivo para modo manual
let dsNodos = null;
let dsFlechas = null;

const opcionesRed = {
    physics: false,
    interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        hover: true,
        tooltipDelay: 200
    },
    nodes: { shape: 'circle', font: { size: 16 }, borderWidth: 2 },
    edges: { font: { size: 12 }, smooth: false }
};



// ========== UTILIDADES ==========

const nombreNodo = id => {
    const n = grafoActual.nodos.find(x => x.id === id);
    return n ? n.label : String(id);
};

function guardarPosiciones() {
    if (!red) return;
    const pos = red.getPositions();
    for (const [id, p] of Object.entries(pos)) {
        posicionesGuardadas[id] = { x: p.x, y: p.y };
    }
}

function aplicarPosiciones(listaNodos) {
    return listaNodos.map(n => {
        const p = posicionesGuardadas[n.id];
        return p ? { ...n, x: p.x, y: p.y } : n;
    });
}

// ========== SELECCIÓN DE MODO ==========

document.getElementById('btn-aleatorio').addEventListener('click', () => {
    document.getElementById('elegir-modo').style.display = 'none';
    document.getElementById('modo-aleatorio').style.display = 'block';
});

document.getElementById('btn-manual').addEventListener('click', () => {
    document.getElementById('elegir-modo').style.display = 'none';
    document.getElementById('modo-manual').style.display = 'block';
    crearGrafoVacio();
    actualizarInfoManual();
});

// ========== CANCELAR / VOLVER ==========

function volverAMenu() {
    document.getElementById('modo-aleatorio').style.display = 'none';
    document.getElementById('modo-manual').style.display = 'none';
    document.getElementById('contenedor-algoritmo').style.display = 'none';
    document.getElementById('resultado').style.display = 'none';
    document.getElementById('form-arista').style.display = 'none';
    document.getElementById('elegir-modo').style.display = 'block';

    grafoActual = null;
    pasos = [];
    pasoActual = 0;
    nodosManuales = [];
    flechasManuales = [];
    siguienteIdNodo = 0;
    posicionesGuardadas = {};

    if (red) { red.destroy(); red = null; }
}

document.getElementById('cancelar-aleatorio').addEventListener('click', volverAMenu);
document.getElementById('cancelar-manual').addEventListener('click', volverAMenu);

// ========== MODO ALEATORIO ==========

document.getElementById('generar').addEventListener('click', async () => {
    const n = parseInt(document.getElementById('n').value, 10);

    const peticion = await fetch('/grafo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({n: n})
    });
    const datos = await peticion.json();

    if (!peticion.ok) {
        alert('Error: ' + datos.error);
        return;
    }

    grafoActual = datos;
    posicionesGuardadas = {};
    mostrarGrafoCompleto(datos);
    mostrarAlgoritmo();
});

// ========== MODO MANUAL ==========

document.getElementById('agregar-nodo').addEventListener('click', () => {
    if (nodosManuales.length >= MAX_NODOS) {
        alert('Máximo ' + MAX_NODOS + ' nodos');
        return;
    }

    const id = siguienteIdNodo;
    const label = LETRAS[id % 26];
    nodosManuales.push({ id, label });
    siguienteIdNodo++;

    const x = Math.round((Math.random() - 0.5) * 600);
    const y = Math.round((Math.random() - 0.5) * 400);
    dsNodos.add({ id, label, x, y });
    posicionesGuardadas[id] = { x, y };
    actualizarInfoManual();
    actualizarSelectsArista();
});

document.getElementById('agregar-arista').addEventListener('click', () => {
    if (nodosManuales.length < 2) {
        alert('Agrega al menos 2 nodos primero');
        return;
    }
    document.getElementById('form-arista').style.display = 'block';
    actualizarSelectsArista();
});

document.getElementById('cancelar-arista').addEventListener('click', () => {
    document.getElementById('form-arista').style.display = 'none';
});

document.getElementById('confirmar-arista').addEventListener('click', () => {
    const origen = parseInt(document.getElementById('arista-origen').value);
    const destino = parseInt(document.getElementById('arista-destino').value);
    const capacidad = parseInt(document.getElementById('arista-capacidad').value);

    if (origen === destino) {
        alert('Origen y destino deben ser distintos');
        return;
    }
    if (isNaN(capacidad) || capacidad < 1) {
        alert('La capacidad debe ser un número mayor a 0');
        return;
    }
    if (flechasManuales.some(f => f.origen === origen && f.destino === destino)) {
        alert('Esa arista ya existe');
        return;
    }

    flechasManuales.push({ origen, destino, capacidad });
    dsFlechas.add({
        from: origen,
        to: destino,
        label: String(capacidad),
        title: 'capacidad ' + capacidad,
        arrows: 'to'
    });

    document.getElementById('form-arista').style.display = 'none';
    document.getElementById('arista-capacidad').value = 1;
    actualizarInfoManual();
});

document.getElementById('usar-red').addEventListener('click', () => {
    if (nodosManuales.length < MIN_NODOS) {
        alert('Necesitas al menos ' + MIN_NODOS + ' nodos (tienes ' + nodosManuales.length + ')');
        return;
    }
    if (flechasManuales.length < 1) {
        alert('Necesitas al menos 1 arista');
        return;
    }

    guardarPosiciones();
    grafoActual = {
        nodos: nodosManuales.slice(),
        flechas: flechasManuales.slice(),
        fuente: nodosManuales[0].id,
        sumidero: nodosManuales[nodosManuales.length - 1].id
    };

    document.getElementById('modo-manual').style.display = 'none';
    mostrarAlgoritmo();
});

function crearGrafoVacio() {
    dsNodos = new vis.DataSet([]);
    dsFlechas = new vis.DataSet([]);
    if (red) red.destroy();
    red = new vis.Network(contenedor, { nodes: dsNodos, edges: dsFlechas }, opcionesRed);
    red.on('dragEnd', guardarPosiciones);

}

function actualizarSelectsArista() {
    const opciones = nodosManuales
        .map(n => `<option value="${n.id}">${n.label}</option>`)
        .join('');
    document.getElementById('arista-origen').innerHTML = opciones;
    document.getElementById('arista-destino').innerHTML = opciones;
    bloquearOpcionDuplicada();
}

function bloquearOpcionDuplicada() {
    const origen = document.getElementById('arista-origen');
    const destino = document.getElementById('arista-destino');

    for (const op of destino.options) {
        op.disabled = op.value === origen.value;
    }
    for (const op of origen.options) {
        op.disabled = op.value === destino.value;
    }
}

document.getElementById('arista-origen').addEventListener('change', bloquearOpcionDuplicada);
document.getElementById('arista-destino').addEventListener('change', bloquearOpcionDuplicada);

function actualizarInfoManual() {
    const listaNodos = nodosManuales
        .map(n => `${n.label}(${n.id})`)
        .join(', ');
    const listaFlechas = flechasManuales
        .map(f => {
            const o = nodosManuales.find(n => n.id === f.origen);
            const d = nodosManuales.find(n => n.id === f.destino);
            return `${o ? o.label : f.origen}→${d ? d.label : f.destino}(${f.capacidad})`;
        })
        .join(', ');

    const fuente = nodosManuales.length > 0 ? nodosManuales[0].label : '-';
    const sumidero = nodosManuales.length > 1 ? nodosManuales[nodosManuales.length - 1].label : '-';

    document.getElementById('info-manual').textContent =
        `Nodos: ${nodosManuales.length}/${MAX_NODOS} (${listaNodos || 'ninguno'}) | Fuente: ${fuente} | Sumidero: ${sumidero} | Aristas: ${listaFlechas || 'ninguna'}`;
}

// ========== GRAFO (compartido) ==========

function mostrarGrafoCompleto(datos) {
    const nodos = new vis.DataSet(aplicarPosiciones(datos.nodos.map(nodo => ({
        id: nodo.id,
        label: nodo.label
    }))));

    const aristas = new vis.DataSet(datos.flechas.map(flecha => ({
        from: flecha.origen,
        to: flecha.destino,
        label: String(flecha.capacidad),
        title: 'capacidad ' + flecha.capacidad,
        arrows: 'to'
    })));

    if (red) red.destroy();
    red = new vis.Network(contenedor, { nodes: nodos, edges: aristas }, opcionesRed);
    red.on('dragEnd', guardarPosiciones);

}

function mostrarAlgoritmo() {
    pasos = [];
    pasoActual = 0;
    document.getElementById('paso-detalle').innerHTML = '';
    document.getElementById('paso-info').textContent = '';
    document.getElementById('flujo-total-num').textContent = '0';
    document.getElementById('flujo-total-max').textContent = '';
    document.getElementById('barra-fill').style.width = '0%';
    document.getElementById('chips').innerHTML = '';
    document.getElementById('anterior').disabled = true;
    document.getElementById('siguiente').disabled = true;
    document.getElementById('contenedor-algoritmo').style.display = 'block';
    document.getElementById('pasos-algoritmo').style.display = 'none';
    document.getElementById('resultado').style.display = 'none';
}

// ========== FORD-FULKERSON ==========

document.getElementById('ejecutar').addEventListener('click', async () => {
    if (!grafoActual) { alert('Primero crea un grafo'); return; }
    guardarPosiciones();
    const peticion = await fetch('/algoritmo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(grafoActual)
    });
    const datos = await peticion.json();
    if (!peticion.ok) { alert('Error: ' + datos.error); return; }
    pasos = datos.pasos;
    pasoActual = 0;
    document.getElementById('pasos-algoritmo').style.display = 'block';
    document.getElementById('resultado').style.display = 'none';
    renderizarPaso();
});

document.getElementById('anterior').addEventListener('click', () => {
    if (pasoActual > 0) { pasoActual--; renderizarPaso(); }
});

document.getElementById('siguiente').addEventListener('click', () => {
    if (pasoActual < pasos.length - 1) { pasoActual++; renderizarPaso(); }
});

document.getElementById('ir-final').addEventListener('click', () => {
    pasoActual = pasos.length - 1;
    renderizarPaso();
});

document.getElementById('reiniciar').addEventListener('click', () => {
    pasoActual = 0;
    renderizarPaso();
});

document.addEventListener('keydown', e => {
    if (!pasos.length || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight' && pasoActual < pasos.length - 1) { pasoActual++; renderizarPaso(); }
    if (e.key === 'ArrowLeft' && pasoActual > 0) { pasoActual--; renderizarPaso(); }
});

// ========== RENDERIZAR PASO ==========

function renderizarPaso() {
    const paso = pasos[pasoActual];
    const esPrimero = pasoActual === 0;
    const esUltimo = pasoActual === pasos.length - 1;
    const totalPasos = pasos.length - 1;

    // Flujo antes de este paso
    const flujoAntes = esPrimero
        ? paso.flujo.map(f => ({ ...f, flujo: 0 }))
        : pasos[pasoActual - 1].flujo;

    // --- Grafo ---
    const nodos = new vis.DataSet(aplicarPosiciones(grafoActual.nodos.map(nodo => {
        const et = paso.etiquetas.find(e => e.id === nodo.id);
        return {
            id: nodo.id,
            label: et ? nodo.label + '\n' + et.etiqueta : nodo.label
        };
    })));

    const aristas = new vis.DataSet(paso.flujo.map(f => {
        const enCamino = paso.camino.some((n, i) =>
            i < paso.camino.length - 1 &&
            ((paso.camino[i] === f.origen && paso.camino[i+1] === f.destino) ||
             (paso.camino[i] === f.destino && paso.camino[i+1] === f.origen))
        );
        let color = '#848484';
        if (enCamino) color = 'red';
        else if (f.flujo >= f.capacidad) color = '#d32f2f';
        else if (f.flujo > 0) color = '#1976d2';
        return {
            from: f.origen,
            to: f.destino,
            label: f.flujo + '/' + f.capacidad,
            color: { color },
            width: enCamino ? 3 : (f.flujo > 0 ? 2 : 1),
            arrows: 'to'
        };
    }));

    if (red) red.destroy();
    red = new vis.Network(contenedor, { nodes: nodos, edges: aristas }, opcionesRed);
    red.on('dragEnd', guardarPosiciones);


    // --- Navegación ---
    document.getElementById('paso-info').textContent =
        esPrimero ? 'Inicio' : esUltimo ? 'Terminado' : `Paso ${pasoActual} de ${totalPasos}`;
    document.getElementById('anterior').disabled = esPrimero;
    document.getElementById('siguiente').disabled = esUltimo;

    // --- Progreso ---
    const flujoTotal = paso.flujo_total;
    const flujoMax = pasos[pasos.length - 1].flujo_total;
    document.getElementById('flujo-total-num').textContent = flujoTotal;
    document.getElementById('flujo-total-max').textContent = esUltimo ? '= flujo máximo' : '';
    document.getElementById('barra-fill').style.width =
        flujoMax > 0 ? (100 * flujoTotal / flujoMax) + '%' : '0%';

    // --- Chips de caminos ---
    const chipsHTML = pasos.slice(0, pasoActual + 1)
        .filter(p => p.camino.length > 0)
        .map((p, i) => {
            const texto = p.camino.map(n => nombreNodo(n)).join(' → ');
            const activo = p === paso ? 'style="font-weight:bold"' : '';
            return `<span ${activo}>${texto} (+${p.cuello_botella})</span>`;
        }).join(' &nbsp;') || '<span>aún ninguno</span>';
    document.getElementById('chips').innerHTML = chipsHTML;

    // --- Detalle del paso ---
    document.getElementById('paso-detalle').innerHTML = generarDetallePaso(paso, flujoAntes, esPrimero, esUltimo);

    // --- Resultado final ---
    if (esUltimo) {
        mostrarResultado(paso);
    } else {
        document.getElementById('resultado').style.display = 'none';
    }
}

function generarDetallePaso(paso, flujoAntes, esPrimero, esUltimo) {
    if (esPrimero) {
        return `<div><b>Al empezar</b>, ninguna arista lleva flujo (todas muestran 0).
            El programa buscará caminos desde la fuente <b>${nombreNodo(grafoActual.fuente)}</b>
            hasta el sumidero <b>${nombreNodo(grafoActual.sumidero)}</b> por los que todavía quepa más flujo.
            Pulsa «Siguiente».</div>`;
    }

    if (esUltimo) {
        if (paso.flujo_total === 0) {
            return `<div><b>No hay ningún camino</b> de ${nombreNodo(grafoActual.fuente)} a
                ${nombreNodo(grafoActual.sumidero)} en esta red, así que no se puede enviar nada
                (flujo máximo = 0).</div>`;
        }
        const corte = paso.corte_minimo;
        let corteHTML = '';
        if (corte && corte.aristas.length > 0) {
            const filas = corte.aristas.map(a =>
                `<tr><td>${nombreNodo(a.origen)}→${nombreNodo(a.destino)}</td>
                 <td>${a.flujo}</td><td>${a.capacidad}</td></tr>`
            ).join('');
            const totalCap = corte.aristas.reduce((s, a) => s + a.capacidad, 0);
            corteHTML = `
                <h3>Corte mínimo</h3>
                <p>Nodos del lado de la fuente: <b>${corte.lado_s.map(nombreNodo).join(', ')}</b></p>
                <table>
                    <tr><th>Arista</th><th>Flujo</th><th>Capacidad</th></tr>
                    ${filas}
                    <tr><td><b>Total</b></td><td></td><td><b>${totalCap}</b></td></tr>
                </table>
                <p>Flujo máximo = <b>${paso.flujo_total}</b> = Capacidad del corte mínimo = <b>${totalCap}</b> ✓</p>`;
        }
        return `<div><b>Ya no hay ningún camino con espacio libre</b> de
            ${nombreNodo(grafoActual.fuente)} a ${nombreNodo(grafoActual.sumidero)},
            así que el flujo máximo es <b>${paso.flujo_total}</b>.${corteHTML}</div>`;
    }

    // Paso intermedio: desglose del camino
    const camino = paso.camino;
    const segmentos = [];
    for (let i = 0; i < camino.length - 1; i++) {
        const u = camino[i], v = camino[i + 1];
        const fwd = flujoAntes.find(f => f.origen === u && f.destino === v);
        const bwd = flujoAntes.find(f => f.origen === v && f.destino === u);
        if (fwd) {
            segmentos.push({
                tramo: `${nombreNodo(u)} → ${nombreNodo(v)}`,
                espacio: fwd.capacidad - fwd.flujo,
                tipo: 'Tramo'
            });
        } else if (bwd) {
            segmentos.push({
                tramo: `${nombreNodo(v)} → ${nombreNodo(u)} (devuelve)`,
                espacio: bwd.flujo,
                tipo: 'Tramo (se devuelve flujo)'
            });
        }
    }

    const espacios = segmentos.map(s => s.espacio);
    const menorEspacio = Math.min(...espacios);
    const flujoAntesTotal = paso.flujo_total - paso.cuello_botella;

    const segmentosHTML = segmentos.map(s =>
        `<div><b>${s.tipo}</b><div>${s.tramo}</div>
         <b>${s.tipo === 'Tramo' ? 'Espacio libre' : 'Flujo que se puede devolver'}</b>
         <div>${s.espacio}</div></div>`
    ).join('');

    return `
        <div><b>Paso ${pasoActual}: se encontró un camino con espacio libre.</b></div>
        <p>Camino: <b>${camino.map(n => nombreNodo(n)).join(' → ')}</b>
        (una flecha ← significa que en ese tramo se devuelve flujo)</p>
        <div>${segmentosHTML}</div>
        <p>El tramo más estrecho limita todo el camino: el menor espacio libre es
        <b>${menorEspacio}</b>. Por eso se envían <b>${paso.cuello_botella}</b> unidades
        por este camino. Flujo total: ${flujoAntesTotal} + ${paso.cuello_botella} =
        <b>${paso.flujo_total}</b>.</p>`;
}

// ========== RESULTADO FINAL ==========

function mostrarResultado(pasoFinal) {
    const flujoMax = pasoFinal.flujo_total;

    const filasAristas = pasoFinal.flujo.map(f =>
        `<tr><td>${nombreNodo(f.origen)}→${nombreNodo(f.destino)}</td>
         <td>${f.flujo}</td><td>${f.capacidad}</td></tr>`
    ).join('');

    const pasosConCamino = pasos.filter(p => p.camino.length > 0);
    const filasCaminos = pasosConCamino.map((p, i) =>
        `<tr><td>${i + 1}</td>
         <td>${p.camino.map(n => nombreNodo(n)).join(' → ')}</td>
         <td>${p.cuello_botella}</td>
         <td>${p.flujo_total}</td></tr>`
    ).join('') || '<tr><td colspan="4">Ninguno</td></tr>';

    const corte = pasoFinal.corte_minimo;
    let corteHTML = '';
    if (corte && corte.aristas.length > 0) {
        const totalCap = corte.aristas.reduce((s, a) => s + a.capacidad, 0);
        const filasCorte = corte.aristas.map(a =>
            `<tr><td>${nombreNodo(a.origen)}→${nombreNodo(a.destino)}</td>
             <td>${a.flujo}</td><td>${a.capacidad}</td></tr>`
        ).join('');
        corteHTML = `
            <h3>Corte mínimo</h3>
            <p>Nodos del lado de la fuente: <b>${corte.lado_s.map(nombreNodo).join(', ')}</b></p>
            <table>
                <tr><th>Arista del corte</th><th>Flujo</th><th>Capacidad</th></tr>
                ${filasCorte}
                <tr><td><b>Total</b></td><td></td><td><b>${totalCap}</b></td></tr>
            </table>
            <p>Flujo máximo = <b>${flujoMax}</b> = Capacidad del corte = <b>${totalCap}</b> ✓</p>`;
    }

    document.getElementById('resultado-contenido').innerHTML = `
        <div>
            <label>Valor del flujo máximo</label>
            <div><b>${flujoMax}</b></div>
            <b>Flujo en cada arista</b>
            <table>
                <tr><th>Arista</th><th>Flujo</th><th>Capacidad</th></tr>
                ${filasAristas}
            </table>
        </div>
        <div>
            <b>Caminos usados</b>
            <table>
                <tr><th>#</th><th>Camino</th><th>Se envían</th><th>Flujo total</th></tr>
                ${filasCaminos}
            </table>
        </div>
        ${corteHTML}`;

    document.getElementById('resultado').style.display = 'block';
}
