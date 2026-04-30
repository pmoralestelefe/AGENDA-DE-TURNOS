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
const listadoAgrupado = document.getElementById('listadoAgrupado');

let editandoId = null;
const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// --- LÓGICA DE FORMULARIO ---

inputFecha.addEventListener('change', (e) => {
    if(!e.target.value) { inputDiaVisual.value = ''; return; }
    const fechaObj = new Date(e.target.value + 'T00:00:00'); 
    inputDiaVisual.value = diasSemana[fechaObj.getDay()];
});

inputDireccion.addEventListener('input', (e) => {
    btnMaps.style.display = e.target.value.trim().length > 3 ? 'flex' : 'none';
});

btnMaps.addEventListener('click', () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputDireccion.value)}`, '_blank');
});

inputTelefono.addEventListener('input', (e) => {
    btnWhatsapp.style.display = e.target.value.trim().length >= 8 ? 'flex' : 'none';
});

btnWhatsapp.addEventListener('click', () => {
    const tel = inputTelefono.value.replace(/\D/g, '');
    window.open(`https://wa.me/${tel}`, '_blank');
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeError.textContent = '';

    const fechaSeleccionada = inputFecha.value;
    const horaSeleccionada = inputHora.value;
    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');
    const diaSemanaNum = fechaObj.getDay();

    if (diaSemanaNum === 0) {
        mensajeError.textContent = "No se agendan turnos los domingos.";
        return;
    }

    const [horas, minutos] = horaSeleccionada.split(':').map(Number);
    const tiempoEnMinutos = (horas * 60) + minutos;

    if (diaSemanaNum >= 1 && diaSemanaNum <= 5) {
        if (tiempoEnMinutos < 540 || tiempoEnMinutos > 840) {
            mensajeError.textContent = "Horario Lunes a Viernes: 09:00 a 14:00.";
            return;
        }
    }

    if (diaSemanaNum === 6) {
        if (tiempoEnMinutos < 840 || tiempoEnMinutos > 1080) {
            mensajeError.textContent = "Horario Sábados: 14:00 a 18:00.";
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
            editandoId = null;
        } else {
            await addDoc(collection(db, "turnos"), turnoData);
        }
        form.reset();
        inputDiaVisual.value = '';
        btnMaps.style.display = 'none';
        btnWhatsapp.style.display = 'none';
    } catch (error) {
        console.error(error);
        mensajeError.textContent = "Error al conectar con Firebase.";
    }
});

// --- LÓGICA DE LISTADO ORDENADO ---

const q = query(collection(db, "turnos"), orderBy("fecha", "asc"), orderBy("hora", "asc"));

onSnapshot(q, (snapshot) => {
    listadoAgrupado.innerHTML = '';
    
    // Agrupamos los turnos por el campo "diaTexto"
    const turnosPorDia = {};
    
    snapshot.forEach((docSnap) => {
        const t = docSnap.data();
        const id = docSnap.id;
        if (!turnosPorDia[t.diaTexto]) {
            turnosPorDia[t.diaTexto] = [];
        }
        turnosPorDia[t.diaTexto].push({ ...t, id });
    });

    // Recorremos los días en orden (Lunes a Sábado)
    const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    ordenDias.forEach(dia => {
        if (turnosPorDia[dia]) {
            const seccion = document.createElement('div');
            seccion.className = 'dia-contenedor';
            
            seccion.innerHTML = `<div class="dia-titulo">${dia}</div>`;
            
            turnosPorDia[dia].forEach(turno => {
                const card = document.createElement('div');
                card.className = 'turno-card';
                card.innerHTML = `
                    <h4>${turno.hora} hs - ${turno.cliente}</h4>
                    <p><strong>Dirección:</strong> ${turno.direccion}</p>
                    <p><strong>Servicio:</strong> ${turno.descripcion}</p>
                    <p><strong>Precio:</strong> $${turno.precio}</p>
                    <p style="font-size:11px">Fecha: ${turno.fecha}</p>

                    <div class="acciones-grid">
                        <button class="btn-accion btn-go-maps" title="Google Maps">
                            <img src="maps.png">
                        </button>
                        <button class="btn-accion btn-go-whatsapp" title="WhatsApp">
                            <img src="whastapp.png">
                        </button>
                        <button class="btn-accion btn-go-edit" title="Reprogramar">
                            <img src="reprogramar.png">
                        </button>
                        <button class="btn-accion btn-go-delete" title="Borrar">
                            <img src="borrar.png">
                        </button>
                    </div>
                `;

                // Eventos de botones
                card.querySelector('.btn-go-maps').onclick = () => {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(turno.direccion)}`);
                };

                card.querySelector('.btn-go-whatsapp').onclick = () => {
                    const tel = turno.telefono.replace(/\D/g, '');
                    window.open(`https://wa.me/${tel}`);
                };

                card.querySelector('.btn-go-delete').onclick = async () => {
                    if (confirm("¿Eliminar turno?")) await deleteDoc(doc(db, "turnos", turno.id));
                };

                card.querySelector('.btn-go-edit').onclick = () => {
                    document.getElementById('cliente').value = turno.cliente;
                    inputTelefono.value = turno.telefono;
                    inputDireccion.value = turno.direccion;
                    inputFecha.value = turno.fecha;
                    inputHora.value = turno.hora;
                    inputDiaVisual.value = turno.diaTexto;
                    document.getElementById('descripcion').value = turno.descripcion;
                    document.getElementById('precio').value = turno.precio;
                    editandoId = turno.id;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                };

                seccion.appendChild(card);
            });
            listadoAgrupado.appendChild(seccion);
        }
    });
});
