document.addEventListener('DOMContentLoaded', function() {
    // Проверка поддержки localStorage
    if (!window.localStorage) {
        alert('Ваш браузер не поддерживает localStorage. Данные не будут сохранены.');
    }

    // DOM элементы
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const measurementForm = document.getElementById('measurement-form');
    const workoutForm = document.getElementById('workout-form');
    const addExerciseBtn = document.getElementById('add-exercise');
    const exercisesContainer = document.getElementById('exercises-container');
    const measurementsList = document.getElementById('measurements-list');
    const workoutsList = document.getElementById('workouts-list');
    const progressFill = document.getElementById('progress-fill');
    const motivationText = document.getElementById('motivation-text');
    const dailyMotivation = document.getElementById('daily-motivation');
    const lastWeightElement = document.getElementById('last-weight');
    const weightChangeElement = document.getElementById('weight-change');
    const totalWorkoutsElement = document.getElementById('total-workouts');
    const progressChartCanvas = document.getElementById('progress-chart');

    // Данные приложения
    let measurements = JSON.parse(localStorage.getItem('fitnessMeasurements')) || [];
    let workouts = JSON.parse(localStorage.getItem('fitnessWorkouts')) || [];
    let progressChart = null;

    // Мотивирующие сообщения
    const motivationMessages = [
        "Ты молодец! Продолжай в том же духе!",
        "Каждый шаг приближает тебя к цели!",
        "Ты становишься лучше с каждым днём!",
        "Сила — в постоянстве!",
        "Сегодня ты на шаг ближе к своей мечте!",
        "Твой прогресс впечатляет!",
        "Не останавливайся на достигнутом!",
        "Ты вдохновляешь окружающих!",
        "С каждым днём ты сильнее!",
        "Верь в себя — у тебя всё получится!"
    ];

    const dailyMotivations = [
        "Сегодня - лучший день для нового рекорда!",
        "Малые шаги приводят к большим результатам!",
        "Твое тело способно на большее, чем ты думаешь!",
        "Не сдавайся - ты ближе к цели, чем вчера!",
        "Сила не в мышцах, а в настойчивости!",
        "Каждая тренировка делает тебя сильнее!",
        "Ты - автор своей истории успеха!",
        "Боль начинается там, где заканчивается зона комфорта!",
        "Успех - это сумма маленьких усилий, повторяемых изо дня в день!",
        "Ты не тренируешься для кого-то, ты тренируешься для себя!"
    ];

    // Инициализация приложения
    init();

    function init() {
        // Установка текущей даты по умолчанию
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('measurement-date').value = today;
        document.getElementById('workout-date').value = today;

        // Загрузка данных
        loadData();
        
        // Настройка обработчиков событий
        setupEventListeners();
        
        // Обновление интерфейса
        updateUI();
        
        // Показать случайное мотивирующее сообщение
        showRandomMotivation();
    }

    function loadData() {
        const savedMeasurements = localStorage.getItem('fitnessMeasurements');
        const savedWorkouts = localStorage.getItem('fitnessWorkouts');
        
        if (savedMeasurements) {
            measurements = JSON.parse(savedMeasurements);
        }
        
        if (savedWorkouts) {
            workouts = JSON.parse(savedWorkouts);
        }
    }

    function saveData() {
        localStorage.setItem('fitnessMeasurements', JSON.stringify(measurements));
        localStorage.setItem('fitnessWorkouts', JSON.stringify(workouts));
    }

    function setupEventListeners() {
        // Переключение вкладок
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                
                if (tabId === 'stats') {
                    updateStats();
                    renderProgressChart();
                }
            });
        });

        // Добавление нового замера
        measurementForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const date = this['measurement-date'].value;
            const weight = parseFloat(this.weight.value);
            const waist = parseFloat(this.waist.value);
            
            const newMeasurement = {
                id: Date.now(),
                date: date,
                weight: weight,
                waist: waist,
                biceps: parseFloat(this.biceps.value) || null,
                thigh: parseFloat(this.thigh.value) || null,
                hips: parseFloat(this.hips.value) || null,
                chest: parseFloat(this.chest.value) || null,
                height: parseFloat(this.height.value) || null
            };
            
            measurements.push(newMeasurement);
            saveData();
            this.reset();
            updateUI();
            showSuccessMessage('Замер успешно сохранен!');
        });

        // Добавление упражнения
        addExerciseBtn.addEventListener('click', function() {
            const exerciseHTML = `
                <div class="exercise">
                    <input type="text" placeholder="Название упражнения" required>
                    <input type="number" placeholder="Подходы" min="1" required>
                    <input type="number" placeholder="Повторения" min="1" required>
                    <input type="number" placeholder="Вес (кг)" min="0" step="0.5">
                    <button type="button" class="remove-exercise-btn"><i class="fas fa-times"></i></button>
                </div>
            `;
            
            exercisesContainer.insertAdjacentHTML('beforeend', exerciseHTML);
        });

        // Удаление упражнения
        exercisesContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-exercise-btn') || 
                e.target.closest('.remove-exercise-btn')) {
                e.preventDefault();
                const exercise = e.target.closest('.exercise');
                if (exercise) exercise.remove();
            }
        });

        // Добавление новой тренировки
        workoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const date = this['workout-date'].value;
            const type = this['workout-type'].value;
            
            // Сбор данных об упражнениях
            const exercises = Array.from(exercisesContainer.querySelectorAll('.exercise')).map(exercise => {
                const inputs = exercise.querySelectorAll('input');
                return {
                    name: inputs[0].value,
                    sets: parseInt(inputs[1].value),
                    reps: parseInt(inputs[2].value),
                    weight: inputs[3].value ? parseFloat(inputs[3].value) : 0
                };
            });
            
            const newWorkout = {
                id: Date.now(),
                date: date,
                type: type,
                exercises: exercises
            };
            
            workouts.push(newWorkout);
            saveData();
            this.reset();
            exercisesContainer.innerHTML = '';
            updateUI();
            showSuccessMessage('Тренеровка успешно сохранена!');
        });

        // Удаление замеров и тренировок
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
                const element = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
                const id = parseInt(element.getAttribute('data-id'));
                
                if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                    measurements = measurements.filter(m => m.id !== id);
                    workouts = workouts.filter(w => w.id !== id);
                    saveData();
                    updateUI();
                }
            }
        });
    }

    function updateUI() {
        renderMeasurements();
        renderWorkouts();
        updateProgress();
        updateStats();
    }

    function renderMeasurements() {
        measurementsList.innerHTML = measurements
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(measurement => `
                <li>
                    <div>
                        <span class="measurement-date">${formatDate(measurement.date)}</span>
                        <div class="measurement-values">
                            ${measurement.weight ? `<span>Вес: ${measurement.weight} кг</span>` : ''}
                            ${measurement.waist ? `<span>Талия: ${measurement.waist} см</span>` : ''}
                            ${measurement.biceps ? `<span>Бицепс: ${measurement.biceps} см</span>` : ''}
                            ${measurement.thigh ? `<span>Бедро: ${measurement.thigh} см</span>` : ''}
                            ${measurement.hips ? `<span>Ягодицы: ${measurement.hips} см</span>` : ''}
                            ${measurement.chest ? `<span>Грудь: ${measurement.chest} см</span>` : ''}
                            ${measurement.height ? `<span>Рост: ${measurement.height} см</span>` : ''}
                        </div>
                    </div>
                    <button class="delete-btn" data-id="${measurement.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </li>
            `).join('');
    }

    function renderWorkouts() {
        workoutsList.innerHTML = workouts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(workout => `
                <li>
                    <div>
                        <span class="workout-date">${formatDate(workout.date)}</span>
                        <span class="workout-type">${getWorkoutTypeName(workout.type)}</span>
                        <ul class="workout-exercises">
                            ${workout.exercises.map(ex => `
                                <li>${ex.name}: ${ex.sets} × ${ex.reps} ${ex.weight > 0 ? `(${ex.weight} кг)` : ''}</li>
                            `).join('')}
                        </ul>
                    </div>
                    <button class="delete-btn" data-id="${workout.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </li>
            `).join('');
    }

    function updateProgress() {
        if (measurements.length < 2) {
            progressFill.style.width = '0%';
            return;
        }
        
        const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstMeasurement = sortedMeasurements[0];
        const lastMeasurement = sortedMeasurements[sortedMeasurements.length - 1];
        
        const weightDiff = firstMeasurement.weight - lastMeasurement.weight;
        const waistDiff = firstMeasurement.waist - lastMeasurement.waist;
        
        let progress = 0;
        
        if (weightDiff > 0 && waistDiff > 0) {
            progress = 100;
        } else if (weightDiff > 0 || waistDiff > 0) {
            progress = 50 + (weightDiff > 0 ? 25 : 0) + (waistDiff > 0 ? 25 : 0);
        } else if (weightDiff === 0 && waistDiff === 0) {
            progress = 50;
        } else {
            progress = Math.max(0, 50 - (weightDiff < 0 ? 25 : 0) - (waistDiff < 0 ? 25 : 0));
        }
        
        progressFill.style.width = `${progress}%`;
    }

    function updateStats() {
        if (measurements.length > 0) {
            const lastMeasurement = measurements[measurements.length - 1];
            lastWeightElement.textContent = `${lastMeasurement.weight} кг`;
            
            if (measurements.length > 1) {
                const firstMeasurement = measurements[0];
                const weightDiff = (lastMeasurement.weight - firstMeasurement.weight).toFixed(1);
                
                if (weightDiff > 0) {
                    weightChangeElement.textContent = `+${weightDiff} кг`;
                    weightChangeElement.style.color = 'var(--danger)';
                } else if (weightDiff < 0) {
                    weightChangeElement.textContent = `${weightDiff} кг`;
                    weightChangeElement.style.color = 'var(--success)';
                } else {
                    weightChangeElement.textContent = '0 кг';
                    weightChangeElement.style.color = 'var(--gray)';
                }
            } else {
                weightChangeElement.textContent = 'Нет данных';
            }
        } else {
            lastWeightElement.textContent = 'Нет данных';
            weightChangeElement.textContent = 'Нет данных';
        }
        
        totalWorkoutsElement.textContent = workouts.length;
    }

    function renderProgressChart() {
        if (measurements.length < 2) {
            if (progressChartCanvas) progressChartCanvas.style.display = 'none';
            return;
        }
        
        if (progressChartCanvas) progressChartCanvas.style.display = 'block';
        
        const sortedMeasurements = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const dates = sortedMeasurements.map(m => formatDate(m.date, true));
        const weights = sortedMeasurements.map(m => m.weight);
        const waists = sortedMeasurements.map(m => m.waist);
        
        if (progressChart) {
            progressChart.destroy();
        }
        
        const ctx = progressChartCanvas.getContext('2d');
        progressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Вес (кг)',
                        data: weights,
                        borderColor: 'var(--primary)',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Талия (см)',
                        data: waists,
                        borderColor: 'var(--danger)',
                        backgroundColor: 'rgba(247, 37, 133, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true, // 1. Делаем график адаптивным
                maintainAspectRatio: false, // 2. Отключаем фиксированные пропорции
                plugins: {
                    legend: {
                        position: 'bottom' // 3. Переносим легенду вниз
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        // 4. Настройки для мобильных:
                        bodyFont: {
                            size: 14 // Увеличиваем шрифт подсказок
                        }
                    }
                },
                // 5. Адаптация осей:
                scales: {
                    x: {
                        ticks: {
                            maxRotation: 45, // Наклон подписей на мобильных
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    function showRandomMotivation() {
        const randomIndex = Math.floor(Math.random() * motivationMessages.length);
        if (motivationText) motivationText.textContent = motivationMessages[randomIndex];
        
        const dailyIndex = Math.floor(Math.random() * dailyMotivations.length);
        if (dailyMotivation) dailyMotivation.textContent = dailyMotivations[dailyIndex];
    }

    function showSuccessMessage(message) {
        alert(message);
    }

    // Вспомогательные функции
    function formatDate(dateString, short = false) {
        const date = new Date(dateString);
        
        if (short) {
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        }
        
        return date.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }

    function getWorkoutTypeName(type) {
        const types = {
            strength: 'Силовая',
            cardio: 'Кардио',
            flexibility: 'Гибкость'
        };
        
        return types[type] || type;
    }
});