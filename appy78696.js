/* ============================================================
   app.js — Sistema de gestión "Bar La Esquina"
   ============================================================ */

/* ------------------------------------------------------------
   Registro de IA
   ------------------------------------------------------------
   Este archivo fue generado con asistencia de IA. Las
   decisiones de arquitectura (estructura de datos, persistencia
   con localStorage, navegación entre secciones) fueron
   revisadas y validadas por el desarrollador.
   ------------------------------------------------------------ */


/* ------------------------------------------------------------
   1) ESTADO DE LA APLICACIÓN
   Tres arrays que representan el modelo de datos del sistema:
   - productos : ítems de la carta
   - mesas     : mesas físicas del salón
   - pedidos   : pedidos abiertos/cerrados por mesa
   ------------------------------------------------------------ */

let productos = [];   // { id, nombre, categoria, precio, disponible }
let mesas = [];       // { id, numero, capacidad, estado }
let pedidos = [];     // { id, mesaId, items, estado, apertura, cierre, total, formaPago }


/* ------------------------------------------------------------
   2) CLAVE DE PERSISTENCIA
   Todo el estado se guarda bajo una única clave en localStorage.
   ------------------------------------------------------------ */
const CLAVE_STORAGE = "bar-datos";


/* ------------------------------------------------------------
   3) GENERADORES DE DATOS DE EJEMPLO
   Se usan solo la primera vez (cuando no hay nada guardado).
   ------------------------------------------------------------ */

/**
 * Crea 8 mesas libres con numeración y capacidades variadas.
 * @returns {Array} array de mesas
 */
function crearMesasEjemplo() {
    return [
        { id: 1, numero: 1, capacidad: 2, estado: "libre" },
        { id: 2, numero: 2, capacidad: 2, estado: "libre" },
        { id: 3, numero: 3, capacidad: 4, estado: "libre" },
        { id: 4, numero: 4, capacidad: 4, estado: "libre" },
        { id: 5, numero: 5, capacidad: 4, estado: "libre" },
        { id: 6, numero: 6, capacidad: 6, estado: "libre" },
        { id: 7, numero: 7, capacidad: 6, estado: "libre" },
        { id: 8, numero: 8, capacidad: 8, estado: "libre" }
    ];
}

/**
 * Crea 5 productos de ejemplo con distintas categorías.
 * @returns {Array} array de productos
 */
function crearProductosEjemplo() {
    return [
        { id: 1, nombre: "Café con leche", categoria: "Bebidas calientes", precio: 1200, disponible: true },
        { id: 2, nombre: "Cerveza artesanal", categoria: "Bebidas", precio: 2500, disponible: true },
        { id: 3, nombre: "Empanada de carne", categoria: "Comidas", precio: 900, disponible: true },
        { id: 4, nombre: "Milanesa con papas", categoria: "Comidas", precio: 4800, disponible: true },
        { id: 5, nombre: "Flan casero", categoria: "Postres", precio: 1500, disponible: true }
    ];
}


/* ------------------------------------------------------------
   4) PERSISTENCIA
   guardarDatos: serializa el estado completo a JSON y lo
   escribe en localStorage bajo la clave "bar-datos".
   cargarDatos : lee y parsea; si no hay nada, siembra los
   datos de ejemplo, los guarda y devuelve true/false según
   si encontró datos previos.
   ------------------------------------------------------------ */

/**
 * Guarda productos, mesas y pedidos en localStorage.
 */
function guardarDatos() {
    const datos = { productos, mesas, pedidos };
    try {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos));
    } catch (error) {
        console.error("No se pudieron guardar los datos:", error);
    }
}

/**
 * Carga el estado desde localStorage.
 * Si no hay datos guardados, inicializa con los ejemplos
 * (8 mesas libres y 5 productos) y los persiste.
 * @returns {boolean} true si se cargaron datos previos, false si se sembraron ejemplos
 */
function cargarDatos() {
    const crudo = localStorage.getItem(CLAVE_STORAGE);

    if (crudo) {
        try {
            const datos = JSON.parse(crudo);
            productos = datos.productos || [];
            mesas = datos.mesas || [];
            pedidos = datos.pedidos || [];
            return true;
        } catch (error) {
            console.error("Datos corruptos en localStorage, se reinicia:", error);
        }
    }

    // No hay datos válidos: sembramos los ejemplos y guardamos
    productos = crearProductosEjemplo();
    mesas = crearMesasEjemplo();
    pedidos = [];
    guardarDatos();
    return false;
}


/* ------------------------------------------------------------
   5) NAVEGACIÓN ENTRE SECCIONES
   El menú del header muestra una sección y oculta las demás
   usando la clase .seccion-activa (definida en styles.css).
   ------------------------------------------------------------ */

/**
 * Muestra la sección cuyo id coincide con el hash del enlace
 * y oculta el resto. Si no hay hash válido, no hace nada.
 * @param {string} idSeccion - id de la <section> a mostrar
 */
function mostrarSeccion(idSeccion) {
    const secciones = document.querySelectorAll("main > section");

    secciones.forEach((seccion) => {
        seccion.classList.toggle("seccion-activa", seccion.id === idSeccion);
    });
}

/**
 * Conecta los enlaces del menú con mostrarSeccion().
 * Usa delegación sobre el <nav> del header.
 */
function inicializarNavegacion() {
    const enlacesMenu = document.querySelectorAll("header nav a");

    enlacesMenu.forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            evento.preventDefault(); // evitamos el salto brusco por ancla
            const idSeccion = enlace.getAttribute("href").replace("#", "");
            mostrarSeccion(idSeccion);
        });
    });
}


/* ------------------------------------------------------------
   6) ARRANQUE
   Al cargar el DOM: cargamos datos, preparamos la navegación
   y mostramos la sección de Salón por defecto.
   ------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    inicializarNavegacion();
    mostrarSeccion("seccion-salon");
});