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
    let isLoadingData = false;
    let dataFetchTimeout = null;

   //  // API Base URL
   // const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
   //  ? 'http://localhost:5000/api'  // local development
   //  : 'https://zydo-graduate-empowerment-system-zges.onrender.com/api'; // production


    // API Base URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'  // local development
  : 'https://zydo-graduate-empowerment-system-zges-1.onrender.com/api'; // production cusub



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
            
            // Show graduates list with loading indicator
            graduatesList.classList.remove('hidden');
            showLoadingIndicator();
            
            // Show registration counter
            registrationCounter.classList.remove('hidden');
            
            // Fetch graduates with a small delay to ensure UI updates first
            setTimeout(() => {
                fetchGraduatesWithRetry();
            }, 300);
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
            
            // Fetch data if not already loaded
            if (graduatesList.children.length === 0 || 
                (graduatesList.children.length === 1 && graduatesList.children[0].classList.contains('loading-indicator'))) {
                showLoadingIndicator();
                fetchGraduatesWithRetry();
            }
        } else {
            graduatesList.classList.add('hidden');
            viewGraduatesBtn.innerHTML = '<i class="fas fa-lock"></i> View Graduates';
            registrationCounter.classList.add('hidden');
        }
    }

    // Show loading indicator
    function showLoadingIndicator() {
        graduatesList.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading graduate data...</p>
            </div>
        `;
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

    // Fetch graduates with retry logic
    const fetchGraduatesWithRetry = async (retryCount = 0) => {
        if (isLoadingData) return;
        
        isLoadingData = true;
        
        try {
            // Set a timeout for the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${API_URL}/graduates`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            
            const graduates = await response.json();
            graduatesCount = graduates.length;
            
            // Update counter if authenticated
            if (isAuthenticated) {
                updateCounter();
            }
            
            displayGraduates(graduates);
            isLoadingData = false;
        } catch (error) {
            isLoadingData = false;
            
            // If it's a timeout or network error, retry up to 3 times
            if ((error.name === 'AbortError' || error.message.includes('Failed to fetch')) && retryCount < 3) {
                showNotification(`Connection issue. Retrying... (${retryCount + 1}/3)`, 'error');
                
                // Exponential backoff for retries
                const delay = Math.pow(2, retryCount) * 1000;
                setTimeout(() => {
                    fetchGraduatesWithRetry(retryCount + 1);
                }, delay);
                
                return;
            }
            
            // Show error message if all retries failed
            graduatesList.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load graduate data</p>
                    <button class="retry-btn" onclick="fetchGraduatesWithRetry()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
            
            showNotification(`Failed to load data: ${error.message}`, 'error');
            console.error('Error fetching graduates:', error);
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
            // Set a timeout for the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${API_URL}/graduates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, faculty, graduationYear, telephone }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            
            graduateForm.reset();
            
            // Only fetch graduates if authenticated and list is visible
            if (isAuthenticated && !graduatesList.classList.contains('hidden')) {
                showLoadingIndicator();
                fetchGraduatesWithRetry();
            } else if (isAuthenticated) {
                // If list is hidden but authenticated, just update the counter
                graduatesCount++;
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
            // Set a timeout for the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${API_URL}/graduates/${id}`, {
                method: 'DELETE',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            
            // Update counter immediately for better UX
            if (graduatesCount > 0) {
                graduatesCount--;
                updateCounter();
            }
            
            showLoadingIndicator();
            fetchGraduatesWithRetry();
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
