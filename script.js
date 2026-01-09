// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBN5QRHGsr4-N-_vx152-21_1SOsuuOrmM",
  authDomain: "datos-creditosweb.firebaseapp.com",
  projectId: "datos-creditosweb",
  storageBucket: "datos-creditosweb.firebasestorage.app",
  messagingSenderId: "504600428376",
  appId: "1:504600428376:web:c377b08e65d72523202f2d"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

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
        prepararNuevoCliente(); 
        cargarClientes();
    } else {
        document.getElementById('sectionCreditos').style.display = 'block';
        prepararAltaCredito();
    }
}

// --- UTILIDADES ---
function formatearFechaEspecial(fechaStr) {
    if(!fechaStr) return "";
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const [año, mes, dia] = fechaStr.split('-');
    return `${dia}/${meses[parseInt(mes)-1]}/${año}`;
}

// --- LÓGICA AUTO-INCREMENTAL CON FIREBASE ---
async function prepararNuevoCliente() {
    db.ref('contadores/ultimoCodigoCliente').once('value', (snapshot) => {
        let ultimo = snapshot.val() || 0;
        document.getElementById('codigo').value = ultimo + 1;
    });
}

async function prepararAltaCredito() {
    db.ref('contadores/ultimoFolio').once('value', (snapshot) => {
        let ultimo = snapshot.val() || 0;
        document.getElementById('folio').value = ultimo + 1;
    });
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
        estatus: document.getElementById('estatus').value
    };

    // Guardar en Firebase
    db.ref('clientes/' + codActual).set(cliente).then(() => {
        db.ref('contadores/ultimoCodigoCliente').set(parseInt(codActual));
        limpiarFormulario();
        cargarClientes();
    });
});

function cargarClientes() {
    db.ref('clientes').once('value', (snapshot) => {
        const tbody = document.querySelector('#clientTable tbody');
        tbody.innerHTML = "";
        snapshot.forEach((child) => {
            const c = child.val();
            tbody.innerHTML += `<tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td><td>${c.curp}</td>
            <td><button onclick="eliminarCliente('${c.codigo}')" class="btn-del">🗑️</button></td></tr>`;
        });
    });
}

function eliminarCliente(codigo) {
    if(confirm("¿Eliminar cliente?")) {
        db.ref('clientes/' + codigo).remove().then(() => cargarClientes());
    }
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
    const folio = document.getElementById('folio').value;
    if(!document.getElementById('creditoClave').value) return alert("Seleccione cliente");
    
    const credito = {
        folio: parseInt(folio),
        clave: document.getElementById('creditoClave').value,
        nombre: document.getElementById('creditoNombre').value,
        fechaCaptura: document.getElementById('fechaCaptura').value,
        fechaVencimiento: document.getElementById('fechaVencimiento').value,
        importe: document.getElementById('importe').value,
        pagos: document.getElementById('numPagos').value
    };

    db.ref('creditos/' + folio).set(credito).then(() => {
        db.ref('contadores/ultimoFolio').set(parseInt(folio));
        alert("Crédito Guardado en la Nube");
        limpiarFormCredito();
    });
}

function abrirHistorialCreditos() {
    db.ref('creditos').once('value', (snapshot) => {
        let historial = [];
        snapshot.forEach(child => { historial.push(child.val()); });
        
        // Orden Descendente
        historial.sort((a,b) => b.fechaCaptura.localeCompare(a.fechaCaptura) || b.folio - a.folio);
        
        const tbody = document.querySelector('#historialTable tbody');
        tbody.innerHTML = historial.map(h => `
            <tr><td>${h.folio}</td><td>${h.nombre}</td><td>${formatearFechaEspecial(h.fechaCaptura)}</td>
            <td>$ ${h.importe}</td><td>${h.pagos}</td>
            <td><button onclick="consultarCredito(${h.folio})" class="btn-info">Ver</button></td></tr>`).join('');
        document.getElementById('modalHistorial').style.display = 'block';
    });
}

function consultarCredito(folioBuscado) {
    db.ref('creditos/' + folioBuscado).once('value', (snapshot) => {
        const h = snapshot.val();
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
    });
}

// --- MODALES Y OTROS ---
function abrirBuscador() {
    db.ref('clientes').once('value', (snapshot) => {
        const tbody = document.querySelector('#modalTable tbody');
        tbody.innerHTML = "";
        snapshot.forEach(child => {
            const c = child.val();
            if(c.estatus === 'Activo') {
                tbody.innerHTML += `<tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td>
                <td><button onclick="seleccionarCliente('${c.codigo}','${c.nombre} ${c.apellidoP}')" class="btn-save">Elegir</button></td></tr>`;
            }
        });
        document.getElementById('modalBusqueda').style.display = 'block';
    });
}

function seleccionarCliente(c, n) { document.getElementById('creditoClave').value = c; document.getElementById('creditoNombre').value = n; cerrarModal(); }
function cerrarModal() { document.getElementById('modalBusqueda').style.display = 'none'; }
function cerrarModalHistorial() { document.getElementById('modalHistorial').style.display = 'none'; }
function limpiarFormulario() { document.getElementById('clientForm').reset(); prepararNuevoCliente(); }
function limpiarFormCredito() { document.getElementById('creditForm').reset(); prepararAltaCredito(); }

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if(document.getElementById('userInput').value === USER_OK && document.getElementById('passInput').value === PASS_OK) {
        sessionStorage.setItem('isLogged', 'true'); checkLogin();
    }
});

checkLogin();
