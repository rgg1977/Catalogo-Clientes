let editIndex = null;
const USER_OK = "admin", PASS_OK = "1234";

// --- NAVEGACIÓN Y LOGIN ---
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if(document.getElementById('userInput').value === USER_OK && document.getElementById('passInput').value === PASS_OK) {
        sessionStorage.setItem('isLogged', 'true');
        checkLogin();
    } else { document.getElementById('loginError').style.display = 'block'; }
});

function checkLogin() {
    if(sessionStorage.getItem('isLogged') === 'true') {
        document.getElementById('loginSection').style.display = 'none';
        showMenu();
    }
}

function showMenu() {
    ocultarTodo();
    document.getElementById('mainMenu').style.display = 'block';
}

function showSection(section) {
    ocultarTodo();
    if(section === 'clientes') {
        document.getElementById('sectionClientes').style.display = 'block';
        prepararNuevoCliente();
        cargarClientes();
    } else if(section === 'creditos') {
        document.getElementById('sectionCreditos').style.display = 'block';
        prepararAltaCredito();
    }
}

function ocultarTodo() {
    ['loginSection', 'mainMenu', 'sectionClientes', 'sectionCreditos'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function logout() { sessionStorage.clear(); location.reload(); }

// --- LÓGICA DE AUTO-INCREMENTOS (CLIENTES Y FOLIOS) ---

function prepararNuevoCliente() {
    if(editIndex !== null) return;
    let ultimoCod = parseInt(localStorage.getItem('ultimoCodigoCliente')) || 0;
    document.getElementById('codigo').value = ultimoCod + 1;
}

function prepararAltaCredito() {
    let ultimoFolio = parseInt(localStorage.getItem('ultimoFolio')) || 0;
    document.getElementById('folio').value = ultimoFolio + 1;
    document.getElementById('fechaCaptura').value = new Date().toISOString().split('T')[0];
    document.getElementById('tablaAmortizacionContainer').style.display = 'none';
}

// --- GESTIÓN DE CLIENTES ---
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
        <tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td><td>${c.curp}</td>
        <td><b>${c.estatus}</b></td>
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
    document.getElementById('ine').value = c.ine;
    document.getElementById('direccion').value = c.direccion;
    document.getElementById('telefono').value = c.telefono;
    document.getElementById('estatus').value = c.estatus;
}

function limpiarFormulario() {
    document.getElementById('clientForm').reset();
    editIndex = null;
    prepararNuevoCliente();
}

function eliminarCliente(i) { 
    if(confirm("¿Estás seguro de eliminar este cliente?")) { 
        let c = JSON.parse(localStorage.getItem('misClientes')); 
        c.splice(i,1); 
        localStorage.setItem('misClientes', JSON.stringify(c)); 
        cargarClientes(); 
    } 
}

function imprimirListadoClientesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Listado de Clientes", 105, 20, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-MX')}`, 20, 30);

    const clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    const data = clientes.map(c => [
        c.codigo,
        `${c.nombre} ${c.apellidoP} ${c.apellidoM}`,
        c.curp,
        c.telefono,
        c.estatus
    ]);

    doc.autoTable({
        startY: 40,
        head: [['Código', 'Nombre Completo', 'CURP', 'Teléfono', 'Estatus']],
        body: data,
        theme: 'striped',
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 9 }
    });

    doc.save(`Listado_Clientes_${new Date().toLocaleDateString('es-MX')}.pdf`);
}

// --- LÓGICA DE CRÉDITOS ---
document.getElementById('creditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const numPagos = parseInt(document.getElementById('numPagos').value);
    const importePago = document.getElementById('importePago').value;
    let fechaActual = new Date(document.getElementById('fechaVencimiento').value + "T00:00:00");
    const tbody = document.querySelector('#amortTable tbody');
    tbody.innerHTML = "";
    for(let i = 1; i <= numPagos; i++) {
        let fechaPago = new Date(fechaActual);
        tbody.innerHTML += `<tr><td>${i}</td><td>${fechaPago.toLocaleDateString('es-MX')}</td><td>$ ${importePago}</td></tr>`;
        if (fechaActual.getDate() <= 15) fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
        else fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 15);
    }
    document.getElementById('tablaAmortizacionContainer').style.display = 'block';
});

function guardarCredito() {
    const folio = document.getElementById('folio').value;
    if(!document.getElementById('creditoClave').value) return alert("Seleccione un cliente primero");
    localStorage.setItem('ultimoFolio', folio);
    alert("Crédito Folio " + folio + " Guardado");
    limpiarFormCredito();
}

function imprimirPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text("TABLA DE AMORTIZACIÓN", 105, 20, { align: "center" });
    doc.text(`Folio: ${document.getElementById('folio').value}`, 160, 35);
    doc.text(`Fecha: ${document.getElementById('fechaCaptura').value}`, 160, 42);
    doc.text(`Cliente: ${document.getElementById('creditoNombre').value}`, 20, 50);
    doc.autoTable({
        startY: 60,
        head: [['No.', 'Vencimiento', 'Importe']],
        body: Array.from(document.querySelectorAll("#amortTable tbody tr")).map(tr => 
            Array.from(tr.querySelectorAll("td")).map(td => td.innerText)
        )
    });
    doc.save(`Credito_Folio_${document.getElementById('folio').value}.pdf`);
}

// --- OTROS ---
function abrirBuscador() {
    const clientes = (JSON.parse(localStorage.getItem('misClientes')) || []).filter(c => c.estatus === 'Activo');
    const tbody = document.querySelector('#modalTable tbody');
    tbody.innerHTML = clientes.map(c => `
        <tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td>
        <td><button onclick="seleccionarCliente('${c.codigo}','${c.nombre} ${c.apellidoP}')" class="btn-save">Elegir</button></td></tr>`).join('');
    document.getElementById('modalBusqueda').style.display = 'block';
}

function seleccionarCliente(cod, nom) {
    document.getElementById('creditoClave').value = cod;
    document.getElementById('creditoNombre').value = nom;
    cerrarModal();
}

function calcularPagos() {
    const imp = parseFloat(document.getElementById('importe').value) || 0;
    const pag = parseInt(document.getElementById('numPagos').value) || 0;
    document.getElementById('importePago').value = pag > 0 ? (imp / pag).toFixed(2) : "0.00";
}

function cerrarModal() { document.getElementById('modalBusqueda').style.display = 'none'; }
function limpiarFormCredito() { document.getElementById('creditForm').reset(); prepararAltaCredito(); }

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if(document.getElementById('userInput').value === USER_OK && document.getElementById('passInput').value === PASS_OK) {
        sessionStorage.setItem('isLogged', 'true');
        checkLogin();
    }
});

checkLogin();
