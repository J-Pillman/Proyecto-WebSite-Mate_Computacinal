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

    for _ in range(randint(num//2, num)): # aristas extra para mas caminos aumentantes
            u, v=sample(list(G.nodes),2)
            if u!=t and u!=v and not G.has_edge(u,v):
                G.add_edge(u,v,capacity=randint(1,10))

    inicio=nx.descendants(G,s) | {s} #Añade el nodo inicial
    final=nx.ancestors(G,t) | {t}
    for nodo in G.nodes: #assert sirbe para verificar si es una condicion verdadera
        assert nodo in inicio and nodo in final

    return{
        'nodos': [{'id':i,'label':letras[i]} for i in G.nodes],
        'flechas':[{'origen':u,'destino':v,'capacidad':d['capacity']} for u,v, d in G.edges(data=True)], #devuelve tupla (u,v,d)
        'fuente':s,
        'sumidero':t
    }