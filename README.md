# Red de Flujo

Aplicación web en Flask que genera redes de flujo aleatorias o permite construirlas manualmente, las visualiza en el navegador con [vis-network](https://visjs.github.io/vis-network/docs/network/) y resuelve el **flujo máximo** con el algoritmo de **Ford-Fulkerson**, mostrando cada paso del algoritmo.

## Características

- Genera redes de flujo aleatorias de entre 7 y 16 nodos.
- Cada red tiene una **fuente** (`s`) y un **sumidero** (`t`), con una ruta principal entre ellos y aristas adicionales aleatorias.
- Las aristas tienen capacidades aleatorias (1–10).
- **Modo manual**: construye tu propia red nodo a nodo.
  - Nodos etiquetados con letras (A, B, C…).
  - Aristas con capacidad personalizada, sin bucles ni duplicados.
  - La fuente es el primer nodo y el sumidero el último.
- Visualización interactiva: nodos con etiquetas, aristas dirigidas y capacidades.
- **Algoritmo de Ford-Fulkerson** paso a paso:
  - Camino aumentante resaltado en rojo.
  - Flujo/capacidad en cada arista.
  - Etiquetas BFS en los nodos.
  - Navegación con botones *Anterior* / *Siguiente*.
  - Flujo máximo al finalizar.

## Requisitos

- Python 3.x **o** Docker con Docker Compose
- Dependencias en `requirements.txt` (Flask, networkx)

## Instalación

```bash
git clone <url-del-repositorio>
cd proyecto_computacional
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Uso

```bash
python app.py
```

Abre [http://127.0.0.1:5000](http://127.0.0.1:5000) y elige un modo:

- **Generar Aleatorio**: elige el número de nodos (7–16) y pulsa **Generar Grafo**.
- **Manual**: agrega nodos y aristas con **Agregar Nodo** / **Agregar Arista** y pulsa **Usar Red**.

Luego pulsa **Ejecutar Ford-Fulkerson** para ver el algoritmo paso a paso.

> **Nota:** `vis-network` se carga desde un CDN, por lo que se necesita conexión a internet al abrir la página.

## Ejecutar con Docker

```bash
docker compose up --build
```

Abre [http://localhost](http://localhost) (puerto 80).

Para detener el contenedor:

```bash
docker compose down
```

## API

### `POST /grafo`

Genera una red de flujo aleatoria.

**Cuerpo (JSON):**

```json
{ "n": 8 }
```

**Respuesta (200):**

```json
{
  "nodos": [{ "id": 0, "label": "A" }],
  "flechas": [{ "origen": 0, "destino": 2, "capacidad": 10 }],
  "fuente": 0,
  "sumidero": 7
}
```

**Errores (400):** si `n` no está entre 7 y 16 o el cuerpo es inválido, devuelve `{ "error": "..." }`.

### `POST /algoritmo`

Ejecuta el algoritmo de Ford-Fulkerson sobre una red de flujo.

**Cuerpo (JSON):** la respuesta de `POST /grafo` (nodos, flechas, fuente, sumidero).

**Respuesta (200):**

```json
{
  "pasos": [
    {
      "paso": 0,
      "descripcion": "Estado inicial: flujo = 0 en todas las aristas",
      "flujo_total": 0,
      "camino": [],
      "cuello_botella": 0,
      "flujo": [{ "origen": 0, "destino": 1, "flujo": 0, "capacidad": 5 }],
      "etiquetas": [{ "id": 0, "etiqueta": "s" }]
    }
  ]
}
```

Cada paso incluye:
- `flujo`: estado actual de flujo/capacidad en cada arista.
- `camino`: nodos del camino aumentante (resaltado en rojo).
- `cuello_botella`: flujo mínimo del camino.
- `etiquetas`: etiquetas BFS de los nodos (formato `(predecesor,capacidad)`).
- `flujo_total`: flujo acumulado hasta ese paso.

## Estructura del proyecto

```
.
├── app.py                              # Aplicación Flask (rutas)
├── backend/
│   ├── red_de_flujo.py                 # Generación de la red de flujo (networkx)
│   └── algoritmo_ford_fulkerson.py     # Algoritmo de Ford-Fulkerson
├── static/
│   ├── css/style.css                   # Estilos
│   ├── js/main.js                      # Lógica del frontend (vis-network)
│   └── favicon.ico                     # Icono del sitio
├── templates/
│   └── index.html                      # Interfaz web
├── Dockerfile                          # Imagen Docker
├── docker-compose.yml                  # Servicio web con Docker Compose
├── .dockerignore
├── .gitignore
└── requirements.txt
```
