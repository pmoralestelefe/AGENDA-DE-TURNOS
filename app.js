import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuración de Firebase (Intacta)
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

// TU NUEVA URL DE GOOGLE APPS SCRIPT
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyDNJU9Urdnm4kNCO5PhqXe_ED-90vZNvtGoYcKikMbXfwrrgtFI7JmZPpMxZ-o3G0b8A/exec";

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

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// 1. Auto-completar día de la semana
inputFecha.addEventListener('change', (e) => {
    if(!e.target.value) { inputDiaVisual.value = ''; return; }
    const fechaObj = new Date(e.target.value + 'T00:00:00'); 
    inputDiaVisual.value = diasSemana[fechaObj.getDay()];
});

// 2. Botones dinámicos (Maps y WhatsApp)
inputDireccion.addEventListener('input', (e) => {
    btnMaps.style.display = e.target.value.trim().length > 3 ? 'block' : 'none';
});

btnMaps.addEventListener('click', () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputDireccion.value)}`, '_blank');
});

inputTelefono.addEventListener('input', (e) => {
    btnWhatsapp.style.display = e.target.value.trim().length >= 8 ? 'block' : 'none';
});

btnWhatsapp.addEventListener('click', () => {
    const tel = inputTelefono.value.replace(/\D/g, '');
    window.open(`https://wa.me/${tel}`, '_blank');
});

// 3. Lógica de Guardado (Firebase + Calendar)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeError.textContent = '';

    const fechaSeleccionada = inputFecha.value;
    const horaSeleccionada = inputHora.value;
    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');
    const diaSemanaNum = fechaObj.getDay();

    // --- LOGICA ORIGINAL DE VALIDACION (Sin Cambios) ---
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
    // --- FIN VALIDACION ---

    try {
        const nuevoTurno = {
            cliente: document.getElementById('cliente').value,
            telefono: document.getElementById('telefono').value,
            direccion: inputDireccion.value,
            fecha: fechaSeleccionada,
            hora: horaSeleccionada,
            diaTexto: inputDiaVisual.value,
            descripcion: document.getElementById('descripcion').value,
            precio: document.getElementById('precio').value || 0,
            timestamp: new Date()
        };

        // Guardar en Firestore
        await addDoc(collection(db, "turnos"), nuevoTurno);
        
        // Enviar a Google Calendar vía Web App
        console.log("Enviando a Google Calendar...");
        fetch(URL_APPS_SCRIPT, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoTurno)
        });

        alert("Turno guardado correctamente y enviado al Calendario.");
        form.reset();
        btnMaps.style.display = 'none';
        btnWhatsapp.style.display = 'none';
        inputDiaVisual.value = '';

    } catch (error) {
        console.error("Error:", error);
        mensajeError.textContent = "Error al conectar con la base de datos.";
    }
});

// 4. Listado de Turnos en Tiempo Real
const q = query(collection(db, "turnos"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    listaTurnos.innerHTML = '';
    snapshot.forEach((doc) => {
        const t = doc.data();
        const card = document.createElement('div');
        card.className = 'turno-card';
        card.innerHTML = `
            <h4>${t.diaTexto} ${t.fecha} - ${t.hora}hs</h4>
            <p><strong>Cliente:</strong> ${t.cliente} (Tel: ${t.telefono})</p>
            <p><strong>Servicio:</strong> ${t.descripcion}</p>
            <p><strong>Dirección:</strong> ${t.direccion}</p>
            <p><strong>Precio:</strong> $${t.precio}</p>
        `;
        listaTurnos.appendChild(card);
    });
});
