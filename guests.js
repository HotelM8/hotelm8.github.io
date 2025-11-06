// Guest Management
let hotelData = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeGuestManagement();
});

function initializeGuestManagement() {
    loadCurrentUser();
    loadHotelData();
    setupEventListeners();
    updateGuestList();
}

function loadCurrentUser() {
    const userSession = sessionStorage.getItem('currentUser');
    if (userSession) {
        currentUser = JSON.parse(userSession);
        document.getElementById('currentUser').textContent = currentUser.fullName;
        document.getElementById('userRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        checkAdminAccess();
    } else {
        window.location.href = 'index.html';
    }
}

function checkAdminAccess() {
    const adminLinks = document.querySelectorAll('.admin-only');
    const isAdmin = currentUser && currentUser.role === 'admin';
    adminLinks.forEach(link => {
        link.style.display = isAdmin ? 'flex' : 'none';
    });
}

function loadHotelData() {
    const savedData = localStorage.getItem('hotelM8Data');
    if (savedData) {
        hotelData = JSON.parse(savedData);
    } else {
        showAlert('System data not found', 'error');
    }
}

function setupEventListeners() {
    document.getElementById('refreshGuests').addEventListener('click', function() {
        updateGuestList();
    });
    
    document.getElementById('exportGuests').addEventListener('click', function() {
        exportGuests();
    });
    
    document.getElementById('guestSearch').addEventListener('input', function() {
        filterGuests(this.value);
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
    
    // Modal close
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

function updateGuestList() {
    const tableBody = document.getElementById('guestsTableBody');
    const guestCount = document.getElementById('totalGuestsCount');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const currentGuests = hotelData.guests.filter(g => g.status === 'checked-in');
    
    if (currentGuests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No current guests</td></tr>';
        guestCount.textContent = '0';
        return;
    }
    
    currentGuests.forEach(guest => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${guest.room}</td>
            <td>${guest.name}</td>
            <td>${guest.phone}</td>
            <td>${new Date(guest.checkIn).toLocaleDateString()}</td>
            <td>${guest.nights}</td>
            <td>${guest.adults + guest.children}</td>
            <td>₱${guest.roomRate}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewGuestDetails('${guest.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-danger btn-sm" onclick="forceCheckOut('${guest.room}')">
                    <i class="fas fa-sign-out-alt"></i> Check-Out
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    guestCount.textContent = currentGuests.length.toString();
}

function filterGuests(searchTerm) {
    const rows = document.querySelectorAll('#guestsTableBody tr');
    const searchLower = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchLower) ? '' : 'none';
    });
}

function viewGuestDetails(guestId) {
    const guest = hotelData.guests.find(g => g.id === guestId);
    if (!guest) return;
    
    const modal = document.getElementById('guestDetailsModal');
    const content = document.getElementById('guestDetailsContent');
    
    content.innerHTML = `
        <div class="guest-details">
            <div class="detail-section">
                <h4>Personal Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Full Name:</label>
                        <span>${guest.name}</span>
                    </div>
                    <div class="info-item">
                        <label>Phone:</label>
                        <span>${guest.phone}</span>
                    </div>
                    <div class="info-item">
                        <label>Email:</label>
                        <span>${guest.email || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <label>Address:</label>
                        <span>${guest.address || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Identification</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <label>ID Type:</label>
                        <span>${guest.idType || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <label>ID Number:</label>
                        <span>${guest.idNumber || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Stay Information</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Room Number:</label>
                        <span>${guest.room}</span>
                    </div>
                    <div class="info-item">
                        <label>Check-In Date:</label>
                        <span>${new Date(guest.checkIn).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                        <label>Nights Booked:</label>
                        <span>${guest.nights}</span>
                    </div>
                    <div class="info-item">
                        <label>Total Guests:</label>
                        <span>${guest.adults + guest.children} (${guest.adults} adults, ${guest.children} children)</span>
                    </div>
                    <div class="info-item">
                        <label>Room Rate:</label>
                        <span>₱${guest.roomRate}/night</span>
                    </div>
                    <div class="info-item">
                        <label>Estimated Total:</label>
                        <span>₱${(guest.nights * guest.roomRate).toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            ${guest.specialRequests ? `
            <div class="detail-section">
                <h4>Special Requests</h4>
                <div class="special-requests">
                    <p>${guest.specialRequests}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function exportGuests() {
    const currentGuests = hotelData.guests.filter(g => g.status === 'checked-in');
    
    if (currentGuests.length === 0) {
        showAlert('No guests to export', 'error');
        return;
    }
    
    const csvContent = [
        ['Room', 'Name', 'Phone', 'Email', 'Check-In Date', 'Nights', 'Adults', 'Children', 'Room Rate'],
        ...currentGuests.map(guest => [
            guest.room,
            guest.name,
            guest.phone,
            guest.email || '',
            new Date(guest.checkIn).toLocaleDateString(),
            guest.nights,
            guest.adults,
            guest.children,
            guest.roomRate
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotelm8-guests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showAlert('Guest list exported successfully', 'success');
}

function forceCheckOut(roomNumber) {
    if (confirm(`Check out guest from Room ${roomNumber}?`)) {
        // Redirect to checkout page with room pre-selected
        sessionStorage.setItem('preSelectedRoom', roomNumber);
        window.location.href = 'checkout.html';
    }
}

function saveData() {
    localStorage.setItem('hotelM8Data', JSON.stringify(hotelData));
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.display = 'block';
    
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 3000);
}

// Make functions global for HTML onclick
window.viewGuestDetails = viewGuestDetails;
window.forceCheckOut = forceCheckOut;

// --- Dynamic hotel name header ---
function updateHotelHeader() {
    const hotelData = JSON.parse(localStorage.getItem('hotelM8Data'));
    const name = hotelData?.settings?.hotelName || 'HotelM8';
    const headers = document.querySelectorAll('.app-header h1');
    headers.forEach(h => h.textContent = `${name} Manager`);
}

document.addEventListener('DOMContentLoaded', updateHotelHeader);
// --- Live hotel name sync ---
window.addEventListener('storage', function(event) {
    if (event.key === 'hotelNameUpdate') {
        updateHotelHeader();
    }
});
