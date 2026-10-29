import networkx as nx
from random import randint,shuffle,sample
from string import ascii_uppercase

def generar_red_de_flujo(num): 
    if not (num >=7 and num<=16):
        raise ValueError('El numero debe ser entre 7 y 16') #genera error

    G=nx.DiGraph()

    letras = sample(ascii_uppercase, num) #devuelve num elementos que no se repiten

    G.add_nodes_from(range(num)) #range necesita int

    s,t = 0,num-1 
    vertices_intermedios=list(range(1,num-1))

    shuffle(vertices_intermedios) #suffle reorganiza aleatoriamente los elementos

    ruta=[s] + vertices_intermedios + [t]

    for origen,destino in zip(ruta,ruta[1:]): #el zip sirve para recorrer dos listas al mismo timepo
        G.add_edge(origen,destino, capacity=randint(1,10))

        # --- 1. CREAR ARISTAS RESPETANDO EL ORDEN DE LAS COLUMNAS ---

    # Fuente (s): ya manda 1 flecha a ruta[1].
    # Le agregamos 1 o 2 más a los siguientes en 'ruta' (tendrá 2 o 3 salientes y 0 entrantes).
    extras_s = randint(1, 2)
    for destino in ruta[2 : 2 + extras_s]:
        G.add_edge(s, destino, capacity=randint(1, 10))

    # Sumidero (t): ya recibe 1 flecha de ruta[-2].
    # Le agregamos 1 más desde ruta[-3] para que reciba exactamente 2 y mande 0.
    G.add_edge(ruta[-3], t, capacity=randint(1, 10))

    # Nodos intermedios: ya mandan 1 flecha (la vertical/diagonal de 'ruta').
    # A los que aún tienen menos de 2 salientes, les agregamos 1 flecha hacia la siguiente columna.
    for i in range(1, len(ruta) - 3):
        u = ruta[i]
        if G.out_degree(u) < 2:
            salto = randint(2, 3) if (i + 3 < len(ruta) - 1) else 2
            v = ruta[i + salto]
            if not G.has_edge(u, v):
                G.add_edge(u, v, capacity=randint(1, 10))

    # --- 2. AGRUPAR EN COLUMNAS SEGÚN LAS FLECHAS QUE BOTAN ---

    visitados = {s, t}
    columnas = [[s]]  # Columna 1 (izquierda): la fuente

    while True:
        actual = columnas[-1]
        siguiente = []
        for u in actual:
            for v in G.successors(u):  # Nodos a los que 'u' les manda flecha
                if v not in visitados:
                    visitados.add(v)
                    siguiente.append(v)
        if not siguiente:
            break
        columnas.append(siguiente)

    columnas.append([t])  # Última columna (derecha): el sumidero

    # --- 3. CALCULAR POSICIONES (X, Y) ---

    posiciones = {}
    sep_x = 180  # Distancia horizontal entre columnas
    sep_y = 120  # Distancia vertical entre nodos de una misma columna

    for col_idx, col in enumerate(columnas):
        x = col_idx * sep_x
        mitad = len(col) // 2

        for i, nodo in enumerate(col):
            if len(col) % 2 == 1:  # IMPAR: uno al medio (y = 0), resto arriba y abajo
                y = (i - mitad) * sep_y
            else:                  # PAR: se ignora el medio (y = 0), solo arriba y abajo
                if i < mitad:
                    y = (i - mitad) * sep_y
                else:
                    y = (i - mitad + 1) * sep_y

            posiciones[nodo] = (x, y)

    inicio=nx.descendants(G,s) | {s} #Añade el nodo inicial
    final=nx.ancestors(G,t) | {t}
    for nodo in G.nodes: #assert sirbe para verificar si es una condicion verdadera
        assert nodo in inicio and nodo in final

    return {
        'nodos': [
            {'id': i, 'label': letras[i], 'x': posiciones[i][0], 'y': posiciones[i][1]}
            for i in G.nodes
        ],
        'flechas': [
            {'origen': u, 'destino': v, 'capacidad': d['capacity']}
            for u, v, d in G.edges(data=True)
        ],
        'fuente': s,
        'sumidero': t
    }