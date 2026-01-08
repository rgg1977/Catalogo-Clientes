let editIndex = null;
const USER_OK = "admin", PASS_OK = "1234";

// --- INICIO Y NAVEGACIÓN ---
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
        prepararNuevoCliente();
        cargarClientes();
    } else {
        document.getElementById('sectionCreditos').style.display = 'block';
        prepararAltaCredito();
    }
}

// --- LÓGICA AUTO-INCREMENTAL ---
function prepararNuevoCliente() {
    if(editIndex !== null) return;
    let ultimo = parseInt(localStorage.getItem('ultimoCodigoCliente')) || 0;
    document.getElementById('codigo').value = ultimo + 1;
}

function prepararAltaCredito() {
    let ultimo = parseInt(localStorage.getItem('ultimoFolio')) || 0;
    document.getElementById('folio').value = ultimo + 1;
    document.getElementById('fechaCaptura').value = new Date().toISOString().split('T')[0];
    document.getElementById('tablaAmortizacionContainer').style.display = 'none';
}

// --- GESTIÓN CLIENTES ---
document.getElementById('clientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const codActual = document.getElementById('codigo').value;
    const cliente = {
        codigo: codActual,
        nombre: document.getElementById('nombre').value,
        apellidoP: document.getElementById('apellidoPaterno').value,
        apellidoM: document.getElementById('apellidoMaterno').value,
        curp: document.getElementById('curp').value,
        ine: document.getElementById('ine').value,
        direccion: document.getElementById('direccion').value,
        telefono: document.getElementById('telefono').value,
        estatus: document.getElementById('estatus').value
    };
    let clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    if(editIndex === null) {
        clientes.push(cliente);
        localStorage.setItem('ultimoCodigoCliente', codActual);
    } else {
        clientes[editIndex] = cliente;
        editIndex = null;
    }
    localStorage.setItem('misClientes', JSON.stringify(clientes));
    limpiarFormulario();
    cargarClientes();
});

function cargarClientes() {
    const clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    const tbody = document.querySelector('#clientTable tbody');
    tbody.innerHTML = clientes.map((c, i) => `
        <tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td><td>${c.curp}</td><td>${c.estatus}</td>
        <td><button onclick="prepararEdicion(${i})" class="btn-info">✏️</button>
        <button onclick="eliminarCliente(${i})" class="btn-del">🗑️</button></td></tr>`).join('');
}

function prepararEdicion(i) {
    editIndex = i;
    const c = JSON.parse(localStorage.getItem('misClientes'))[i];
    document.getElementById('codigo').value = c.codigo;
    document.getElementById('nombre').value = c.nombre;
    document.getElementById('apellidoPaterno').value = c.apellidoP;
    document.getElementById('apellidoMaterno').value = c.apellidoM;
    document.getElementById('curp').value = c.curp;
    document.getElementById('estatus').value = c.estatus;
    // ... completar otros campos si se desea
}

function imprimirListadoClientesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    doc.text("LISTADO GENERAL DE CLIENTES", 105, 20, { align: "center" });
    doc.autoTable({
        startY: 30,
        head: [['Cód.', 'Nombre Completo', 'CURP', 'Estatus']],
        body: clientes.map(c => [c.codigo, `${c.nombre} ${c.apellidoP}`, c.curp, c.estatus])
    });
    doc.save("Listado_Clientes.pdf");
}

// --- GESTIÓN CRÉDITOS ---
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
        folio: folio,
        fechaCaptura: document.getElementById('fechaCaptura').value,
        nombre: document.getElementById('creditoNombre').value,
        importe: document.getElementById('importe').value,
        pagos: document.getElementById('numPagos').value
    };

    let historial = JSON.parse(localStorage.getItem('historialCreditos')) || [];
    historial.push(credito);
    localStorage.setItem('historialCreditos', JSON.stringify(historial));
    localStorage.setItem('ultimoFolio', folio);
    
    alert("Guardado con Folio: " + folio);
    limpiarFormCredito();
}

function abrirHistorialCreditos() {
    let historial = JSON.parse(localStorage.getItem('historialCreditos')) || [];
    // Ordenar Descendente: Fecha y luego Folio
    historial.sort((a,b) => (b.fechaCaptura.localeCompare(a.fechaCaptura)) || (b.folio - a.folio));
    
    const tbody = document.querySelector('#historialTable tbody');
    tbody.innerHTML = historial.map(h => `
        <tr><td>${h.folio}</td><td>${h.nombre}</td><td>${h.fechaCaptura}</td><td>$ ${h.importe}</td><td>${h.pagos}</td></tr>
    `).join('');
    document.getElementById('modalHistorial').style.display = 'block';
}

function imprimirPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("TABLA DE AMORTIZACIÓN", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Folio: ${document.getElementById('folio').value}`, 20, 25);
    doc.text(`Cliente: ${document.getElementById('creditoNombre').value}`, 20, 32);
    doc.autoTable({
        startY: 40,
        head: [['No.', 'Fecha', 'Importe']],
        body: Array.from(document.querySelectorAll("#amortTable tbody tr")).map(tr => 
            Array.from(tr.querySelectorAll("td")).map(td => td.innerText))
    });
    doc.save(`Credito_Folio_${document.getElementById('folio').value}.pdf`);
}

// --- AUXILIARES ---
function abrirBuscador() {
    const clientes = (JSON.parse(localStorage.getItem('misClientes')) || []).filter(c => c.estatus === 'Activo');
    const tbody = document.querySelector('#modalTable tbody');
    tbody.innerHTML = clientes.map(c => `<tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td>
        <td><button onclick="seleccionarCliente('${c.codigo}','${c.nombre} ${c.apellidoP}')" class="btn-save">Elegir</button></td></tr>`).join('');
    document.getElementById('modalBusqueda').style.display = 'block';
}
function seleccionarCliente(c, n) { document.getElementById('creditoClave').value = c; document.getElementById('creditoNombre').value = n; cerrarModal(); }
function cerrarModal() { document.getElementById('modalBusqueda').style.display = 'none'; }
function cerrarModalHistorial() { document.getElementById('modalHistorial').style.display = 'none'; }
function limpiarFormulario() { document.getElementById('clientForm').reset(); editIndex = null; prepararNuevoCliente(); }
function limpiarFormCredito() { document.getElementById('creditForm').reset(); prepararAltaCredito(); }
function eliminarCliente(i) { if(confirm("¿Eliminar?")) { let c = JSON.parse(localStorage.getItem('misClientes')); c.splice(i,1); localStorage.setItem('misClientes', JSON.stringify(c)); cargarClientes(); } }

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if(document.getElementById('userInput').value === USER_OK && document.getElementById('passInput').value === PASS_OK) {
        sessionStorage.setItem('isLogged', 'true'); checkLogin();
    } else { document.getElementById('loginError').style.display = 'block'; }
});

checkLogin();
