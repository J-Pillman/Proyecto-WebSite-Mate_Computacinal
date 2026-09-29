# Red de Flujo

Aplicación web en Flask que genera redes de flujo aleatorias (grafos dirigidos con capacidades) y las visualiza en el navegador con [vis-network](https://visjs.github.io/vis-network/docs/network/).

## Características

- Genera grafos dirigidos aleatorios de entre 7 y 16 nodos.
- Cada grafo contiene una ruta desde el nodo inicial (`0`) hasta el nodo final (`n-1`).
- Las aristas tienen capacidades aleatorias (1–10).
- Visualización interactiva: nodos, aristas dirigidas y etiquetas de capacidad.

## Requisitos

- Python 3.x
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

Abre [http://127.0.0.1:5000](http://127.0.0.1:5000), elige el número de nodos (7–16) y pulsa **Generar Grafo**.

> **Nota:** `vis-network` se carga desde un CDN, por lo que se necesita conexión a internet al abrir la página.

## API

### `POST /grafo`

Genera un grafo aleatorio.

**Cuerpo (JSON):**

```json
{ "n": 8 }
```

**Respuesta (200):**

```json
{
  "nodos": [{ "id": 0, "label": "0" }],
  "aristas": [{ "origen": 0, "destino": 2, "capacidad": 10 }],
  "inicio": 0,
  "final": 7
}
```

**Errores (400):** si `n` no está entre 7 y 16 o el cuerpo es inválido, devuelve `{ "error": "..." }`.

## Estructura del proyecto

```
.
├── app.py              # Aplicación Flask (rutas)
├── backend/
│   └── graph.py        # Generación del grafo (networkx)
├── static/
│   ├── css/            # Estilos
│   └── js/main.js      # Lógica del frontend (vis-network)
├── templates/
│   └── index.html      # Interfaz web
└── requirements.txt
```
