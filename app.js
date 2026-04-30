import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCqQbdKRB7JK_aDz0cJlaa4tvYiM21c5Eo",
    authDomain: "visitas-programadas.firebaseapp.com",
    projectId: "visitas-programadas",
    storageBucket: "visitas-programadas.firebasestorage.app",
    messagingSenderId: "861629507139",
    appId: "1:861629507139:web:9b73314bc72180b22f56f6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias DOM
const inputFecha = document.getElementById('fecha');
const inputDiaVisual = document.getElementById('diaVisual');
const inputHora = document.getElementById('hora');
const inputDireccion = document.getElementById('direccion');
const inputTelefono = document.getElementById('telefono');
const btnMaps = document.getElementById('btnMaps');
const btnWhatsapp = document.getElementById('btnWhatsapp');
const form = document.getElementById('turnoForm');
const mensajeError = document.getElementById('mensajeError');
const listaTurnos = document.getElementById('listaTurnos');

let editandoId = null;

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Auto día
inputFecha.addEventListener('change', (e) => {
    if(!e.target.value) { inputDiaVisual.value = ''; return; }
    const fechaObj = new Date(e.target.value + 'T00:00:00'); 
    inputDiaVisual.value = diasSemana[fechaObj.getDay()];
});

// Botón Maps formulario
inputDireccion.addEventListener('input', (e) => {
    btnMaps.style.display = e.target.value.trim().length > 3 ? 'block' : 'none';
});

btnMaps.addEventListener('click', () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputDireccion.value)}`, '_blank');
});

// Botón WhatsApp formulario
inputTelefono.addEventListener('input', (e) => {
    btnWhatsapp.style.display = e.target.value.trim().length >= 8 ? 'block' : 'none';
});

btnWhatsapp.addEventListener('click', () => {
    const tel = inputTelefono.value.replace(/\D/g, '');
    window.open(`https://wa.me/${tel}`, '_blank');
});

// GUARDAR / EDITAR
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeError.textContent = '';

    const fechaSeleccionada = inputFecha.value;
    const horaSeleccionada = inputHora.value;
    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');
    const diaSemanaNum = fechaObj.getDay();

    // VALIDACIONES ORIGINALES
    if (diaSemanaNum === 0) {
        mensajeError.textContent = "No se agendan turnos los domingos.";
        return;
    }

    const [horas, minutos] = horaSeleccionada.split(':').map(Number);
    const tiempoEnMinutos = (horas * 60) + minutos;

    if (diaSemanaNum >= 1 && diaSemanaNum <= 5) {
        if (tiempoEnMinutos < 540 || tiempoEnMinutos > 840) {
            mensajeError.textContent = "Horario inválido para Lunes a Viernes (09:00 a 14:00).";
            return;
        }
    }

    if (diaSemanaNum === 6) {
        if (tiempoEnMinutos < 840 || tiempoEnMinutos > 1080) {
            mensajeError.textContent = "Horario inválido para Sábados (14:00 a 18:00).";
            return;
        }
    }

    const turnoData = {
        cliente: document.getElementById('cliente').value,
        telefono: inputTelefono.value,
        direccion: inputDireccion.value,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        diaTexto: inputDiaVisual.value,
        descripcion: document.getElementById('descripcion').value,
        precio: document.getElementById('precio').value || 0,
        timestamp: new Date()
    };

    try {
        if (editandoId) {
            await updateDoc(doc(db, "turnos", editandoId), turnoData);
            alert("Turno actualizado correctamente");
            editandoId = null;
        } else {
            await addDoc(collection(db, "turnos"), turnoData);
            alert("Turno guardado correctamente");
        }

        form.reset();
        inputDiaVisual.value = '';
        btnMaps.style.display = 'none';
        btnWhatsapp.style.display = 'none';

    } catch (error) {
        console.error(error);
        mensajeError.textContent = "Error al guardar.";
    }
});

// LISTADO
const q = query(collection(db, "turnos"), orderBy("timestamp", "desc"));

onSnapshot(q, (snapshot) => {
    listaTurnos.innerHTML = '';

    snapshot.forEach((docSnap) => {
        const t = docSnap.data();
        const id = docSnap.id;

        const card = document.createElement('div');
        card.className = 'turno-card';

        card.innerHTML = `
            <h4>${t.diaTexto} ${t.fecha} - ${t.hora}hs</h4>
            <p><strong>Cliente:</strong> ${t.cliente}</p>
            <p><strong>Tel:</strong> ${t.telefono}</p>
            <p><strong>Dirección:</strong> ${t.direccion}</p>
            <p><strong>Servicio:</strong> ${t.descripcion}</p>
            <p><strong>Precio:</strong> $${t.precio}</p>

            <button class="btn-maps">Ver en Maps</button>
            <button class="btn-whatsapp">WhatsApp</button>
            <button class="btn-edit">Editar</button>
            <button class="btn-delete" style="background:#ff5252;color:white;">Eliminar</button>
        `;

        // MAPS
        card.querySelector('.btn-maps').addEventListener('click', () => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.direccion)}`);
        });

        // WHATSAPP
        card.querySelector('.btn-whatsapp').addEventListener('click', () => {
            const tel = t.telefono.replace(/\D/g, '');
            window.open(`https://wa.me/${tel}`);
        });

        // ELIMINAR
        card.querySelector('.btn-delete').addEventListener('click', async () => {
            if (confirm("¿Eliminar este turno?")) {
                await deleteDoc(doc(db, "turnos", id));
            }
        });

        // EDITAR / REPROGRAMAR
        card.querySelector('.btn-edit').addEventListener('click', () => {
            document.getElementById('cliente').value = t.cliente;
            inputTelefono.value = t.telefono;
            inputDireccion.value = t.direccion;
            inputFecha.value = t.fecha;
            inputHora.value = t.hora;
            inputDiaVisual.value = t.diaTexto;
            document.getElementById('descripcion').value = t.descripcion;
            document.getElementById('precio').value = t.precio;

            editandoId = id;

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        listaTurnos.appendChild(card);
    });
});
