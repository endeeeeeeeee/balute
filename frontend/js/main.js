// La URL de tu API desplegada en Render
// Reemplaza <el-nombre-de-tu-app> con tu URL de Render

// La URL base de tu backend en Render.
// Es crucial que esta URL sea la misma que la de tu servicio desplegado.
const API_URL = 'https://salud-ender.onrender.com/api/progress';



// Espera a que el DOM (el HTML) esté completamente cargado.
document.addEventListener('DOMContentLoaded', () => {
    // Obtener el formulario de seguimiento diario por su ID.
    const dailyRecordForm = document.getElementById('daily-record-form');

    // Obtener el contenedor donde se mostrarán los registros.
    const recordsDisplay = document.getElementById('records-display');

    // Cargar y mostrar los registros al inicio.
    fetchDailyRecords();

    // Añadir un "listener" al formulario para manejar el evento de envío.
    dailyRecordForm.addEventListener('submit', async (e) => {
        // Prevenir el comportamiento por defecto del formulario (recargar la página).
        e.preventDefault();

        // Obtener los datos del formulario.
        const formData = {
            feeling: parseInt(document.getElementById('feeling').value, 10),
            backPain: document.getElementById('backPain').checked,
            ateWell: document.getElementById('ateWell').checked,
            trained: document.getElementById('trained').checked,
            drankWater: document.getElementById('drankWater').checked,
            notes: document.getElementById('notes').value
        };

        // Enviar los datos al backend usando la función saveDailyRecord.
        try {
            await saveDailyRecord(formData);
            // Si la llamada fue exitosa, recargar los registros para mostrar el nuevo.
            fetchDailyRecords();
            // Limpiar el formulario para un nuevo registro.
            dailyRecordForm.reset();
            alert('¡Registro guardado con éxito!');
        } catch (error) {
            console.error('Error al guardar el registro:', error);
            alert('Hubo un error al guardar el registro. Por favor, inténtalo de nuevo.');
        }
    });

    /**
     * Guarda un nuevo registro diario en el backend.
     * @param {Object} data Los datos del formulario.
     */
    async function saveDailyRecord(data) {
        // Enviar una solicitud POST al backend con los datos del formulario.
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Verificar si la respuesta fue exitosa.
        if (!response.ok) {
            // Si la respuesta no fue exitosa, lanzar un error.
            const errorText = await response.text();
            throw new Error(`Error en el servidor: ${response.status} - ${errorText}`);
        }

        // Devolver la respuesta como JSON.
        return await response.json();
    }

    /**
     * Obtiene y muestra todos los registros diarios desde el backend.
     */
    async function fetchDailyRecords() {
        try {
            // Obtener una lista de todos los registros.
            const response = await fetch(API_BASE_URL);
            
            // Si la respuesta no fue exitosa, lanzar un error.
            if (!response.ok) {
                throw new Error(`Error al obtener los registros: ${response.status}`);
            }

            // Convertir la respuesta a JSON.
            const records = await response.json();
            
            // Limpiar el contenido actual del contenedor.
            recordsDisplay.innerHTML = '';
            
            // Si no hay registros, mostrar un mensaje.
            if (records.length === 0) {
                recordsDisplay.innerHTML = '<p>No hay registros diarios todavía. ¡Empieza a registrar!</p>';
                return;
            }

            // Iterar sobre cada registro y crear un elemento HTML para mostrarlo.
            records.forEach(record => {
                const recordItem = document.createElement('div');
                recordItem.className = 'record-item';

                // Formatear la fecha para que se vea bien.
                const date = new Date(record.fecha).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                // Crear el HTML para cada registro.
                recordItem.innerHTML = `
                    <h4>Registro del día: ${date}</h4>
                    <div class="daily-summary">
                        <p><strong>Sentimiento:</strong> ${record.feeling} / 5</p>
                        <p><strong>Dolor de espalda:</strong> ${record.backPain ? 'Sí' : 'No'}</p>
                        <p><strong>Comí bien:</strong> ${record.ateWell ? 'Sí' : 'No'}</p>
                        <p><strong>Entrené:</strong> ${record.trained ? 'Sí' : 'No'}</p>
                        <p><strong>Tomé agua:</strong> ${record.drankWater ? 'Sí' : 'No'}</p>
                        <p><strong>Notas:</strong> ${record.notes || 'No hay notas.'}</p>
                    </div>
                `;
                // Añadir el nuevo elemento al contenedor.
                recordsDisplay.appendChild(recordItem);
            });
        } catch (error) {
            console.error('Error al obtener los registros:', error);
            recordsDisplay.innerHTML = '<p style="color:red;">No se pudieron cargar los registros. Verifica que el backend esté funcionando.</p>';
        }
    }
});
const API_GASTOS = 'https://salud-ender.onrender.com/api/expenses';

let gastoEditandoId = null;

// Modifica el submit del formulario de gastos
const gastoForm = document.getElementById('gasto-form');
gastoForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = {
    fecha: document.getElementById('gasto-fecha').value,
    concepto: document.getElementById('gasto-concepto').value,
    cantidad: document.getElementById('gasto-cantidad').value,
    tipo: document.getElementById('gasto-tipo').value
  };
  if (gastoEditandoId) {
    // EDITAR
    await fetch(`${API_GASTOS}/${gastoEditandoId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    gastoEditandoId = null;
    this.querySelector('button[type=submit]').textContent = 'Guardar Gasto';
  } else {
    // NUEVO
    await fetch(API_GASTOS, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
  }
  cargarGastos();
  this.reset();
});

// --- GASTOS: Edición, eliminación y exportar a CSV ---

function crearBotonEliminar(id, callback) {
  const btn = document.createElement('button');
  btn.textContent = 'Eliminar';
  btn.onclick = async () => {
    if (confirm('¿Seguro que deseas eliminar este registro?')) {
      await callback(id);
    }
  };
  return btn;
}

function crearBotonEditar(gasto) {
  const btn = document.createElement('button');
  btn.textContent = 'Editar';
  btn.onclick = () => {
    document.getElementById('gasto-fecha').value = gasto.fecha;
    document.getElementById('gasto-concepto').value = gasto.concepto;
    document.getElementById('gasto-cantidad').value = gasto.cantidad;
    document.getElementById('gasto-tipo').value = gasto.tipo;
    gastoEditandoId = gasto.id;
    document.querySelector('#gasto-form button[type=submit]').textContent = 'Actualizar Gasto';
    window.scrollTo({ top: document.getElementById('gasto-form').offsetTop, behavior: 'smooth' });
  };
  return btn;
}

async function eliminarGasto(id) {
  await fetch(`${API_GASTOS}/${id}`, { method: 'DELETE' });
  cargarGastos();
}

// --- FILTRO POR FECHA Y SEMANA PARA GASTOS ---

// Agrega los inputs de filtro en el HTML dinámicamente si no existen
function agregarFiltrosGastos() {
  let filtros = document.getElementById('filtros-gastos');
  if (!filtros) {
    filtros = document.createElement('div');
    filtros.id = 'filtros-gastos';
    filtros.innerHTML = `
      <label>Filtrar por día: <input type="date" id="filtro-dia-gasto"></label>
      <label>Filtrar por semana: <input type="week" id="filtro-semana-gasto"></label>
      <button id="btn-limpiar-filtros-gasto">Limpiar Filtros</button>
    `;
    const lista = document.getElementById('lista-gastos');
    lista.parentNode.insertBefore(filtros, lista);
  }
}

let gastosGlobal = [];
let gastosFiltrados = [];

function filtrarGastos() {
  const dia = document.getElementById('filtro-dia-gasto').value;
  const semana = document.getElementById('filtro-semana-gasto').value;
  let filtrados = gastosGlobal;
  if (dia) {
    filtrados = filtrados.filter(g => g.fecha === dia);
  } else if (semana) {
    // semana formato: '2024-W16'
    const [año, w] = semana.split('-W');
    filtrados = filtrados.filter(g => {
      const fecha = new Date(g.fecha);
      const primerDiaAño = new Date(fecha.getFullYear(), 0, 1);
      const numSemana = Math.ceil((((fecha - primerDiaAño) / 86400000) + primerDiaAño.getDay() + 1) / 7);
      return fecha.getFullYear() == año && numSemana == w;
    });
  }
  gastosFiltrados = filtrados;
  mostrarGastosFiltrados();
}

function mostrarGastosFiltrados() {
  const lista = document.getElementById('lista-gastos');
  lista.innerHTML = '';
  (gastosFiltrados.length ? gastosFiltrados : gastosGlobal).forEach(g => {
    const li = document.createElement('li');
    li.textContent = `${g.fecha} | ${g.concepto} | ${g.cantidad} Bs | ${g.tipo} `;
    li.appendChild(crearBotonEditar(g));
    li.appendChild(crearBotonEliminar(g.id, eliminarGasto));
    lista.appendChild(li);
  });
}

function exportarGastosCSV(gastos) {
  let datos = gastosFiltrados.length ? gastosFiltrados : gastos;
  let csv = 'Fecha,Concepto,Cantidad,Tipo\n';
  datos.forEach(g => {
    csv += `${g.fecha},${g.concepto},${g.cantidad},${g.tipo}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gastos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Modifica cargarGastos para usar los filtros
async function cargarGastos() {
  const res = await fetch(API_GASTOS);
  gastosGlobal = await res.json();
  gastosFiltrados = [];
  agregarFiltrosGastos();
  mostrarGastosFiltrados();
  // Botón exportar CSV
  let btnExport = document.getElementById('btn-export-gastos');
  if (!btnExport) {
    btnExport = document.createElement('button');
    btnExport.id = 'btn-export-gastos';
    btnExport.textContent = 'Exportar a CSV';
    btnExport.onclick = () => exportarGastosCSV(gastosGlobal);
    document.getElementById('lista-gastos').parentNode.insertBefore(btnExport, document.getElementById('lista-gastos'));
  }
  // Gráfico
  if (typeof mostrarGraficoGastos === 'function') mostrarGraficoGastos(gastosFiltrados.length ? gastosFiltrados : gastosGlobal);
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (document.getElementById('filtro-dia-gasto')) {
      document.getElementById('filtro-dia-gasto').addEventListener('change', filtrarGastos);
    }
    if (document.getElementById('filtro-semana-gasto')) {
      document.getElementById('filtro-semana-gasto').addEventListener('change', filtrarGastos);
    }
    if (document.getElementById('btn-limpiar-filtros-gasto')) {
      document.getElementById('btn-limpiar-filtros-gasto').addEventListener('click', () => {
        document.getElementById('filtro-dia-gasto').value = '';
        document.getElementById('filtro-semana-gasto').value = '';
        gastosFiltrados = [];
        mostrarGastosFiltrados();
      });
    }
  }, 1000);
});

// --- Repite el patrón para Meals, Workouts, Sleeps, Schedules ---
// (Por brevedad, solo muestro el patrón para gastos, pero puedes copiarlo para los demás módulos)

const API_MEALS = 'https://salud-ender.onrender.com/api/meals';

document.getElementById('meal-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = {
    fecha: document.getElementById('meal-fecha').value,
    desayuno: document.getElementById('meal-desayuno').value,
    almuerzo: document.getElementById('meal-almuerzo').value,
    cena: document.getElementById('meal-cena').value,
    snacks: document.getElementById('meal-snacks').value
  };
  await fetch(API_MEALS, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  cargarMeals();
});

// --- GRÁFICOS PARA OTROS MÓDULOS ---

function mostrarGraficoMeals(meals) {
  if (!window.Chart) return;
  const ctx = document.getElementById('mealsChart').getContext('2d');
  if (window.mealsChartInstance) window.mealsChartInstance.destroy();
  const labels = meals.map(m => m.fecha);
  const desayuno = meals.map(m => m.desayuno.length);
  const almuerzo = meals.map(m => m.almuerzo.length);
  const cena = meals.map(m => m.cena.length);
  window.mealsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Desayuno (caracteres)', data: desayuno, backgroundColor: 'rgba(255, 206, 86, 0.5)' },
        { label: 'Almuerzo (caracteres)', data: almuerzo, backgroundColor: 'rgba(75, 192, 192, 0.5)' },
        { label: 'Cena (caracteres)', data: cena, backgroundColor: 'rgba(153, 102, 255, 0.5)' }
      ]
    }
  });
}

function mostrarGraficoWorkouts(workouts) {
  if (!window.Chart) return;
  const ctx = document.getElementById('workoutsChart').getContext('2d');
  if (window.workoutsChartInstance) window.workoutsChartInstance.destroy();
  const labels = workouts.map(w => w.fecha);
  const duraciones = workouts.map(w => parseFloat(w.duracion) || 0);
  window.workoutsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Duración (h)', data: duraciones, backgroundColor: 'rgba(255, 99, 132, 0.5)' }
      ]
    }
  });
}

function mostrarGraficoSleeps(sleeps) {
  if (!window.Chart) return;
  const ctx = document.getElementById('sleepsChart').getContext('2d');
  if (window.sleepsChartInstance) window.sleepsChartInstance.destroy();
  const labels = sleeps.map(s => s.fecha);
  const horas = sleeps.map(s => parseFloat(s.horasDormidas) || 0);
  window.sleepsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Horas dormidas', data: horas, backgroundColor: 'rgba(54, 162, 235, 0.5)', borderColor: 'rgba(54, 162, 235, 1)', fill: false }
      ]
    }
  });
}

// Llama a estas funciones después de cargar los datos de cada módulo
async function cargarMeals() {
  const res = await fetch(API_MEALS);
  const meals = await res.json();
  const lista = document.getElementById('lista-meals');
  lista.innerHTML = '';
  meals.forEach(m => {
    const li = document.createElement('li');
    li.textContent = `${m.fecha} | Desayuno: ${m.desayuno} | Almuerzo: ${m.almuerzo} | Cena: ${m.cena} | Snacks: ${m.snacks}`;
    lista.appendChild(li);
  });
  mostrarGraficoMeals(meals);
}

async function cargarWorkouts() {
  const res = await fetch(API_WORKOUTS);
  const workouts = await res.json();
  const lista = document.getElementById('lista-workouts');
  lista.innerHTML = '';
  workouts.forEach(w => {
    const li = document.createElement('li');
    li.textContent = `${w.fecha} | ${w.tipo} | ${w.duracion} | ${w.notas}`;
    lista.appendChild(li);
  });
  mostrarGraficoWorkouts(workouts);
}

async function cargarSleeps() {
  const res = await fetch(API_SLEEPS);
  const sleeps = await res.json();
  const lista = document.getElementById('lista-sleeps');
  lista.innerHTML = '';
  sleeps.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.fecha} | ${s.horasDormidas}h | Acostarse: ${s.horaAcostarse} | Levantarse: ${s.horaLevantarse}`;
    lista.appendChild(li);
  });
  mostrarGraficoSleeps(sleeps);
}
cargarSleeps();

const API_SCHEDULES = 'https://salud-ender.onrender.com/api/schedules';

document.getElementById('schedule-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = {
    dia: document.getElementById('schedule-dia').value,
    actividad: document.getElementById('schedule-actividad').value,
    horaInicio: document.getElementById('schedule-hora-inicio').value,
    horaFin: document.getElementById('schedule-hora-fin').value,
    tipo: document.getElementById('schedule-tipo').value
  };
  await fetch(API_SCHEDULES, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  cargarSchedules();
});

async function cargarSchedules() {
  const res = await fetch(API_SCHEDULES);
  const schedules = await res.json();
  const lista = document.getElementById('lista-schedules');
  lista.innerHTML = '';
  schedules.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.dia} | ${s.actividad} | ${s.horaInicio} - ${s.horaFin} | ${s.tipo}`;
    lista.appendChild(li);
  });
}
cargarSchedules();



function mostrarGraficoGastos(gastos) {
    const ctx = document.getElementById('gastosChart').getContext('2d');
    const labels = gastos.map(g => g.fecha);
    const data = gastos.map(g => parseFloat(g.cantidad));
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Gastos por día',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        }]
      }
    });
  }
  
  // Llama a mostrarGraficoGastos(gastos) después de cargar los gastos

