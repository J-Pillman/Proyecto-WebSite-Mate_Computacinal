//Navegador
const contenedor =document.getElementById('grafo') //Referencia al div 
let red= null;

document.getElementById('generar').addEventListener('click',async() => { 
    const n=parseInt(document.getElementById('n').value, 10); //Lee el input
    
    const peticion = await fetch('/grafo',{ //Envia POST al servidor
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({n:n}) //Convierte en texto JSON
    });
    const datos = await peticion.json();    //Recive la respuesta JSON

    if(!peticion.ok){
        alert('Error: '+datos.error);
        return;
    }

    const nodos = new vis.DataSet(datos.nodos.map(nodo => ({ //Convierte los datos a formato vis-network
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

    if(red) red.destroy();     //Borra el grafo anterior
    red= new vis.Network(contenedor, {nodes: nodos,edges:aristas},{ //Dibuja el nuevo grafo
        physics:true,
        nodes:{shape:'circle',font:{size:16}},
        edges: {font: {size:12}}
    });
})