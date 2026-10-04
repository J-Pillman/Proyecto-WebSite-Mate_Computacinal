//Navegador
let grafoActual = null;
let pasos = [];
let pasoActual = 0;

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

    pasos = [];
    pasoActual = 0;
    document.getElementById('descripcion').textContent = '';
    document.getElementById('paso-info').textContent = '';
    document.getElementById('flujo-maximo').textContent = '';
    document.getElementById('anterior').disabled = true;
    document.getElementById('siguiente').disabled = true;

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
})

document.getElementById('ejecutar').addEventListener('click', async () => {
    if (!grafoActual) { alert('Primero genera un grafo'); return; }
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