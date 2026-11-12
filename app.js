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
   ------------------------------------------------------------ */

let productos = [];   // { id, nombre, categoria, precio, disponible }
let mesas = [];       // { id, numero, capacidad, estado }
let pedidos = [];     // { id, mesaId, items, estado, apertura, cierre, total, formaPago }


/* ------------------------------------------------------------
   2) CONSTANTES
   ------------------------------------------------------------ */
const CLAVE_STORAGE = "bar-datos";

const CATEGORIAS = [
    "Bebidas calientes",
    "Bebidas frías",
    "Bebidas",
    "Comidas",
    "Postres",
    "Otros"
];

const FORMAS_PAGO = ["efectivo", "débito", "transferencia"];

const formatoPesos = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
});

function formatearPrecio(valor) {
    return formatoPesos.format(valor);
}

function formatearHora(isoString) {
    if (!isoString) return "—";
    const fecha = new Date(isoString);
    return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function vibrarAlAgregar() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try {
            navigator.vibrate(50);
        } catch (error) {
            /* algunos navegadores lanzan si el gesto no lo permite; ignoramos */
        }
    }
}


/* ------------------------------------------------------------
   3) GENERADORES DE DATOS DE EJEMPLO
   ------------------------------------------------------------ */

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
   ------------------------------------------------------------ */

function guardarDatos() {
    const datos = { productos, mesas, pedidos };
    try {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos));
    } catch (error) {
        console.error("No se pudieron guardar los datos:", error);
    }
}

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

    productos = crearProductosEjemplo();
    mesas = crearMesasEjemplo();
    pedidos = [];
    guardarDatos();
    return false;
}


/* ------------------------------------------------------------
   5) NAVEGACIÓN ENTRE SECCIONES
   ------------------------------------------------------------ */

function mostrarSeccion(idSeccion) {
    const secciones = document.querySelectorAll("main > section");
    secciones.forEach((seccion) => {
        seccion.classList.toggle("seccion-activa", seccion.id === idSeccion);
    });

    if (idSeccion === "seccion-caja") {
        renderizarCaja();
    }
}

function inicializarNavegacion() {
    const enlacesMenu = document.querySelectorAll("header nav a");
    enlacesMenu.forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            evento.preventDefault();
            const idSeccion = enlace.getAttribute("href").replace("#", "");
            mostrarSeccion(idSeccion);
        });
    });
}


/* ------------------------------------------------------------
   6) HELPERS DE PRODUCTOS
   ------------------------------------------------------------ */

function siguienteIdProducto() {
    if (productos.length === 0) return 1;
    return Math.max(...productos.map((p) => p.id)) + 1;
}

function buscarProductoPorId(id) {
    return productos.find((p) => p.id === id);
}

function nombreProductoDuplicado(nombre, idExcluir = null) {
    const normalizado = nombre.trim().toLowerCase();
    return productos.some(
        (p) => p.id !== idExcluir && p.nombre.trim().toLowerCase() === normalizado
    );
}


/* ------------------------------------------------------------
   7) RENDERIZADO DE LA CARTA
   ------------------------------------------------------------ */

function renderizarCarta() {
    const contenedor = document.getElementById("lista-productos");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (productos.length === 0) {
        contenedor.innerHTML = `<p class="carta-vacia">Todavía no hay productos cargados.</p>`;
        return;
    }

    const grupos = new Map();
    CATEGORIAS.forEach((cat) => grupos.set(cat, []));

    productos.forEach((producto) => {
        if (!grupos.has(producto.categoria)) {
            grupos.set(producto.categoria, []);
        }
        grupos.get(producto.categoria).push(producto);
    });

    grupos.forEach((lista, categoria) => {
        if (lista.length === 0) return;

        const grupo = document.createElement("div");
        grupo.className = "grupo-categoria";

        const titulo = document.createElement("h3");
        titulo.className = "grupo-categoria__titulo";
        titulo.textContent = categoria;
        grupo.appendChild(titulo);

        const listaContenedor = document.createElement("div");
        listaContenedor.className = "grupo-categoria__lista";

        lista.forEach((producto) => {
            listaContenedor.appendChild(crearTarjetaProducto(producto));
        });

        grupo.appendChild(listaContenedor);
        contenedor.appendChild(grupo);
    });
}

function crearTarjetaProducto(producto) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "producto";
    tarjeta.dataset.id = producto.id;

    if (!producto.disponible) {
        tarjeta.classList.add("producto--no-disponible");
    }

    const info = document.createElement("div");
    info.className = "producto__info";

    const nombre = document.createElement("span");
    nombre.className = "producto__nombre";
    nombre.textContent = producto.nombre;

    const categoria = document.createElement("span");
    categoria.className = "producto__categoria";
    categoria.textContent = producto.categoria;

    const precio = document.createElement("span");
    precio.className = "producto__precio";
    precio.textContent = formatearPrecio(producto.precio);

    info.append(nombre, categoria, precio);

    const toggle = document.createElement("label");
    toggle.className = "producto__toggle";
    toggle.title = producto.disponible ? "Marcar como no disponible" : "Marcar como disponible";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = producto.disponible;
    checkbox.className = "producto__toggle-input";
    checkbox.setAttribute("aria-label", `Disponible: ${producto.nombre}`);

    const estadoTexto = document.createElement("span");
    estadoTexto.className = "producto__toggle-texto";
    estadoTexto.textContent = producto.disponible ? "Disponible" : "No disponible";

    checkbox.addEventListener("change", () => {
        producto.disponible = checkbox.checked;
        estadoTexto.textContent = producto.disponible ? "Disponible" : "No disponible";
        tarjeta.classList.toggle("producto--no-disponible", !producto.disponible);
        guardarDatos();
        refrescarSelectProductosPedido();
    });

    toggle.append(checkbox, estadoTexto);

    const acciones = document.createElement("div");
    acciones.className = "producto__acciones";

    const btnEditar = document.createElement("button");
    btnEditar.type = "button";
    btnEditar.className = "btn-accion btn-accion--editar";
    btnEditar.innerHTML = "✏️ Editar";
    btnEditar.addEventListener("click", () => editarProducto(producto.id));

    const btnBorrar = document.createElement("button");
    btnBorrar.type = "button";
    btnBorrar.className = "btn-accion btn-accion--borrar";
    btnBorrar.innerHTML = "🗑️ Borrar";
    btnBorrar.addEventListener("click", () => borrarProducto(producto.id));

    acciones.append(btnEditar, btnBorrar);

    tarjeta.append(info, toggle, acciones);
    return tarjeta;
}


/* ------------------------------------------------------------
   8) ALTA / EDICIÓN / BAJA DE PRODUCTOS
   ------------------------------------------------------------ */

let idProductoEnEdicion = null;

function editarProducto(id) {
    const producto = buscarProductoPorId(id);
    if (!producto) return;

    idProductoEnEdicion = id;

    document.getElementById("input-nombre-producto").value = producto.nombre;
    document.getElementById("select-categoria-producto").value = producto.categoria;
    document.getElementById("input-precio-producto").value = producto.precio;
    document.getElementById("checkbox-disponible").checked = producto.disponible;
    document.getElementById("btn-agregar-producto").textContent = "Guardar cambios";

    document.getElementById("form-producto").scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("input-nombre-producto").focus();
}

function resetearFormularioProducto() {
    idProductoEnEdicion = null;
    document.getElementById("form-producto").reset();
    document.getElementById("btn-agregar-producto").textContent = "Agregar producto";
}

function borrarProducto(id) {
    const producto = buscarProductoPorId(id);
    if (!producto) return;

    const confirmado = confirm(`¿Eliminar "${producto.nombre}" de la carta?`);
    if (!confirmado) return;

    productos = productos.filter((p) => p.id !== id);

    if (idProductoEnEdicion === id) {
        resetearFormularioProducto();
    }

    guardarDatos();
    renderizarCarta();
    refrescarSelectProductosPedido();
}

function manejarSubmitProducto(evento) {
    evento.preventDefault();

    const nombreInput = document.getElementById("input-nombre-producto");
    const categoriaInput = document.getElementById("select-categoria-producto");
    const precioInput = document.getElementById("input-precio-producto");
    const disponibleInput = document.getElementById("checkbox-disponible");

    const nombre = nombreInput.value.trim();
    const categoria = categoriaInput.value;
    const precio = parseFloat(precioInput.value);
    const disponible = disponibleInput.checked;

    if (nombre === "") {
        alert("El nombre del producto no puede estar vacío.");
        nombreInput.focus();
        return;
    }

    if (nombreProductoDuplicado(nombre, idProductoEnEdicion)) {
        alert(`Ya existe un producto llamado "${nombre}". Elegí otro nombre.`);
        nombreInput.focus();
        return;
    }

    if (categoria === "") {
        alert("Seleccioná una categoría.");
        categoriaInput.focus();
        return;
    }

    if (isNaN(precio) || precio <= 0) {
        alert("El precio debe ser un número mayor que cero.");
        precioInput.focus();
        return;
    }

    if (idProductoEnEdicion === null) {
        productos.push({
            id: siguienteIdProducto(),
            nombre,
            categoria,
            precio,
            disponible
        });
    } else {
        const producto = buscarProductoPorId(idProductoEnEdicion);
        if (producto) {
            producto.nombre = nombre;
            producto.categoria = categoria;
            producto.precio = precio;
            producto.disponible = disponible;
        }
    }

    guardarDatos();
    resetearFormularioProducto();
    renderizarCarta();
    refrescarSelectProductosPedido();
}

function inicializarCarta() {
    const selectCategoria = document.getElementById("select-categoria-producto");

    if (selectCategoria && selectCategoria.options.length <= 1) {
        CATEGORIAS.forEach((cat) => {
            const opcion = document.createElement("option");
            opcion.value = cat;
            opcion.textContent = cat;
            selectCategoria.appendChild(opcion);
        });
    }

    const form = document.getElementById("form-producto");
    if (form) {
        form.addEventListener("submit", manejarSubmitProducto);
    }

    renderizarCarta();
}


/* ------------------------------------------------------------
   9) HELPERS DE MESAS Y PEDIDOS
   ------------------------------------------------------------ */

function siguienteIdPedido() {
    if (pedidos.length === 0) return 1;
    return Math.max(...pedidos.map((p) => p.id)) + 1;
}

function buscarMesaPorId(id) {
    return mesas.find((m) => m.id === id);
}

function buscarPedidoPorId(id) {
    return pedidos.find((p) => p.id === id);
}

function pedidoAbiertoDeMesa(mesaId) {
    return pedidos.find((p) => p.mesaId === mesaId && p.estado === "abierto") || null;
}

function calcularTotalPedido(pedido) {
    if (!pedido || !Array.isArray(pedido.items)) return 0;
    return pedido.items.reduce(
        (acumulado, item) => acumulado + item.precioUnitario * item.cantidad,
        0
    );
}

function actualizarTotalPedido(pedido) {
    pedido.total = calcularTotalPedido(pedido);
}

function esDeHoy(isoString) {
    if (!isoString) return false;
    const fecha = new Date(isoString);
    const hoy = new Date();
    return (
        fecha.getFullYear() === hoy.getFullYear() &&
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getDate() === hoy.getDate()
    );
}


/* ------------------------------------------------------------
   10) ACCIONES SOBRE MESAS
   ------------------------------------------------------------ */

function abrirPedidoEnMesa(mesaId) {
    const mesa = buscarMesaPorId(mesaId);
    if (!mesa || mesa.estado !== "libre") return;

    if (pedidoAbiertoDeMesa(mesaId)) {
        mesa.estado = "ocupada";
        guardarDatos();
        renderizarMesas();
        mostrarPedidoDeMesa(mesaId);
        return;
    }

    const nuevoPedido = {
        id: siguienteIdPedido(),
        mesaId,
        items: [],
        estado: "abierto",
        apertura: new Date().toISOString(),
        cierre: null,
        total: 0,
        formaPago: null
    };

    pedidos.push(nuevoPedido);
    mesa.estado = "ocupada";

    guardarDatos();
    renderizarMesas();
    mostrarPedidoDeMesa(mesaId);
}

function manejarClickMesa(mesaId) {
    const mesa = buscarMesaPorId(mesaId);
    if (!mesa) return;

    if (mesa.estado === "libre") {
        abrirPedidoEnMesa(mesaId);
    } else {
        mostrarPedidoDeMesa(mesaId);
    }
}


/* ------------------------------------------------------------
   11) RENDERIZADO DE LA GRILLA DE MESAS
   ------------------------------------------------------------ */

function renderizarMesas() {
    const grilla = document.getElementById("grilla-mesas");
    if (!grilla) return;

    grilla.innerHTML = "";

    mesas.forEach((mesa) => {
        const tarjeta = document.createElement("button");
        tarjeta.type = "button";
        tarjeta.className = "mesa";
        tarjeta.dataset.id = mesa.id;
        tarjeta.classList.add(mesa.estado === "ocupada" ? "mesa--ocupada" : "mesa--libre");
        tarjeta.setAttribute(
            "aria-label",
            `Mesa ${mesa.numero}, ${mesa.estado}, capacidad ${mesa.capacidad}`
        );

        const numero = document.createElement("span");
        numero.className = "mesa__numero";
        numero.textContent = `Mesa ${mesa.numero}`;
        tarjeta.appendChild(numero);

        const estado = document.createElement("span");
        estado.className = "mesa__estado";
        estado.textContent = mesa.estado === "ocupada" ? "Ocupada" : "Libre";
        tarjeta.appendChild(estado);

        if (mesa.estado === "ocupada") {
            const pedido = pedidoAbiertoDeMesa(mesa.id);
            if (pedido) {
                const total = document.createElement("span");
                total.className = "mesa__total";
                total.textContent = formatearPrecio(calcularTotalPedido(pedido));
                tarjeta.appendChild(total);
            }
        }

        tarjeta.addEventListener("click", () => manejarClickMesa(mesa.id));
        grilla.appendChild(tarjeta);
    });
}


/* ------------------------------------------------------------
   12) PANEL LATERAL DEL PEDIDO
   ------------------------------------------------------------ */

let idPedidoEnPanel = null;

function mostrarPedidoDeMesa(mesaId) {
    const panel = document.getElementById("detalle-pedido");
    if (!panel) return;

    const mesa = buscarMesaPorId(mesaId);
    if (!mesa) {
        idPedidoEnPanel = null;
        panel.innerHTML = "";
        return;
    }

    const pedido = pedidoAbiertoDeMesa(mesaId);
    idPedidoEnPanel = pedido ? pedido.id : null;

    panel.innerHTML = "";

    if (!pedido) {
        const mensaje = document.createElement("p");
        mensaje.className = "panel-pedido__vacio";
        mensaje.textContent = `La mesa ${mesa.numero} no tiene un pedido abierto.`;
        panel.appendChild(mensaje);
        return;
    }

    const encabezado = document.createElement("div");
    encabezado.className = "panel-pedido__encabezado";

    const titulo = document.createElement("h4");
    titulo.textContent = `Mesa ${mesa.numero} · Pedido #${pedido.id}`;

    const estado = document.createElement("span");
    estado.className = "panel-pedido__estado";
    estado.textContent = pedido.estado;

    encabezado.append(titulo, estado);
    panel.appendChild(encabezado);

    panel.appendChild(crearFormularioAgregarItem());

    const lista = document.createElement("ul");
    lista.className = "panel-pedido__items";

    if (pedido.items.length === 0) {
        const vacio = document.createElement("li");
        vacio.className = "panel-pedido__item-vacio";
        vacio.textContent = "Todavía no hay ítems cargados.";
        lista.appendChild(vacio);
    } else {
        pedido.items.forEach((item) => {
            lista.appendChild(crearFilaItemPedido(pedido, item));
        });
    }

    panel.appendChild(lista);

    const total = document.createElement("div");
    total.className = "panel-pedido__total";
    total.innerHTML = `<span>Total</span><strong>${formatearPrecio(calcularTotalPedido(pedido))}</strong>`;
    panel.appendChild(total);

    const btnCerrar = document.createElement("button");
    btnCerrar.type = "button";
    btnCerrar.id = "btn-cerrar-cuenta";
    btnCerrar.className = "btn-cerrar-cuenta";
    btnCerrar.textContent = "💵 Cerrar cuenta";
    btnCerrar.disabled = pedido.items.length === 0;
    if (btnCerrar.disabled) {
        btnCerrar.title = "Agregá al menos un ítem para cerrar la cuenta.";
    }
    btnCerrar.addEventListener("click", () => cerrarCuentaPedido(pedido.id));
    panel.appendChild(btnCerrar);
}

function crearFormularioAgregarItem() {
    const form = document.createElement("form");
    form.className = "panel-pedido__form";
    form.id = "form-agregar-item";
    form.noValidate = true;

    const labelProducto = document.createElement("label");
    labelProducto.setAttribute("for", "select-producto-pedido");
    labelProducto.textContent = "Producto";

    const select = document.createElement("select");
    select.id = "select-producto-pedido";
    select.name = "productoId";
    select.required = true;
    refrescarSelectProductosPedido(select);

    const labelCantidad = document.createElement("label");
    labelCantidad.setAttribute("for", "input-cantidad-pedido");
    labelCantidad.textContent = "Cantidad";

    const cantidad = document.createElement("input");
    cantidad.type = "number";
    cantidad.id = "input-cantidad-pedido";
    cantidad.name = "cantidad";
    cantidad.min = "1";
    cantidad.value = "1";
    cantidad.inputMode = "numeric";
    cantidad.required = true;

    const boton = document.createElement("button");
    boton.type = "submit";
    boton.id = "btn-agregar-item";
    boton.textContent = "➕ Agregar";

    form.append(labelProducto, select, labelCantidad, cantidad, boton);
    form.addEventListener("submit", manejarSubmitAgregarItem);

    return form;
}

function refrescarSelectProductosPedido(selectExistente) {
    const select = selectExistente || document.getElementById("select-producto-pedido");
    if (!select) return;

    const valorPrevio = select.value;
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Elegí un producto…";
    select.appendChild(placeholder);

    const disponibles = productos.filter((p) => p.disponible);

    if (disponibles.length === 0) {
        const sinStock = document.createElement("option");
        sinStock.value = "";
        sinStock.disabled = true;
        sinStock.textContent = "No hay productos disponibles";
        select.appendChild(sinStock);
        return;
    }

    disponibles.forEach((producto) => {
        const opcion = document.createElement("option");
        opcion.value = producto.id;
        opcion.textContent = `${producto.nombre} — ${formatearPrecio(producto.precio)}`;
        select.appendChild(opcion);
    });

    if (valorPrevio && disponibles.some((p) => String(p.id) === valorPrevio)) {
        select.value = valorPrevio;
    }
}

function manejarSubmitAgregarItem(evento) {
    evento.preventDefault();

    if (idPedidoEnPanel === null) {
        alert("Primero elegí una mesa con pedido abierto.");
        return;
    }

    const pedido = buscarPedidoPorId(idPedidoEnPanel);
    if (!pedido || pedido.estado !== "abierto") {
        alert("El pedido ya no está abierto.");
        return;
    }

    const select = document.getElementById("select-producto-pedido");
    const inputCantidad = document.getElementById("input-cantidad-pedido");

    const productoId = parseInt(select.value, 10);
    const cantidad = parseInt(inputCantidad.value, 10);

    if (isNaN(productoId)) {
        alert("Elegí un producto.");
        select.focus();
        return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
        alert("La cantidad debe ser un número mayor que cero.");
        inputCantidad.focus();
        return;
    }

    const producto = buscarProductoPorId(productoId);
    if (!producto) {
        alert("El producto ya no existe en la carta.");
        refrescarSelectProductosPedido();
        return;
    }

    if (!producto.disponible) {
        alert("Ese producto ya no está disponible.");
        refrescarSelectProductosPedido();
        return;
    }

    const itemExistente = pedido.items.find((it) => it.productoId === producto.id);

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        pedido.items.push({
            productoId: producto.id,
            nombre: producto.nombre,
            precioUnitario: producto.precio,
            cantidad
        });
    }

    vibrarAlAgregar();

    actualizarTotalPedido(pedido);
    guardarDatos();

    mostrarPedidoDeMesa(pedido.mesaId);
    renderizarMesas();
}

function crearFilaItemPedido(pedido, item) {
    const li = document.createElement("li");
    li.className = "panel-pedido__item";

    const info = document.createElement("div");
    info.className = "panel-pedido__item-info";

    const nombre = document.createElement("span");
    nombre.className = "panel-pedido__item-desc";
    nombre.textContent = `${item.nombre} · ${formatearPrecio(item.precioUnitario)} c/u`;

    const subtotal = document.createElement("span");
    subtotal.className = "panel-pedido__item-subtotal";
    subtotal.textContent = formatearPrecio(item.precioUnitario * item.cantidad);

    info.append(nombre, subtotal);

    const controles = document.createElement("div");
    controles.className = "panel-pedido__item-controles";

    const btnMenos = document.createElement("button");
    btnMenos.type = "button";
    btnMenos.className = "btn-cantidad btn-cantidad--menos";
    btnMenos.textContent = "−";
    btnMenos.setAttribute("aria-label", `Restar uno de ${item.nombre}`);
    btnMenos.addEventListener("click", () => cambiarCantidadItem(pedido.id, item.productoId, -1));

    const cantidadTexto = document.createElement("span");
    cantidadTexto.className = "panel-pedido__item-cantidad";
    cantidadTexto.textContent = item.cantidad;

    const btnMas = document.createElement("button");
    btnMas.type = "button";
    btnMas.className = "btn-cantidad btn-cantidad--mas";
    btnMas.textContent = "+";
    btnMas.setAttribute("aria-label", `Sumar uno de ${item.nombre}`);
    btnMas.addEventListener("click", () => cambiarCantidadItem(pedido.id, item.productoId, 1));

    controles.append(btnMenos, cantidadTexto, btnMas);

    li.append(info, controles);
    return li;
}

function cambiarCantidadItem(pedidoId, productoId, delta) {
    const pedido = buscarPedidoPorId(pedidoId);
    if (!pedido || pedido.estado !== "abierto") return;

    const item = pedido.items.find((it) => it.productoId === productoId);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        pedido.items = pedido.items.filter((it) => it.productoId !== productoId);
    }

    actualizarTotalPedido(pedido);
    guardarDatos();

    mostrarPedidoDeMesa(pedido.mesaId);
    renderizarMesas();
}


/* ------------------------------------------------------------
   13) CIERRE DE CUENTA
   ------------------------------------------------------------ */

function cerrarCuentaPedido(pedidoId) {
    const pedido = buscarPedidoPorId(pedidoId);
    if (!pedido) return;

    if (pedido.estado !== "abierto") {
        alert("Este pedido ya está cerrado.");
        return;
    }

    if (pedido.items.length === 0) {
        alert("No se puede cerrar un pedido vacío. Agregá al menos un ítem.");
        return;
    }

    mostrarModalCierre(pedido);
}

function mostrarModalCierre(pedido) {
    const existente = document.getElementById("modal-cierre");
    if (existente) existente.remove();

    const dialog = document.createElement("dialog");
    dialog.id = "modal-cierre";
    dialog.className = "modal-cierre";

    const titulo = document.createElement("h3");
    titulo.textContent = `Cerrar cuenta · Pedido #${pedido.id}`;

    const resumen = document.createElement("p");
    resumen.className = "modal-cierre__resumen";
    resumen.innerHTML = `Total a cobrar: <strong>${formatearPrecio(calcularTotalPedido(pedido))}</strong>`;

    const form = document.createElement("form");
    form.method = "dialog";
    form.className = "modal-cierre__form";

    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = "Forma de pago";
    fieldset.appendChild(legend);

    FORMAS_PAGO.forEach((forma) => {
        const label = document.createElement("label");
        label.className = "modal-cierre__opcion";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "forma-pago";
        radio.value = forma;
        radio.required = true;

        const texto = document.createElement("span");
        texto.textContent = forma.charAt(0).toUpperCase() + forma.slice(1);

        label.append(radio, texto);
        fieldset.appendChild(label);
    });

    form.appendChild(fieldset);

    const acciones = document.createElement("div");
    acciones.className = "modal-cierre__acciones";

    const btnCancelar = document.createElement("button");
    btnCancelar.type = "button";
    btnCancelar.className = "btn-secundario";
    btnCancelar.textContent = "Cancelar";
    btnCancelar.addEventListener("click", () => dialog.close());

    const btnConfirmar = document.createElement("button");
    btnConfirmar.type = "submit";
    btnConfirmar.className = "btn-confirmar";
    btnConfirmar.textContent = "Confirmar cierre";

    acciones.append(btnCancelar, btnConfirmar);
    form.appendChild(acciones);

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const seleccionado = form.querySelector('input[name="forma-pago"]:checked');
        if (!seleccionado) {
            alert("Elegí una forma de pago.");
            return;
        }
        cerrarPedido(pedido.id, seleccionado.value);
        dialog.close();
    });

    dialog.append(titulo, resumen, form);
    document.body.appendChild(dialog);

    if (typeof dialog.showModal === "function") {
        dialog.showModal();
    } else {
        dialog.setAttribute("open", "");
    }

    dialog.addEventListener("close", () => dialog.remove());
}

function cerrarPedido(pedidoId, formaPago) {
    const pedido = buscarPedidoPorId(pedidoId);
    if (!pedido) return;

    if (pedido.estado !== "abierto") {
        alert("Este pedido ya está cerrado.");
        return;
    }

    if (pedido.items.length === 0) {
        alert("No se puede cerrar un pedido vacío.");
        return;
    }

    if (!FORMAS_PAGO.includes(formaPago)) {
        alert("Forma de pago inválida.");
        return;
    }

    pedido.estado = "cerrado";
    pedido.cierre = new Date().toISOString();
    pedido.total = calcularTotalPedido(pedido);
    pedido.formaPago = formaPago;

    const mesa = buscarMesaPorId(pedido.mesaId);
    if (mesa) {
        mesa.estado = "libre";
    }

    const ticket = {
        pedidoId: pedido.id,
        mesaNumero: mesa ? mesa.numero : "?",
        items: pedido.items.map((it) => ({ ...it })),
        total: pedido.total,
        formaPago: pedido.formaPago,
        apertura: pedido.apertura,
        cierre: pedido.cierre
    };

    guardarDatos();

    renderizarMesas();
    limpiarPanelPedido();
    renderizarCaja();

    mostrarTicket(ticket);
}

function limpiarPanelPedido() {
    idPedidoEnPanel = null;
    const panel = document.getElementById("detalle-pedido");
    if (!panel) return;

    panel.innerHTML = "";
    const mensaje = document.createElement("p");
    mensaje.className = "panel-pedido__vacio";
    mensaje.textContent = "Elegí una mesa para ver o abrir su pedido.";
    panel.appendChild(mensaje);
}

function generarTextoCompartirTicket(ticket) {
    const lineas = [];
    lineas.push("🧾 Bar La Esquina");
    lineas.push(`Mesa ${ticket.mesaNumero} · Pedido #${ticket.pedidoId}`);
    lineas.push(`Apertura: ${formatearHora(ticket.apertura)} · Cierre: ${formatearHora(ticket.cierre)}`);
    lineas.push("————————————");
    ticket.items.forEach((item) => {
        const subtotal = formatearPrecio(item.precioUnitario * item.cantidad);
        lineas.push(`${item.cantidad} × ${item.nombre} — ${subtotal}`);
    });
    lineas.push("————————————");
    lineas.push(`Total: ${formatearPrecio(ticket.total)}`);
    lineas.push(`Forma de pago: ${ticket.formaPago}`);
    lineas.push("");
    lineas.push("¡Gracias por tu visita!");
    return lineas.join("\n");
}

async function compartirTicket(ticket) {
    const texto = generarTextoCompartirTicket(ticket);
    const datosCompartir = {
        title: `Ticket Bar La Esquina · Mesa ${ticket.mesaNumero}`,
        text: texto
    };

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
            await navigator.share(datosCompartir);
            return;
        } catch (error) {
            if (error && error.name === "AbortError") return;
        }
    }

    try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            await navigator.clipboard.writeText(texto);
            alert("El detalle de la cuenta se copió al portapapeles.");
       