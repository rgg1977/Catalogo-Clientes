let editIndex = null;
const USER_OK = "admin", PASS_OK = "1234";

// --- NAVEGACIÓN ---
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
        cargarClientes();
    } else {
        document.getElementById('sectionCreditos').style.display = 'block';
    }
}

function ocultarTodo() {
    ['loginSection', 'mainMenu', 'sectionClientes', 'sectionCreditos'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function logout() { sessionStorage.clear(); location.reload(); }

// --- CATÁLOGO CLIENTES ---
document.getElementById('clientForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const cliente = {
        codigo: document.getElementById('codigo').value,
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
    if(editIndex === null) clientes.push(cliente);
    else { clientes[editIndex] = cliente; editIndex = null; }
    localStorage.setItem('misClientes', JSON.stringify(clientes));
    this.reset();
    cargarClientes();
});

function cargarClientes() {
    const clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    const tbody = document.querySelector('#clientTable tbody');
    tbody.innerHTML = clientes.map((c, i) => `
        <tr>
            <td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td>
            <td>${c.curp}</td><td><b>${c.estatus}</b></td>
            <td>
                <button onclick="prepararEdicion(${i})" class="btn-info">✏️</button>
                <button onclick="eliminarCliente(${i})" class="btn-del">🗑️</button>
            </td>
        </tr>`).join('');
}

// --- ALTA DE CRÉDITO Y PDF ---
function abrirBuscador() {
    const clientes = (JSON.parse(localStorage.getItem('misClientes')) || []).filter(c => c.estatus === 'Activo');
    const tbody = document.querySelector('#modalTable tbody');
    tbody.innerHTML = clientes.map(c => `
        <tr>
            <td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td>
            <td><button onclick="seleccionarCliente('${c.codigo}','${c.nombre} ${c.apellidoP}')" class="btn-save">Elegir</button></td>
        </tr>`).join('');
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

        // Regla: Día 15 -> Fin de mes | Fin de mes -> Día 15 próximo mes
        if (fechaActual.getDate() <= 15) {
            fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
        } else {
            fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 15);
        }
    }
    document.getElementById('tablaAmortizacionContainer').style.display = 'block';
});

function imprimirPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const nombre = document.getElementById('creditoNombre').value;
    if(!nombre) { alert("Genere la tabla primero"); return; }

    doc.setFontSize(16);
    doc.text("TABLA DE AMORTIZACIÓN QUINCENAL", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Cliente: ${nombre}`, 20, 40);
    doc.text(`Importe: $${document.getElementById('importe').value}`, 20, 50);

    doc.autoTable({
        startY: 60,
        head: [['No.', 'Vencimiento', 'Importe']],
        body: Array.from(document.querySelectorAll("#amortTable tbody tr")).map(tr => 
            Array.from(tr.querySelectorAll("td")).map(td => td.innerText)
        )
    });
    doc.save(`Credito_${nombre}.pdf`);
}

function cerrarModal() { document.getElementById('modalBusqueda').style.display = 'none'; }
function limpiarFormulario() { document.getElementById('clientForm').reset(); }
function limpiarFormCredito() { document.getElementById('creditForm').reset(); document.getElementById('tablaAmortizacionContainer').style.display = 'none'; }
function borrarCreditoActual() { if(confirm("¿Borrar datos?")) limpiarFormCredito(); }
function guardarCredito() { alert("Crédito Guardado Correctamente"); }
function eliminarCliente(i) { if(confirm("¿Eliminar?")) { let c = JSON.parse(localStorage.getItem('misClientes')); c.splice(i,1); localStorage.setItem('misClientes', JSON.stringify(c)); cargarClientes(); } }

checkLogin();