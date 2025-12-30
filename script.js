let editIndex = null;
const USER_OK = "admin", PASS_OK = "1234";

// --- LOGIN Y NAVEGACIÓN ---
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
        document.getElementById('tablaAmortizacionContainer').style.display = 'none';
    }
}

function ocultarTodo() {
    ['loginSection', 'mainMenu', 'sectionClientes', 'sectionCreditos'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function logout() { sessionStorage.clear(); location.reload(); }

// --- LÓGICA DE CLIENTES ---
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
            <td>${c.curp}</td><td>${c.telefono}</td>
            <td style="color:${c.estatus=='Activo'?'green':'red'}"><b>${c.estatus}</b></td>
            <td>
                <button onclick="prepararEdicion(${i})" class="btn-info">✏️</button>
                <button onclick="eliminarCliente(${i})" class="btn-del">🗑️</button>
            </td>
        </tr>`).join('');
}

// --- LÓGICA DE CRÉDITOS (REGLA: DÍA 15 Y ÚLTIMO) ---
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
    
    // Fecha seleccionada como inicio
    let fechaActual = new Date(document.getElementById('fechaVencimiento').value + "T00:00:00");
    
    const tbody = document.querySelector('#amortTable tbody');
    tbody.innerHTML = "";

    for(let i = 1; i <= numPagos; i++) {
        let fechaPago = new Date(fechaActual);
        
        // Agregar fila a la tabla
        tbody.innerHTML += `
            <tr>
                <td>${i}</td>
                <td>${fechaPago.toLocaleDateString('es-MX')}</td>
                <td>$ ${importePago}</td>
            </tr>
        `;

        // LÓGICA DE SALTO AL SIGUIENTE PERIODO (15 o Último)
        if (fechaActual.getDate() <= 15) {
            // Si estamos en el 15 (o antes), el siguiente pago es el último día del MISMO mes
            // El día 0 del siguiente mes es el último día del mes actual
            fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
        } else {
            // Si estamos a fin de mes, el siguiente pago es el día 15 del SIGUIENTE mes
            fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 15);
        }
    }
    document.getElementById('tablaAmortizacionContainer').style.display = 'block';
});

function cerrarModal() { document.getElementById('modalBusqueda').style.display = 'none'; }
function eliminarCliente(i) { if(confirm("¿Eliminar?")) { let c = JSON.parse(localStorage.getItem('misClientes')); c.splice(i,1); localStorage.setItem('misClientes', JSON.stringify(c)); cargarClientes(); } }

checkLogin();
