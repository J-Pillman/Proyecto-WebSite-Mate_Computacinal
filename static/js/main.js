const contenedor =document.getElementById('grafo')
let red= null;

document.getElementById('generar').addEventListener('click',async() => {
    const n=parseInt(document.getElementById('n').value, 10);
    
    const peticion = await fetch('/grafo',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({n:n})
    });
    const datos = await peticion.json();

    if(!peticion.ok){
        alert('Error: '+datos.error);
        return;
    }

    const nodos = new vis.DataSet(datos.nodos.map(nodo => ({
        id: nodo.id,
        label:nodo.label,

    })));

    const aristas = new vis.DataSet(datos.aristas.map(arista => ({
        from: arista.origen,
        to: arista.destino,
        label: String(arista.capacidad),
        title: 'capacidad' +arista.capacidad,
        arrows: 'to'
    })))

    if(red) red.destroy();
    red= new vis.Network(contenedor, {nodes: nodos,edges:aristas},{
        physics:true,
        nodes:{shape:'circle',font:{size:16}},
        edges: {font: {size:12}}
    });
})