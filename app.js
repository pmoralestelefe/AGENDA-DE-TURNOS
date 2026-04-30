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

// Configuración de Firebase[cite: 1]
const firebaseConfig = {
    apiKey: "AIzaSyCqQbdKRB7JK_aDz0cJlaa4tvYiM21c5Eo",
    authDomain: "visitas-programadas.firebaseapp.com",
    projectId: "visitas-programadas",
    storageBucket: "visitas-programadas.firebasestorage.app",
    messagingSenderId: "861629507139",
    appId: "1:861629507139:web:9b73314bc72180b22f56f6"
};

const app = initializeApp(firebaseConfig);[cite: 1]
const db = getFirestore(app);[cite: 1]

// Referencias DOM[cite: 1]
const inputFecha = document.getElementById('fecha');
const inputDiaVisual = document.getElementById('diaVisual');
const inputHora = document.getElementById('hora');
const inputDireccion = document.getElementById('direccion');
const inputTelefono = document.getElementById('telefono');
const btnMaps = document.getElementById('btnMaps');
const btnWhatsapp = document.getElementById('btnWhatsapp');
const form = document.getElementById('turnoForm');
const mensajeError = document.getElementById('mensajeError');

// Referencias para las pestañas
const tabBtns = document.querySelectorAll('.tab-btn');
const hojasDias = {
    'Lunes': document.getElementById('hoja-Lunes'),
    'Martes': document.getElementById('hoja-Martes'),
    'Miércoles': document.getElementById('hoja-Miércoles'),
    'Jueves': document.getElementById('hoja-Jueves'),
    'Viernes': document.getElementById('hoja-Viernes'),
    'Sábado': document.getElementById('hoja-Sábado')
};

let editandoId = null;[cite: 1]

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];[cite: 1]

// Lógica de Pestañas (Tabs)
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Quitar la clase active de todos los botones y hojas
        tabBtns.forEach(b => b.classList.remove('active'));
        Object.values(hojasDias).forEach(h => {
            if(h) h.classList.remove('active');
        });
        
        // Activar el botón clickeado y su hoja correspondiente
        btn.classList.add('active');
        const day = btn.getAttribute('data-day');
        if(hojasDias[day]) hojasDias[day].classList.add('active');
    });
});

// Auto día[cite: 1]
inputFecha.addEventListener('change', (e) => {
    if(!e.target.value) { inputDiaVisual.value = ''; return; }
    const fechaObj = new Date(e.target.value + 'T00:00:00'); 
    inputDiaVisual.value = diasSemana[fechaObj.getDay()];
});

// Botón Maps formulario[cite: 1]
inputDireccion.addEventListener('input', (e) => {
    btnMaps.style.display = e.target.value.trim().length > 3 ? 'block' : 'none';
});

btnMaps.addEventListener('click', () => {[cite: 1]
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inputDireccion.value)}`, '_blank');[cite: 1]
});[cite: 1]

// Botón WhatsApp formulario[cite: 1]
inputTelefono.addEventListener('input', (e) => {
    btnWhatsapp.style.display = e.target.value.trim().length >= 8 ? 'block' : 'none';
});

btnWhatsapp.addEventListener('click', () => {[cite: 1]
    const tel = inputTelefono.value.replace(/\D/g, '');[cite: 1]
    window.open(`https://wa.me/${tel}`, '_blank');[cite: 1]
});[cite: 1]

// GUARDAR / EDITAR[cite: 1]
form.addEventListener('submit', async (e) => {
    e.preventDefault();[cite: 1]
    mensajeError.textContent = '';[cite: 1]

    const fechaSeleccionada = inputFecha.value;[cite: 1]
    const horaSeleccionada = inputHora.value;[cite: 1]
    const fechaObj = new Date(fechaSeleccionada + 'T00:00:00');[cite: 1]
    const diaSemanaNum = fechaObj.getDay();[cite: 1]

    // VALIDACIONES ORIGINALES[cite: 1]
    if (diaSemanaNum === 0) {
        mensajeError.textContent = "No se agendan turnos los domingos.";
        return;
    }

    const [horas, minutos] = horaSeleccionada.split(':').map(Number);[cite: 1]
    const tiempoEnMinutos = (horas * 60) + minutos;[cite: 1]

    if (diaSemanaNum >= 1 && diaSemanaNum <= 5) {[cite: 1]
        if (tiempoEnMinutos < 540 || tiempoEnMinutos > 840) {[cite: 1]
            mensajeError.textContent = "Horario inválido para Lunes a Viernes (09:00 a 14:00).";[cite: 1]
            return;[cite: 1]
        }[cite: 1]
    }[cite: 1]

    if (diaSemanaNum === 6) {[cite: 1]
        if (tiempoEnMinutos < 840 || tiempoEnMinutos > 1080) {[cite: 1]
            mensajeError.textContent = "Horario inválido para Sábados (14:00 a 18:00).";[cite: 1]
            return;[cite: 1]
        }[cite: 1]
    }[cite: 1]

    const turnoData = {[cite: 1]
        cliente: document.getElementById('cliente').value,[cite: 1]
        telefono: inputTelefono.value,[cite: 1]
        direccion: inputDireccion.value,[cite: 1]
        fecha: fechaSeleccionada,[cite: 1]
        hora: horaSeleccionada,[cite: 1]
        diaTexto: inputDiaVisual.value,[cite: 1]
        descripcion: document.getElementById('descripcion').value,[cite: 1]
        precio: document.getElementById('precio').value || 0,[cite: 1]
        timestamp: new Date()[cite: 1]
    };[cite: 1]

    try {[cite: 1]
        if (editandoId) {[cite: 1]
            await updateDoc(doc(db, "turnos", editandoId), turnoData);[cite: 1]
            alert("Turno actualizado correctamente");[cite: 1]
            editandoId = null;[cite: 1]
        } else {[cite: 1]
            await addDoc(collection(db, "turnos"), turnoData);[cite: 1]
            alert("Turno guardado correctamente");[cite: 1]
        }[cite: 1]

        form.reset();[cite: 1]
        inputDiaVisual.value = '';[cite: 1]
        btnMaps.style.display = 'none';[cite: 1]
        btnWhatsapp.style.display = 'none';[cite: 1]

        // Opcional: Cambiar automáticamente a la pestaña del día que acabamos de guardar
        const tabGuardada = document.querySelector(`.tab-btn[data-day="${turnoData.diaTexto}"]`);
        if(tabGuardada) tabGuardada.click();

    } catch (error) {[cite: 1]
        console.error(error);[cite: 1]
        mensajeError.textContent = "Error al guardar.";[cite: 1]
    }[cite: 1]
});

// LISTADO Y SEPARACIÓN POR DÍAS
const q = query(collection(db, "turnos"), orderBy("timestamp", "desc"));[cite: 1]

onSnapshot(q, (snapshot) => {
    // 1. Limpiar todos los contenedores de los días
    Object.values(hojasDias).forEach(hoja => {
        if(hoja) hoja.innerHTML = '';
    });

    // 2. Extraer turnos y ordenarlos por Fecha y Hora para visualizarlos mejor
    let turnos = [];
    snapshot.forEach((docSnap) => {
        turnos.push({ id: docSnap.id, ...docSnap.data() });
    });

    turnos.sort((a, b) => {
        const dateA = new Date(`${a.fecha}T${a.hora}`);
        const dateB = new Date(`${b.fecha}T${b.hora}`);
        return dateA - dateB;
    });

    // 3. Renderizar cada turno en la hoja de su día correspondiente
    turnos.forEach((t) => {
        const id = t.id;
        const dia = t.diaTexto; // 'Lunes', 'Martes', etc.

        // Si por alguna razón el día no está en nuestras hojas (ej. Domingo erróneo), lo ignoramos
        if (!hojasDias[dia]) return; 

        const card = document.createElement('div');
        card.className = 'turno-card';

        card.innerHTML = `
            <h4>${t.fecha} a las ${t.hora}hs</h4>
            <p><strong>Cliente:</strong> ${t.cliente}</p>
            <p><strong>Tel:</strong> ${t.telefono}</p>
            <p><strong>Dirección:</strong> ${t.direccion}</p>
            <p><strong>Servicio:</strong> ${t.descripcion}</p>
            <p><strong>Precio:</strong> $${t.precio}</p>

            <div class="turno-acciones">
                <button class="btn-maps">Ver en Maps</button>
                <button class="btn-whatsapp">WhatsApp</button>
                <button class="btn-edit">Editar</button>
                <button class="btn-delete">Eliminar</button>
            </div>
        `;

        // MAPS[cite: 1]
        card.querySelector('.btn-maps').addEventListener('click', () => {[cite: 1]
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.direccion)}`);[cite: 1]
        });[cite: 1]

        // WHATSAPP[cite: 1]
        card.querySelector('.btn-whatsapp').addEventListener('click', () => {[cite: 1]
            const tel = t.telefono.replace(/\D/g, '');[cite: 1]
            window.open(`https://wa.me/${tel}`);[cite: 1]
        });[cite: 1]

        // ELIMINAR[cite: 1]
        card.querySelector('.btn-delete').addEventListener('click', async () => {[cite: 1]
            if (confirm("¿Eliminar este turno?")) {[cite: 1]
                await deleteDoc(doc(db, "turnos", id));[cite: 1]
            }[cite: 1]
        });[cite: 1]

        // EDITAR / REPROGRAMAR[cite: 1]
        card.querySelector('.btn-edit').addEventListener('click', () => {[cite: 1]
            document.getElementById('cliente').value = t.cliente;[cite: 1]
            inputTelefono.value = t.telefono;[cite: 1]
            inputDireccion.value = t.direccion;[cite: 1]
            inputFecha.value = t.fecha;[cite: 1]
            inputHora.value = t.hora;[cite: 1]
            inputDiaVisual.value = t.diaTexto;[cite: 1]
            document.getElementById('descripcion').value = t.descripcion;[cite: 1]
            document.getElementById('precio').value = t.precio;[cite: 1]

            editandoId = id;[cite: 1]

            window.scrollTo({ top: 0, behavior: 'smooth' });[cite: 1]
        });[cite: 1]

        hojasDias[dia].appendChild(card);
    });

    // 4. Mostrar un mensaje si un día no tiene turnos
    Object.keys(hojasDias).forEach(dia => {
        const hoja = hojasDias[dia];
        if (hoja && hoja.children.length === 0) {
            hoja.innerHTML = `<p class="mensaje-vacio">No hay turnos agendados para este ${dia.toLowerCase()}.</p>`;
        }
    });
});
