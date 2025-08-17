// La URL de tu API desplegada en Render
// Reemplaza <el-nombre-de-tu-app> con tu URL de Render
const API_URL = 'https://salud-ender.onrender.com/api/progress';

// Función para obtener y mostrar los registros de progreso
async function fetchProgress() {
    const progressList = document.getElementById('progressList');
    progressList.innerHTML = '<li class="loading-message">Cargando datos...</li>';
    
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();

        progressList.innerHTML = '';
        if (data.length === 0) {
            progressList.innerHTML = '<li class="loading-message">Aún no hay registros de progreso.</li>';
        } else {
            data.forEach(item => {
                const li = document.createElement('li');
                li.className = 'progress-item';
                const formattedDate = new Date(item.fecha).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                li.innerHTML = `
                    <div class="progress-item-details">
                        <p class="weight">Peso: ${item.peso} kg</p>
                        <p class="gasto">Gasto: ${item.gasto} kcal</p>
                    </div>
                    <span class="progress-item-date">${formattedDate}</span>
                `;
                progressList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error al obtener el progreso:', error);
        progressList.innerHTML = '<li class="error-message">Error al cargar los datos. Revisa la consola para más detalles.</li>';
    }
}

// Función para guardar un nuevo registro de progreso
async function saveProgress(event) {
    event.preventDefault();

    const pesoInput = document.getElementById('peso');
    const gastoInput = document.getElementById('gasto');

    const payload = {
        peso: parseFloat(pesoInput.value),
        gasto: parseFloat(gastoInput.value)
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        // Muestra un mensaje de éxito sin usar 'alert'
        const formMessage = document.createElement('p');
        formMessage.textContent = 'Progreso guardado con éxito!';
        formMessage.className = 'text-green-500 text-center mt-4';
        document.getElementById('progressForm').appendChild(formMessage);

        pesoInput.value = '';
        gastoInput.value = '';
        fetchProgress(); // Vuelve a cargar los datos para ver el nuevo registro
    } catch (error) {
        console.error('Error al guardar el progreso:', error);
        const formMessage = document.createElement('p');
        formMessage.textContent = 'Error al guardar el progreso. Revisa la consola para más detalles.';
        formMessage.className = 'text-red-500 text-center mt-4';
        document.getElementById('progressForm').appendChild(formMessage);
    }
}

// Asocia la función de guardar progreso al formulario
document.getElementById('progressForm').addEventListener('submit', saveProgress);

// Llama a la función para obtener los datos al cargar la página
document.addEventListener('DOMContentLoaded', fetchProgress);