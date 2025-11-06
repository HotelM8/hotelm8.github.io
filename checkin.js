// Check-In Management
let hotelData = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeCheckIn();
});

function initializeCheckIn() {
    loadCurrentUser();
    loadHotelData();
    setupEventListeners();
    updateRoomSelects();
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
    document.getElementById('checkinForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processCheckIn();
    });
    
    document.getElementById('roomSelect').addEventListener('change', function() {
        updateRoomRate();
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

function updateRoomSelects() {
    const checkinSelect = document.getElementById('roomSelect');
    if (!checkinSelect) return;
    
    checkinSelect.innerHTML = '<option value="">-- Select Available Room --</option>';
    
    hotelData.rooms.forEach(room => {
        if (room.status === 'vacant') {
            const option = document.createElement('option');
            option.value = room.number;
            option.textContent = `${room.number} - ${room.type} (₱${room.rate}/night, ${room.maxGuests} guests max)`;
            checkinSelect.appendChild(option);
        }
    });
}

function updateRoomRate() {
    const roomNumber = document.getElementById('roomSelect').value;
    if (roomNumber) {
        const room = hotelData.rooms.find(r => r.number === roomNumber);
        if (room) {
            document.getElementById('roomRate').value = room.rate;
            // Update max guests validation
            document.getElementById('adults').max = room.maxGuests;
        }
    }
}

function processCheckIn() {
    const guestName = document.getElementById('guestName').value;
    const guestPhone = document.getElementById('guestPhone').value;
    const guestEmail = document.getElementById('guestEmail').value;
    const guestAddress = document.getElementById('guestAddress').value;
    const guestIdType = document.getElementById('guestIdType').value;
    const guestIdNumber = document.getElementById('guestIdNumber').value;
    const roomNumber = document.getElementById('roomSelect').value;
    const nights = parseInt(document.getElementById('nights').value);
    const adults = parseInt(document.getElementById('adults').value);
    const children = parseInt(document.getElementById('children').value);
    const roomRate = parseFloat(document.getElementById('roomRate').value);
    const specialRequests = document.getElementById('specialRequests').value;
    
    // Validation
    if (!guestName || !guestPhone || !roomNumber) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    const roomIndex = hotelData.rooms.findIndex(r => r.number === roomNumber);
    if (roomIndex === -1) {
        showAlert('Room not found', 'error');
        return;
    }

    const room = hotelData.rooms[roomIndex];
    const totalGuests = adults + children;
    if (totalGuests > room.maxGuests) {
        showAlert(`Room ${room.number} can only accommodate ${room.maxGuests} guests maximum`, 'error');
        return;
    }
    
    // Create guest record
    const guest = {
        id: Date.now().toString(),
        name: guestName,
        phone: guestPhone,
        email: guestEmail,
        address: guestAddress,
        idType: guestIdType,
        idNumber: guestIdNumber,
        room: roomNumber,
        checkIn: new Date().toISOString(),
        nights: nights,
        adults: adults,
        children: children,
        roomRate: roomRate,
        specialRequests: specialRequests,
        status: 'checked-in'
    };
    
    // Update room status
    hotelData.rooms[roomIndex].status = 'occupied';
    hotelData.rooms[roomIndex].guest = guest.id;
    
    // Add to guests list
    hotelData.guests.push(guest);
    
    // Add transaction
    hotelData.transactions.push({
        id: Date.now().toString(),
        type: 'check-in',
        guestId: guest.id,
        room: roomNumber,
        amount: 0,
        date: new Date().toISOString(),
        user: currentUser.username
    });
    
    // Save data
    saveData();
    
    // Show success message and reset form
    showAlert(`Successfully checked in ${guestName} to Room ${roomNumber}`, 'success');
    
    // Reset form
    document.getElementById('checkinForm').reset();
    
    // Update room selections
    updateRoomSelects();
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
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
