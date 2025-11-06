// Dashboard Application - Only handles dashboard functionality
let hotelData = null;
let currentUser = null;
const PH_VAT_RATE = 0.12;

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Load current user from session storage
    loadCurrentUser();
    
    // Load hotel data
    loadHotelData();
    
    // Initialize dashboard
    setupEventListeners();
    updateDashboard();
}

function loadCurrentUser() {
    const userSession = sessionStorage.getItem('currentUser');
    if (userSession) {
        currentUser = JSON.parse(userSession);
        document.getElementById('currentUser').textContent = currentUser.fullName;
        document.getElementById('userRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    } else {
        // Redirect to login if no user session
        window.location.href = 'index.html';
    }
}

function loadHotelData() {
    const savedData = localStorage.getItem('hotelM8Data');
    if (savedData) {
        hotelData = JSON.parse(savedData);
    } else {
        showAlert('System data not found. Please contact administrator.', 'error');
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Admin tabs
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const tabId = this.getAttribute('data-admin-tab');
            document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Check-in form
    document.getElementById('checkinForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processCheckIn();
    });

    // Room selection for checkout
    document.getElementById('checkoutRoomSelect').addEventListener('change', function() {
        updateCheckoutDetails();
    });

    // Process checkout
    document.getElementById('processCheckout').addEventListener('click', function() {
        processCheckOut();
    });

    // Extra charges input
    document.getElementById('extraCharges').addEventListener('input', function() {
        updateCheckoutDetails();
    });

    // Generate report
    document.getElementById('generateCustomReport').addEventListener('click', function() {
        generateCustomReport();
    });

    // Room rate change
    document.getElementById('roomSelect').addEventListener('change', function() {
        updateRoomRate();
    });

    // Room management
    document.getElementById('markOutOfOrder').addEventListener('click', function() {
        openOutOfOrderModal();
    });

    document.getElementById('markVacant').addEventListener('click', function() {
        markSelectedRoomVacant();
    });

    document.getElementById('confirmOutOfOrder').addEventListener('click', function() {
        confirmOutOfOrder();
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Window click to close modals
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Guest search
    document.getElementById('guestSearch').addEventListener('input', function() {
        filterGuests(this.value);
    });
    
    // Check user permissions
    checkUserPermissions();
}

function checkUserPermissions() {
    const adminButtons = document.querySelectorAll('.admin-only');
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    adminButtons.forEach(btn => {
        btn.style.display = isAdmin ? 'flex' : 'none';
    });
}

// ... (rest of the dashboard functions remain the same, but only include dashboard-related code)
// processCheckIn(), updateCheckoutDetails(), processCheckOut(), etc.