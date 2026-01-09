// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBN5QRHGsr4-N-_vx152-21_1SOsuuOrmM",
  authDomain: "datos-creditosweb.firebaseapp.com",
  projectId: "datos-creditosweb",
  storageBucket: "datos-creditosweb.firebasestorage.app",
  messagingSenderId: "504600428376",
  appId: "1:504600428376:web:c377b08e65d72523202f2d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const USER_OK = "admin", PASS_OK = "1234";
let clientesCache = [];

// --- INICIALIZACIÓN ---
function checkLogin() { if(sessionStorage.getItem('isLogged') === 'true') showMenu(); }
function showMenu() { ocultarTodo(); document.getElementById('mainMenu').style.display = 'block'; }
function logout() { sessionStorage.clear(); location.reload(); }
function ocultarTodo() { ['loginSection', 'mainMenu', 'sectionClientes', 'sectionCreditos'].forEach(id => document.getElementById(id).style.display = 'none'); }

function showSection(section) {
    ocultarTodo();
    document.getElementById('section' + section.charAt(0).toUpperCase() + section.slice(1)).style.display = 'block';
    if(section === 'clientes') limpiarFormulario();
    else limpiarFormCredito();
}

// --- UTILIDADES ---
function fmtFecha(fechaStr) {
    if(!fechaStr) return "";
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const [y, m, d] = fechaStr.split('-');
    return `${d}/${meses[parseInt(m)-1]}/${y}`;
}

// --- CONTADORES AUTO-INCREMENTALES ---
function prepararNuevoCliente() {
    db.ref('contadores/ultimoCodigoCliente').once('value').then(s => {
        document.getElementById('codigo').value = s.val() ? parseInt(s.val()) + 1 : 1;
    });
}

function prepararAltaCredito() {
    db.ref('contadores/ultimoFolio').once('value').then(s => {
        document.getElementById('folio').value = s.val() ? parseInt(s.val()) + 1 : 1;
    });
    document.getElementById('fechaCaptura').value = new Date().toISOString().split('T')[0];
}

// --- GESTIÓN CLIENTES ---
document.getElementById('clientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const codigo = document.getElementById('codigo').value;
    const cliente = {
        codigo: codigo, nombre: document.getElementById('nombre').value,
        apellidoP: document.getElementById('apellidoPaterno').value, apellidoM: document.getElementById('apellidoMaterno').value,
        curp: document.getElementById('curp').value, ine: document.getElementById('ine').value,
        direccion: document.getElementById('direccion').value, telefono: document.getElementById('telefono').value,
        estatus: document.getElementById('estatus').value
    };
    db.ref('clientes/' + codigo).set(cliente).then(() => {
        db.ref('contadores/ultimoCodigoCliente').set(parseInt(codigo));
        alert("Guardado con éxito"); limpiarFormulario();
    });
});

function abrirBuscadorClientesEdicion() {
    db.ref('clientes').once('value', (s) => {
        clientesCache = [];
        const tbody = document.querySelector('#tablaBusquedaClientes tbody');
        tbody.innerHTML = "";
        s.forEach(child => {
            const c = child.val();
            clientesCache.push(c);
            tbody.innerHTML += `<tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td><td>${c.telefono}</td><td><button onclick="seleccionarEdicion('${c.codigo}')" class="btn-save">Elegir</button></td></tr>`;
        });
        document.getElementById('modalBusquedaClientes').style.display = 'block';
    });
}

function filtrarClientesPorNombre() {
    const q = document.getElementById('inputBusquedaNombre').value.toLowerCase();
    const tbody = document.querySelector('#tablaBusquedaClientes tbody');
    tbody.innerHTML = "";
    clientesCache.filter(c => (c.nombre + " " + c.apellidoP).toLowerCase().includes(q)).forEach(c => {
        tbody.innerHTML += `<tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td><td>${c.telefono}</td><td><button onclick="seleccionarEdicion('${c.codigo}')" class="btn-save">Elegir</button></td></tr>`;
    });
}

function seleccionarEdicion(cod) {
    const c = clientesCache.find(x => x.codigo == cod);
    document.getElementById('codigo').value = c.codigo;
    document.getElementById('nombre').value = c.nombre;
    document.getElementById('apellidoPaterno').value = c.apellidoP;
    document.getElementById('apellidoMaterno').value = c.apellidoM;
    document.getElementById('curp').value = c.curp;
    document.getElementById('ine').value = c.ine;
    document.getElementById('direccion').value = c.direccion;
    document.getElementById('telefono').value = c.telefono;
    document.getElementById('estatus').value = c.estatus;
    cerrarModalClientes();
}

// --- GESTIÓN CRÉDITOS ---
function calcularPagos() {
    const imp = parseFloat(document.getElementById('importe').value) || 0;
    const pag = parseInt(document.getElementById('numPagos').value) || 0;
    document.getElementById('importePago').value = pag > 0 ? (imp / pag).toFixed(2) : "0.00";
}

document.getElementById('creditForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = parseInt(document.getElementById('numPagos').value);
    const p = document.getElementById('importePago').value;
    let fec = new Date(document.getElementById('fechaVencimiento').value + "T00:00:00");
    const tbody = document.querySelector('#amortTable tbody');
    tbody.innerHTML = "";
    for(let i=1; i<=n; i++) {
        tbody.innerHTML += `<tr><td>${i}</td><td>${fec.toLocaleDateString('es-MX')}</td><td>$ ${p}</td></tr>`;
        if (fec.getDate() <= 15) fec = new Date(fec.getFullYear(), fec.getMonth() + 1, 0);
        else fec = new Date(fec.getFullYear(), fec.getMonth() + 1, 15);
    }
    document.getElementById('tablaAmortizacionContainer').style.display = 'block';
});

function guardarCredito() {
    const fol = document.getElementById('folio').value;
    const cre = {
        folio: parseInt(fol), clave: document.getElementById('creditoClave').value,
        nombre: document.getElementById('creditoNombre').value, fechaCaptura: document.getElementById('fechaCaptura').value,
        fechaVencimiento: document.getElementById('fechaVencimiento').value,
        importe: document.getElementById('importe').value, pagos: document.getElementById('numPagos').value
    };
    db.ref('creditos/' + fol).set(cre).then(() => {
        db.ref('contadores/ultimoFolio').set(parseInt(fol));
        alert("Crédito Guardado"); limpiarFormCredito();
    });
}

function abrirHistorialCreditos() {
    db.ref('creditos').once('value', (s) => {
        let hist = []; s.forEach(c => hist.push(c.val()));
        hist.sort((a,b) => b.fechaCaptura.localeCompare(a.fechaCaptura) || b.folio - a.folio);
        const tbody = document.querySelector('#historialTable tbody');
        tbody.innerHTML = hist.map(h => `<tr><td>${h.folio}</td><td>${h.nombre}</td><td>${fmtFecha(h.fechaCaptura)}</td><td>$ ${h.importe}</td><td>${h.pagos}</td><td><button onclick="consultarCredito(${h.folio})" class="btn-info">Ver</button></td></tr>`).join('');
        document.getElementById('modalHistorialCreditos').style.display = 'block';
    });
}

function consultarCredito(fol) {
    db.ref('creditos/' + fol).once('value', (s) => {
        const h = s.val();
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
    });
}

function abrirBuscadorCredito() {
    db.ref('clientes').once('value', (s) => {
        const tbody = document.querySelector('#modalTableCredito tbody');
        tbody.innerHTML = "";
        s.forEach(child => {
            const c = child.val();
            if(c.estatus === 'Activo') tbody.innerHTML += `<tr><td>${c.codigo}</td><td>${c.nombre} ${c.apellidoP}</td><td><button onclick="seleccionarClienteCredito('${c.codigo}','${c.nombre} ${c.apellidoP}')" class="btn-save">Elegir</button></td></tr>`;
        });
        document.getElementById('modalBusquedaCredito').style.display = 'block';
    });
}

// --- AUXILIARES MODALES Y LIMPIEZA ---
function seleccionarClienteCredito(c, n) { document.getElementById('creditoClave').value = c; document.getElementById('creditoNombre').value = n; cerrarModalCredito(); }
function cerrarModalClientes() { document.getElementById('modalBusquedaClientes').style.display = 'none'; }
function cerrarModalHistorial() { document.getElementById('modalHistorialCreditos').style.display = 'none'; }
function cerrarModalCredito() { document.getElementById('modalBusquedaCredito').style.display = 'none'; }
function limpiarFormulario() { document.getElementById('clientForm').reset(); prepararNuevoCliente(); }
function limpiarFormCredito() { document.getElementById('creditForm').reset(); prepararAltaCredito(); }

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if(document.getElementById('userInput').value === USER_OK && document.getElementById('passInput').value === PASS_OK) {
        sessionStorage.setItem('isLogged', 'true'); showMenu();
    }
});

function imprimirListadoClientesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    db.ref('clientes').once('value', s => {
        let rows = []; s.forEach(c => { const v = c.val(); rows.push([v.codigo, v.nombre + ' ' + v.apellidoP, v.curp, v.estatus]); });
        doc.text("LISTADO DE CLIENTES", 105, 20, { align: "center" });
        doc.autoTable({ startY: 30, head: [['Cód.', 'Nombre', 'CURP', 'Estatus']], body: rows });
        doc.save("Clientes.pdf");
    });
}

function imprimirPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("TABLA DE AMORTIZACIÓN", 105, 15, { align: "center" });
    doc.text(`Folio: ${document.getElementById('folio').value} - Cliente: ${document.getElementById('creditoNombre').value}`, 20, 25);
    doc.autoTable({ startY: 35, head: [['No.', 'Vencimiento', 'Importe']], body: Array.from(document.querySelectorAll("#amortTable tbody tr")).map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.innerText)) });
    doc.save(`Credito_${document.getElementById('folio').value}.pdf`);
}

checkLogin();
