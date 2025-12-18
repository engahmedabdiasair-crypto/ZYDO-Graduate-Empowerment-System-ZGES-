document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const graduateForm = document.getElementById('graduateForm');
    const graduatesList = document.getElementById('graduatesList');
    const notification = document.getElementById('notification');
    const viewGraduatesBtn = document.getElementById('viewGraduatesBtn');
    const passwordModal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('passwordInput');
    const unlockBtn = document.getElementById('unlockBtn');
    const closeModal = document.querySelector('.close');
    const passwordError = document.getElementById('passwordError');
    const registrationCounter = document.getElementById('registrationCounter');
    const counterNumber = document.querySelector('.counter-number');
    
    // Password for accessing graduates
    const PASSWORD = '74511';
    let isAuthenticated = false;
    let graduatesCount = 0;
    let allGraduates = []; // Cache for all graduate data
    let isLoadingData = false;

    // API Base URL
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api';

    // --- OPTIMIZATION: Fetch data immediately on page load ---
    // This pre-loads the data so it's ready when the user authenticates.
    fetchGraduatesData();

    // Modal functionality
    viewGraduatesBtn.addEventListener('click', () => {
        if (!isAuthenticated) {
            passwordModal.style.display = 'block';
            passwordInput.focus();
        } else {
            toggleGraduatesVisibility();
        }
    });

    closeModal.addEventListener('click', () => {
        passwordModal.style.display = 'none';
        passwordInput.value = '';
        passwordError.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === passwordModal) {
            passwordModal.style.display = 'none';
            passwordInput.value = '';
            passwordError.classList.add('hidden');
        }
    });

    unlockBtn.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    function checkPassword() {
        if (passwordInput.value === PASSWORD) {
            isAuthenticated = true;
            passwordModal.style.display = 'none';
            passwordInput.value = '';
            passwordError.classList.add('hidden');
            
            // Update button appearance
            viewGraduatesBtn.innerHTML = '<i class="fas fa-eye"></i> Hide Graduates';
            
            // Show graduates list immediately
            graduatesList.classList.remove('hidden');
            registrationCounter.classList.remove('hidden');

            // --- OPTIMIZATION: Display cached data instantly ---
            if (allGraduates.length > 0) {
                displayGraduates(allGraduates);
                updateCounter();
            } else {
                // If data isn't cached yet, show a loader and fetch it
                showLoadingIndicator();
                fetchGraduatesData(); // This function will handle displaying the data
            }
        } else {
            passwordError.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    function toggleGraduatesVisibility() {
        if (graduatesList.classList.contains('hidden')) {
            graduatesList.classList.remove('hidden');
            viewGraduatesBtn.innerHTML = '<i class="fas fa-eye"></i> Hide Graduates';
            registrationCounter.classList.remove('hidden');
        } else {
            graduatesList.classList.add('hidden');
            viewGraduatesBtn.innerHTML = '<i class="fas fa-lock"></i> View Graduates';
            registrationCounter.classList.add('hidden');
        }
    }

    // Update the counter with current graduates count
    function updateCounter() {
        counterNumber.textContent = graduatesCount;
        
        // Add animation to the counter
        counterNumber.style.transform = 'scale(1.2)';
        setTimeout(() => {
            counterNumber.style.transform = 'scale(1)';
        }, 300);
    }

    // --- OPTIMIZED: Single function to fetch and cache data ---
    const fetchGraduatesData = async () => {
        // Prevent multiple fetches at the same time
        if (isLoadingData) return;
        
        isLoadingData = true;
        
        try {
            // --- OPTIMIZATION: Shorter timeout for faster feedback ---
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced to 5 seconds
            
            const response = await fetch(`${API_URL}/graduates`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            
            const graduates = await response.json();
            
            // --- OPTIMIZATION: Cache the data ---
            allGraduates = graduates;
            graduatesCount = graduates.length;
            
            // If the user is already authenticated, update the UI
            if (isAuthenticated) {
                displayGraduates(allGraduates);
                updateCounter();
            }
            
        } catch (error) {
            console.error('Error fetching graduates:', error);
            // If authenticated, show the error in the list area
            if (isAuthenticated) {
                graduatesList.innerHTML = `
                    <div class="error-container">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load graduate data. Please try again.</p>
                        <button class="retry-btn" onclick="fetchGraduatesData()">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                    </div>
                `;
            }
        } finally {
            isLoadingData = false;
        }
    };

    // Display graduates in the UI
    const displayGraduates = (graduates) => {
        graduatesList.innerHTML = '';
        
        if (graduates.length === 0) {
            graduatesList.innerHTML = '<p>No graduates registered yet.</p>';
            return;
        }

        graduates.forEach(graduate => {
            const graduateCard = document.createElement('div');
            graduateCard.className = 'graduate-card';
            
            graduateCard.innerHTML = `
                <button class="delete-btn" data-id="${graduate._id}">
                    <i class="fas fa-times"></i>
                </button>
                <h3>${graduate.name}</h3>
                <p class="graduate-info"><i class="fas fa-graduation-cap"></i> ${graduate.faculty}</p>
                <p class="graduate-info"><i class="fas fa-calendar"></i> ${graduate.graduationYear}</p>
                <p class="graduate-info"><i class="fas fa-phone"></i> ${graduate.telephone}</p>
            `;
            
            graduatesList.appendChild(graduateCard);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteGraduate);
        });
    };

    // Add a new graduate
    graduateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const faculty = document.getElementById('faculty').value;
        const graduationYear = document.getElementById('graduationYear').value;
        const telephone = document.getElementById('telephone').value;
        
        try {
            const response = await fetch(`${API_URL}/graduates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, faculty, graduationYear, telephone })
            });
            
            if (!response.ok) throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            
            graduateForm.reset();
            
            // --- OPTIMIZATION: Re-fetch all data to keep cache fresh ---
            // This is simpler than adding the new graduate to the cache manually
            // and ensures the UI is always in sync with the database.
            await fetchGraduatesData();
            
            // If authenticated, update the display
            if (isAuthenticated) {
                displayGraduates(allGraduates);
                updateCounter();
            }
            
            showNotification('Graduate registered successfully!', 'success');
        } catch (error) {
            showNotification(`Failed to register graduate: ${error.message}`, 'error');
            console.error('Error registering graduate:', error);
        }
    });

    // Delete a graduate
    const deleteGraduate = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        
        if (!confirm('Are you sure you want to delete this graduate?')) return;
        
        try {
            const response = await fetch(`${API_URL}/graduates/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            
            // --- OPTIMIZATION: Re-fetch all data to keep cache fresh ---
            await fetchGraduatesData();

            // If authenticated, update the display
            if (isAuthenticated) {
                displayGraduates(allGraduates);
                updateCounter();
            }
            
            showNotification('Graduate deleted successfully!', 'success');
        } catch (error) {
            showNotification(`Failed to delete graduate: ${error.message}`, 'error');
            console.error('Error deleting graduate:', error);
        }
    };

    // Show notification
    const showNotification = (message, type) => {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    };
});
