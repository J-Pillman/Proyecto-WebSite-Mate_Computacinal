import networkx as nx
from random import randint,shuffle

def generar_grafo(num): 
    #Primera parte, ingresar n
    if not (num >=7 and num<=16):
        raise ValueError('El numero debe ser entre 7 y 16') #genera error

    #Generar grafo aleatorio
    G=nx.DiGraph()

    G.add_nodes_from(range(num))

    nodo_inicial,nodo_final=0,num-1 #Como son n nodos van del 0 a n-1
    nodos_intermedios=list(range(1,num-1))
    shuffle(nodos_intermedios) #suffle reoganiza aleatoriamente los elementos
    ruta=[nodo_inicial] + nodos_intermedios + [nodo_final]
    for origen,destino in zip(ruta,ruta[1:]): #el zip sirve para recorrer dos listas al mismo timepo
        G.add_edge(origen,destino, capacity=randint(1,10))

    inicio=nx.descendants(G,nodo_inicial) | {nodo_inicial} #Añade el nodo inicial
    final=nx.ancestors(G,nodo_final) | {nodo_final}
    for nodo in G.nodes: #assert sirbe para verificar si es una condicion verdadera
        assert nodo in inicio and nodo in final

    return{
        'nodos': [{'id':i,'label':str(i)} for i in G.nodes],
        'aristas':[{'origen':u,'destino':v,'capacidad':d['capacity']} for u,v, d in G.edges(data=True)], #devuelve tupla (u,v,d)
        'inicio':nodo_inicial,
        'final':nodo_final
    }