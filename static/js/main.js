//Navegador
let grafoActual = null;
let pasos = [];
let pasoActual = 0;

// Estado modo manual
let nodosManuales = [];
let flechasManuales = [];
let siguienteIdNodo = 0;

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const contenedor = document.getElementById('grafo');
let red = null;

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

// ========== SELECCIÓN DE MODO ==========

document.getElementById('btn-aleatorio').addEventListener('click', () => {
    document.getElementById('elegir-modo').style.display = 'none';
    document.getElementById('modo-aleatorio').style.display = 'block';
});

document.getElementById('btn-manual').addEventListener('click', () => {
    document.getElementById('elegir-modo').style.display = 'none';
    document.getElementById('modo-manual').style.display = 'block';
    actualizarInfoManual();
});

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
    iniciarGrafo();
});

// ========== MODO MANUAL ==========

document.getElementById('agregar-nodo').addEventListener('click', () => {
    const id = siguienteIdNodo;
    const label = LETRAS[id % 26];
    nodosManuales.push({ id, label });
    siguienteIdNodo++;
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
    document.getElementById('form-arista').style.display = 'none';
    document.getElementById('arista-capacidad').value = 1;
    actualizarInfoManual();
});

document.getElementById('usar-red').addEventListener('click', () => {
    if (nodosManuales.length < 2) {
        alert('Necesitas al menos 2 nodos');
        return;
    }
    if (flechasManuales.length < 1) {
        alert('Necesitas al menos 1 arista');
        return;
    }

    grafoActual = {
        nodos: nodosManuales.slice(),
        flechas: flechasManuales.slice(),
        fuente: nodosManuales[0].id,
        sumidero: nodosManuales[nodosManuales.length - 1].id
    };

    iniciarGrafo();
});

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
        `Nodos: ${listaNodos || '(ninguno)'} | Fuente: ${fuente} | Sumidero: ${sumidero} | Aristas: ${listaFlechas || '(ninguna)'}`;
}

// ========== GRAFO (compartido) ==========

function iniciarGrafo() {
    pasos = [];
    pasoActual = 0;
    document.getElementById('descripcion').textContent = '';
    document.getElementById('paso-info').textContent = '';
    document.getElementById('flujo-maximo').textContent = '';
    document.getElementById('anterior').disabled = true;
    document.getElementById('siguiente').disabled = true;

    document.getElementById('modo-aleatorio').style.display = 'none';
    document.getElementById('modo-manual').style.display = 'none';
    document.getElementById('contenedor-grafo').style.display = 'block';

    mostrarGrafo(grafoActual);
}

function mostrarGrafo(datos) {
    const nodos = new vis.DataSet(datos.nodos.map(nodo => ({
        id: nodo.id,
        label: nodo.label
    })));

    const aristas = new vis.DataSet(datos.flechas.map(flecha => ({
        from: flecha.origen,
        to: flecha.destino,
        label: String(flecha.capacidad),
        title: 'capacidad ' + flecha.capacidad,
        arrows: 'to'
    })));

    if (red) red.destroy();
    red = new vis.Network(contenedor, { nodes: nodos, edges: aristas }, opcionesRed);
}

// ========== FORD-FULKERSON ==========

document.getElementById('ejecutar').addEventListener('click', async () => {
    if (!grafoActual) { alert('Primero crea un grafo'); return; }
    const peticion = await fetch('/algoritmo', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(grafoActual)
    });
    const datos = await peticion.json();
    if (!peticion.ok) { alert('Error: ' + datos.error); return; }
    pasos = datos.pasos;
    pasoActual = 0;
    renderizarPaso();
});

document.getElementById('anterior').addEventListener('click', () => {
    if (pasoActual > 0) { pasoActual--; renderizarPaso(); }
});

document.getElementById('siguiente').addEventListener('click', () => {
    if (pasoActual < pasos.length - 1) { pasoActual++; renderizarPaso(); }
});

function renderizarPaso() {
    const paso = pasos[pasoActual];

    const nodos = new vis.DataSet(grafoActual.nodos.map(nodo => {
        const et = paso.etiquetas.find(e => e.id === nodo.id);
        return {
            id: nodo.id,
            label: et ? nodo.label + '\n' + et.etiqueta : nodo.label
        };
    }));

    const aristas = new vis.DataSet(paso.flujo.map(f => {
        const enCamino = paso.camino.some((n, i) =>
            i < paso.camino.length - 1 &&
            ((paso.camino[i] === f.origen && paso.camino[i+1] === f.destino) ||
             (paso.camino[i] === f.destino && paso.camino[i+1] === f.origen))
        );
        return {
            from: f.origen,
            to: f.destino,
            label: f.flujo + '/' + f.capacidad,
            color: enCamino ? { color: 'red' } : { color: '#848484' },
            width: enCamino ? 3 : 1,
            arrows: 'to'
        };
    }));

    if (red) red.destroy();
    red = new vis.Network(contenedor, { nodes: nodos, edges: aristas }, opcionesRed);

    document.getElementById('descripcion').textContent = paso.descripcion;
    document.getElementById('paso-info').textContent =
        'Paso ' + paso.paso + ' / ' + pasos[pasos.length - 1].paso;
    document.getElementById('anterior').disabled = pasoActual === 0;
    document.getElementById('siguiente').disabled = pasoActual === pasos.length - 1;

    const esUltimo = pasoActual === pasos.length - 1;
    if (esUltimo) {
        document.getElementById('flujo-maximo').textContent =
            'Flujo máximo: ' + paso.flujo_total;
    } else {
        document.getElementById('flujo-maximo').textContent =
            'Flujo acumulado: ' + paso.flujo_total;
    }
}
