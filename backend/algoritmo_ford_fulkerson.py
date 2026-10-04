from collections import deque, defaultdict #alternativa mejorada de contenedores
def ford_fulkerson(nodos, flechas, fuente, sumidero):
    letras = {n['id']: n['label'] for n in nodos}

    capacidad={}
    for f in flechas:
        capacidad[(f['origen'], f['destino'])] = f['capacidad']

    residual = defaultdict(lambda: defaultdict(int))
    for (u,v), cap in capacidad.items():
        residual[u][v]=cap

    flujo= {(u,v): 0 for (u,v) in capacidad}

    def snapshot(paso,camino,botella,etiquetas,desc,flujo_total):
        return {
            'paso' : paso,
            'descripcion' : desc,
            'flujo_total' : flujo_total,
            'camino': camino,
            'cuello_botella' : botella,
            'flujo': [
                {'origen': u, 'destino':v, 'flujo':flujo[(u,v)], 'capacidad':cap}
                for (u,v), cap in capacidad.items()
            ],
            'etiquetas':etiquetas
        }

    pasos = []

    pasos.append(snapshot(
        0,[],0,
        [{'id':fuente, 'etiqueta': 's'}, {'id': sumidero, 'etiqueta': 't'}],
        'Estado inicial: flujo = 0 en todas las aristas',
        0
    ))

    paso_num=1
    flujo_total=0

    while True:
        padre = {fuente: None}
        cuello = {fuente: float('inf')}
        cola = deque([fuente])
        visitados = [fuente]

        while cola:
            u = cola.popleft()
            if u == sumidero:
                break
            for v in sorted(residual[u].keys()):
                if v not in padre and residual[u][v] > 0:
                    padre[v] = u
                    cuello[v] = min(cuello[u], residual[u][v])
                    cola.append(v)
                    visitados.append(v)

        if sumidero not in padre:
            break

        camino = []
        nodo = sumidero
        while nodo is not None:
            camino.append(nodo)
            nodo = padre[nodo]
        camino.reverse()

        botella = cuello[sumidero]

        etiquetas = []
        for nodo_id in visitados:
            if nodo_id == fuente:
                etiquetas.append({'id': nodo_id, 'etiqueta': 's'})
            elif nodo_id == sumidero:
                etiquetas.append({'id': nodo_id, 'etiqueta': 't'})
            else:
                pred= padre[nodo_id]
                etiquetas.append({
                    'id': nodo_id,
                    'etiqueta': f'({letras[pred]},{cuello[nodo_id]})'
                })

        for i in range(len(camino)-1):
            u,v= camino[i], camino[i+1]
            residual[u][v] -= botella
            residual[v][u] += botella           
            if (u,v) in flujo:
                flujo[(u,v)] += botella
            else:
                flujo[(v,u)] -= botella

        flujo_total += botella

        camino_str = '→'.join(letras[n] for n in camino)
        desc = f'Camino aumentante: {camino_str}. Cuello de botella: {botella}'

        pasos.append(snapshot(
            paso_num, camino, botella, etiquetas, desc, flujo_total
        ))

        paso_num+=1

    pasos.append(snapshot(
        paso_num, [], 0,
        [{'id': fuente, 'etiqueta':'s'}, {'id': sumidero, 'etiqueta': 't'}],
        f'No hay mas caminos aumentantes. Flujo maximo: {flujo_total}',
        flujo_total
    ))

    return pasos