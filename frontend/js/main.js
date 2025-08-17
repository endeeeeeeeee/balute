document.addEventListener('DOMContentLoaded', () => {
    const fechaSpan = document.getElementById('fecha-actual');
    fechaSpan.textContent = new Date().toLocaleDateString('es-ES');
});

function guardarProgreso() {
    const peso = document.getElementById('peso').value;
    const gasto = document.getElementById('gasto').value;

    const data = {
        peso: peso,
        gasto: gasto
    };

    fetch('/api/progress', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert('Progreso guardado con éxito!');
        console.log('Success:', data);
        // Actualizar estadísticas en el frontend si es necesario
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Hubo un error al guardar el progreso.');
    });
}