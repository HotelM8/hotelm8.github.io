// Room Management
let hotelData = null;
let currentUser = null;
let selectedRoom = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeRoomManagement();
});

function initializeRoomManagement() {
    loadCurrentUser();
    loadHotelData();
    setupEventListeners();
    renderRoomManagement();
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
    // Room actions
    document.getElementById('markOutOfOrder').addEventListener('click', openOutOfOrderModal);
    document.getElementById('markVacant').addEventListener('click', markSelectedRoomVacant);
    document.getElementById('refreshRooms').addEventListener('click', renderRoomManagement);
    document.getElementById('confirmOutOfOrder').addEventListener('click', confirmOutOfOrder);
    
    // Logout
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

function renderRoomManagement() {
    const floors = {};
    hotelData.rooms.forEach(room => {
        if (!floors[room.floor]) floors[room.floor] = [];
        floors[room.floor].push(room);
    });

    Object.keys(floors).sort().forEach(floorNumber => {
        const container = document.getElementById(`floor${floorNumber}Rooms`);
        if (container) {
            container.innerHTML = floors[floorNumber].map(room => {
                const guest = hotelData.guests.find(g => g.room === room.number && g.status === 'checked-in');
                const guestInfo = guest ? `<div style="font-size: 0.7rem; margin-top: 3px;">👤 ${guest.name}</div>` : '';
                
                return `
                    <div class="room-card status-${room.status}" data-room="${room.number}" onclick="selectRoom('${room.number}')">
                        <div class="room-number">${room.number}</div>
                        <div class="room-type">${room.type}</div>
                        <div class="room-status">${room.status.charAt(0).toUpperCase() + room.status.slice(1)}</div>
                        ${room.outOfOrder ? `<div style="font-size: 0.7rem; margin-top: 3px;">🔧 ${room.outOfOrder.reason}</div>` : ''}
                        ${guestInfo}
                    </div>
                `;
            }).join('');
        }
    });
    
    updateSelectedRoomInfo();
}

function selectRoom(roomNumber) {
    selectedRoom = roomNumber;
    
    // Update visual selection
    document.querySelectorAll('.room-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-room="${roomNumber}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    updateSelectedRoomInfo();
}

function updateSelectedRoomInfo() {
    const infoDiv = document.getElementById('selectedRoomInfo');
    
    if (!selectedRoom) {
        infoDiv.style.display = 'none';
        return;
    }
    
    const room = hotelData.rooms.find(r => r.number === selectedRoom);
    if (!room) {
        infoDiv.style.display = 'none';
        return;
    }
    
    const guest = hotelData.guests.find(g => g.room === selectedRoom && g.status === 'checked-in');
    
    document.getElementById('selectedRoomNumber').textContent = room.number;
    document.getElementById('selectedRoomStatus').textContent = room.status.charAt(0).toUpperCase() + room.status.slice(1);
    document.getElementById('selectedRoomType').textContent = room.type;
    
    // Show guest information if room is occupied
    if (guest) {
        infoDiv.innerHTML = `
            <h4>Selected Room: ${room.number}</h4>
            <p><strong>Status:</strong> ${room.status.charAt(0).toUpperCase() + room.status.slice(1)}</p>
            <p><strong>Type:</strong> ${room.type}</p>
            <p><strong>Current Guest:</strong> ${guest.name}</p>
            <p><strong>Contact:</strong> ${guest.phone}</p>
            <p><strong>Check-In:</strong> ${new Date(guest.checkIn).toLocaleDateString()}</p>
            <div class="alert alert-error" style="margin-top: 10px; padding: 10px;">
                <i class="fas fa-exclamation-triangle"></i> This room is currently occupied. Check out the guest first.
            </div>
        `;
    } else {
        infoDiv.innerHTML = `
            <h4>Selected Room: ${room.number}</h4>
            <p><strong>Status:</strong> ${room.status.charAt(0).toUpperCase() + room.status.slice(1)}</p>
            <p><strong>Type:</strong> ${room.type}</p>
            ${room.outOfOrder ? `<p><strong>Out of Order Reason:</strong> ${room.outOfOrder.reason}</p>` : ''}
        `;
    }
    
    infoDiv.style.display = 'block';
}

function openOutOfOrderModal() {
    if (!selectedRoom) {
        showAlert('Please select a room first', 'error');
        return;
    }
    
    const room = hotelData.rooms.find(r => r.number === selectedRoom);
    if (!room) {
        showAlert('Room not found', 'error');
        return;
    }
    
    // Check if room is occupied
    const guest = hotelData.guests.find(g => g.room === selectedRoom && g.status === 'checked-in');
    if (guest) {
        showAlert(`Cannot mark Room ${selectedRoom} as out of order. It is currently occupied by ${guest.name}. Please check out the guest first.`, 'error');
        return;
    }
    
    // Check if room is already out of order
    if (room.status === 'out-of-order') {
        showAlert(`Room ${selectedRoom} is already marked as out of order.`, 'error');
        return;
    }
    
    const modal = document.getElementById('outOfOrderModal');
    document.getElementById('selectedRoomNumber').value = selectedRoom;
    modal.style.display = 'flex';
}

function confirmOutOfOrder() {
    const roomNumber = document.getElementById('selectedRoomNumber').value;
    const reason = document.getElementById('outOfOrderReason').value;
    const details = document.getElementById('outOfOrderDetails').value;
    const estimatedDate = document.getElementById('estimatedRepairDate').value;
    
    if (!reason) {
        showAlert('Please select a reason', 'error');
        return;
    }
    
    const roomIndex = hotelData.rooms.findIndex(r => r.number === roomNumber);
    if (roomIndex === -1) {
        showAlert('Room not found', 'error');
        return;
    }
    
    // Double-check that room is not occupied (in case status changed between modal open and confirm)
    const guest = hotelData.guests.find(g => g.room === roomNumber && g.status === 'checked-in');
    if (guest) {
        showAlert(`Cannot mark Room ${roomNumber} as out of order. It is currently occupied by ${guest.name}.`, 'error');
        document.getElementById('outOfOrderModal').style.display = 'none';
        return;
    }
    
    // Update room status
    hotelData.rooms[roomIndex].status = 'out-of-order';
    hotelData.rooms[roomIndex].outOfOrder = {
        reason: reason,
        details: details,
        estimatedDate: estimatedDate,
        markedDate: new Date().toISOString(),
        markedBy: currentUser.username
    };
    
    // Save and update UI
    saveData();
    renderRoomManagement();
    
    // Close modal and reset form
    document.getElementById('outOfOrderModal').style.display = 'none';
    document.getElementById('outOfOrderReason').value = '';
    document.getElementById('outOfOrderDetails').value = '';
    document.getElementById('estimatedRepairDate').value = '';
    
    showAlert(`Room ${roomNumber} marked as out of order`, 'success');
}

function markSelectedRoomVacant() {
    if (!selectedRoom) {
        showAlert('Please select a room first', 'error');
        return;
    }
    
    const roomIndex = hotelData.rooms.findIndex(r => r.number === selectedRoom);
    if (roomIndex === -1) {
        showAlert('Room not found', 'error');
        return;
    }
    
    const room = hotelData.rooms[roomIndex];
    
    // Check if room is occupied
    const guest = hotelData.guests.find(g => g.room === selectedRoom && g.status === 'checked-in');
    if (guest) {
        showAlert(`Cannot mark Room ${selectedRoom} as vacant. It is currently occupied by ${guest.name}. Please check out the guest first.`, 'error');
        return;
    }
    
    // Check if room is already vacant
    if (room.status === 'vacant') {
        showAlert(`Room ${selectedRoom} is already vacant.`, 'error');
        return;
    }
    
    // Confirm action for out-of-order rooms
    if (room.status === 'out-of-order') {
        if (!confirm(`Are you sure you want to mark Room ${selectedRoom} as vacant? This will remove the out-of-order status.`)) {
            return;
        }
    }
    
    hotelData.rooms[roomIndex].status = 'vacant';
    hotelData.rooms[roomIndex].outOfOrder = null;
    hotelData.rooms[roomIndex].guest = null;
    
    // Save and update UI
    saveData();
    renderRoomManagement();
    
    showAlert(`Room ${selectedRoom} marked as vacant`, 'success');
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
    }, 5000); // Increased to 5 seconds for error messages
}

// Make functions global for HTML onclick
window.selectRoom = selectRoom;
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
