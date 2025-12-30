let editIndex = null;
const USER_OK = "admin";
const PASS_OK = "1234";

// --- CONTROL DE ACCESO ---
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const u = document.getElementById('userInput').value;
    const p = document.getElementById('passInput').value;
    if(u === USER_OK && p === PASS_OK) {
        sessionStorage.setItem('logged', 'true');
        checkLogin();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

function checkLogin() {
    if(sessionStorage.getItem('logged') === 'true') {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        cargarClientes();
    }
}

function logout() {
    sessionStorage.clear();
    location.reload();
}

// --- GESTIÓN DE CLIENTES ---
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

    if(editIndex === null) {
        clientes.push(cliente);
    } else {
        clientes[editIndex] = cliente;
        editIndex = null;
        document.querySelector('.btn-save').innerHTML = "💾 Guardar";
    }

    localStorage.setItem('misClientes', JSON.stringify(clientes));
    this.reset();
    cargarClientes();
});

function cargarClientes() {
    const clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    const tbody = document.querySelector('#clientTable tbody');
    tbody.innerHTML = "";

    clientes.forEach((c, index) => {
        const fila = `<tr>
            <td>${c.codigo}</td>
            <td>${c.nombre} ${c.apellidoP} ${c.apellidoM}</td>
            <td>${c.curp}</td>
            <td>${c.ine}</td>
            <td>${c.telefono}</td>
            <td class="${c.estatus.toLowerCase()}">${c.estatus}</td>
            <td>
                <button class="btn-edit" onclick="prepararEdicion(${index})">✏️</button>
                <button class="btn-del" onclick="eliminarCliente(${index})">🗑️</button>
            </td>
        </tr>`;
        tbody.innerHTML += fila;
    });
}

function prepararEdicion(index) {
    const clientes = JSON.parse(localStorage.getItem('misClientes'));
    const c = clientes[index];
    document.getElementById('codigo').value = c.codigo;
    document.getElementById('nombre').value = c.nombre;
    document.getElementById('apellidoPaterno').value = c.apellidoP;
    document.getElementById('apellidoMaterno').value = c.apellidoM;
    document.getElementById('curp').value = c.curp;
    document.getElementById('ine').value = c.ine;
    document.getElementById('direccion').value = c.direccion;
    document.getElementById('telefono').value = c.telefono;
    document.getElementById('estatus').value = c.estatus;
    
    editIndex = index;
    document.querySelector('.btn-save').innerHTML = "🔄 Actualizar";
    window.scrollTo(0,0);
}

function eliminarCliente(index) {
    if(confirm("¿Eliminar cliente?")) {
        let clientes = JSON.parse(localStorage.getItem('misClientes'));
        clientes.splice(index, 1);
        localStorage.setItem('misClientes', JSON.stringify(clientes));
        cargarClientes();
    }
}

function limpiarFormulario() {
    document.getElementById('clientForm').reset();
    editIndex = null;
    document.querySelector('.btn-save').innerHTML = "💾 Guardar";
}

function eliminarTodo() {
    if(confirm("¡CUIDADO! Se borrará todo el catálogo.")) {
        localStorage.removeItem('misClientes');
        cargarClientes();
    }
}

function buscarCliente() {
    const filtro = document.getElementById('searchInput').value.toLowerCase();
    const filas = document.querySelectorAll('#clientTable tbody tr');
    filas.forEach(f => {
        f.style.display = f.innerText.toLowerCase().includes(filtro) ? "" : "none";
    });
}

function exportarCSV() {
    const clientes = JSON.parse(localStorage.getItem('misClientes')) || [];
    let csv = "\ufeffCódigo,Nombre Completo,CURP,INE,Teléfono,Estatus\n";
    clientes.forEach(c => {
        csv += `${c.codigo},${c.nombre} ${c.apellidoP},${c.curp},${c.ine},${c.telefono},${c.estatus}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes.csv';
    a.click();
}

// Iniciar
checkLogin();