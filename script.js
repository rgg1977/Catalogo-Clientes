let editIndex = null;
const USER_OK = "admin", PASS_OK = "1234";

// --- NAVEGACIÓN ---
function checkLogin() {
    if(sessionStorage.getItem('isLogged') === 'true') {
        document.getElementById('loginSection').style.display = 'none';
        showMenu();
    }
}
function showMenu() { ocultarTodo(); document.getElementById('mainMenu').style.display = 'block'; }
function logout() { sessionStorage.clear(); location.reload(); }
function ocultarTodo() {
    ['loginSection', 'mainMenu', 'sectionClientes', 'sectionCreditos'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}
function showSection(section) {
    ocultarTodo();
    if(section === 'clientes') {
        document.getElementById('sectionClientes').style.display = 'block';
        prepararNuevoCliente(); cargarClientes();
    } else {
        document.getElementById('sectionCreditos').style.display = 'block';
        prepararAltaCredito();
    }
}

// --- FORMATEO DE FECHA dd/mmm/aaaa ---
function formatearFechaEspecial(fechaStr) {
    if(!fechaStr) return "";
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const [año, mes, dia] = fechaStr.split('-');
    return `${dia}/${meses[parseInt(mes)-1]}/${año}`;
}

// --- GESTIÓN CLIENTES ---
function prepararNuevoCliente() {
    if(editIndex !== null) return;
    let ultimo = parseInt(localStorage.getItem('ultimoCodigoCliente')) || 0;
    document.getElementById('codigo').value = ultimo + 1;
}

document.getElementById('clientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const codActual = document.getElementById('codigo').value;
    const cliente = {
        codigo: codActual, nombre: document.getElementById('nombre').value,
        apellidoP: document.getElementById('apellidoPaterno').value,
        apellidoM: document.getElementById('apellidoMaterno').value,
        curp: document.getElementById('curp').value, estatus: document.getElementById('estatus').value
    };
    let clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    if(editIndex === null) { clientes.push(cliente); localStorage.setItem('ultimoCodigoCliente', codActual); }
    else { clientes[editIndex] = cliente; editIndex = null; }
    localStorage.setItem('misClientes', JSON.stringify(clientes));
    limpiarFormulario(); cargarClientes();
});

function cargarClientes() {
    const clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    const tbody = document.querySelector('#clientTable tbody');
    tbody.innerHTML = clientes.map((c, i) => `<tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td><td>${c.curp}</td><td><button onclick="eliminarCliente(${i})" class="btn-del">🗑️</button></td></tr>`).join('');
}

// --- GESTIÓN CRÉDITOS ---
function prepararAltaCredito() {
    let ultimo = parseInt(localStorage.getItem('ultimoFolio')) || 0;
    document.getElementById('folio').value = ultimo + 1;
    document.getElementById('fechaCaptura').value = new Date().toISOString().split('T')[0];
    document.getElementById('tablaAmortizacionContainer').style.display = 'none';
}

function calcularPagos() {
    const imp = parseFloat(document.getElementById('importe').value) || 0;
    const pag = parseInt(document.getElementById('numPagos').value) || 0;
    document.getElementById('importePago').value = pag > 0 ? (imp / pag).toFixed(2) : "0.00";
}

document.getElementById('creditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const numPagos = parseInt(document.getElementById('numPagos').value);
    const importePago = document.getElementById('importePago').value;
    let fechaActual = new Date(document.getElementById('fechaVencimiento').value + "T00:00:00");
    const tbody = document.querySelector('#amortTable tbody');
    tbody.innerHTML = "";
    for(let i = 1; i <= numPagos; i++) {
        let f = new Date(fechaActual);
        tbody.innerHTML += `<tr><td>${i}</td><td>${f.toLocaleDateString('es-MX')}</td><td>$ ${importePago}</td></tr>`;
        if (fechaActual.getDate() <= 15) fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
        else fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 15);
    }
    document.getElementById('tablaAmortizacionContainer').style.display = 'block';
});

function guardarCredito() {
    const folio = parseInt(document.getElementById('folio').value);
    if(!document.getElementById('creditoClave').value) return alert("Seleccione cliente");
    
    const credito = {
        folio: folio, clave: document.getElementById('creditoClave').value,
        nombre: document.getElementById('creditoNombre').value,
        fechaCaptura: document.getElementById('fechaCaptura').value,
        fechaVencimiento: document.getElementById('fechaVencimiento').value,
        importe: document.getElementById('importe').value, pagos: document.getElementById('numPagos').value
    };

    let historial = JSON.parse(localStorage.getItem('historialCreditos')) || [];
    const index = historial.findIndex(h => h.folio === folio);
    if(index !== -1) historial[index] = credito; 
    else { historial.push(credito); localStorage.setItem('ultimoFolio', folio); }
    
    localStorage.setItem('historialCreditos', JSON.stringify(historial));
    alert("Crédito Guardado"); limpiarFormCredito();
}

function abrirHistorialCreditos() {
    let historial = JSON.parse(localStorage.getItem('historialCreditos')) || [];
    historial.sort((a,b) => b.fechaCaptura.localeCompare(a.fechaCaptura) || b.folio - a.folio);
    
    const tbody = document.querySelector('#historialTable tbody');
    tbody.innerHTML = historial.map(h => `
        <tr><td>${h.folio}</td><td>${h.nombre}</td><td>${formatearFechaEspecial(h.fechaCaptura)}</td>
        <td>$ ${h.importe}</td><td>${h.pagos}</td>
        <td><button onclick="consultarCredito(${h.folio})" class="btn-info">Ver</button></td></tr>`).join('');
    document.getElementById('modalHistorial').style.display = 'block';
}

function consultarCredito(folioBuscado) {
    const historial = JSON.parse(localStorage.getItem('historialCreditos')) || [];
    const h = historial.find(c => c.folio === folioBuscado);
    if(h) {
        document.getElementById('folio').value = h.folio;
        document.getElementById('fechaCaptura').value = h.fechaCaptura;
        document.getElementById('creditoClave').value = h.clave;
        document.getElementById('creditoNombre').value = h.nombre;
        document.getElementById('importe').value = h.importe;
        document.getElementById('numPagos').value = h.pagos;
        document.getElementById('fechaVencimiento').value = h.fechaVencimiento;
        calcularPagos();
        document.getElementById('creditForm').dispatchEvent(new Event('submit'));
        cerrarModalHistorial();
    }
}

// --- AUXILIARES ---
function abrirBuscador() {
    const clientes = (JSON.parse(localStorage.getItem('misClientes')) || []).filter(c => c.estatus === 'Activo');
    const tbody = document.querySelector('#modalTable tbody');
    tbody.innerHTML = clientes.map(c => `<tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td><td><button onclick="seleccionarCliente('${c.codigo}','${c.nombre} ${c.apellidoP}')" class="btn-save">Elegir</button></td></tr>`).join('');
    document.getElementById('modalBusqueda').style.display = 'block';
}
function seleccionarCliente(c, n) { document.getElementById('creditoClave').value = c; document.getElementById('creditoNombre').value = n; cerrarModal(); }
function cerrarModal() { document.getElementById('modalBusqueda').style.display = 'none'; }
function cerrarModalHistorial() { document.getElementById('modalHistorial').style.display = 'none'; }
function limpiarFormulario() { document.getElementById('clientForm').reset(); editIndex = null; prepararNuevoCliente(); }
function limpiarFormCredito() { document.getElementById('creditForm').reset(); prepararAltaCredito(); }

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if(document.getElementById('userInput').value === USER_OK && document.getElementById('passInput').value === PASS_OK) {
        sessionStorage.setItem('isLogged', 'true'); checkLogin();
    }
});

checkLogin();
