// TODO tu código igual hasta onSnapshot...

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

            <div class="acciones">
                <button class="btn-icon maps">
                    <img src="maps.png">
                </button>

                <button class="btn-icon whatsapp">
                    <img src="whatsapp.png">
                </button>

                <button class="btn-icon edit">
                    <img src="reprogramar.png">
                </button>

                <button class="btn-icon delete">
                    <img src="borrar.png">
                </button>
            </div>
        `;

        // MAPS
        card.querySelector('.maps').addEventListener('click', () => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.direccion)}`);
        });

        // WHATSAPP
        card.querySelector('.whatsapp').addEventListener('click', () => {
            const tel = t.telefono.replace(/\D/g, '');
            window.open(`https://wa.me/${tel}`);
        });

        // ELIMINAR
        card.querySelector('.delete').addEventListener('click', async () => {
            if (confirm("¿Eliminar este turno?")) {
                await deleteDoc(doc(db, "turnos", id));
            }
        });

        // EDITAR
        card.querySelector('.edit').addEventListener('click', () => {
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
