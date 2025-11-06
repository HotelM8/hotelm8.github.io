// Dashboard Management
let hotelData = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    loadCurrentUser();
    loadHotelData();
    setupEventListeners();
    updateDashboard();
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
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

function updateDashboard() {
    if (!hotelData) return;
    
    // Update statistics
    const totalRooms = hotelData.rooms.length;
    const occupiedRooms = hotelData.rooms.filter(r => r.status === 'occupied').length;
    const vacantRooms = hotelData.rooms.filter(r => r.status === 'vacant').length;
    const outOfOrderRooms = hotelData.rooms.filter(r => r.status === 'out-of-order').length;
    
    const today = new Date().toDateString();
    const todayRevenue = hotelData.transactions
        .filter(t => t.type === 'check-out' && new Date(t.date).toDateString() === today)
        .reduce((sum, t) => sum + t.amount, 0);
    
    document.getElementById('totalRooms').textContent = totalRooms;
    document.getElementById('occupiedRooms').textContent = occupiedRooms;
    document.getElementById('vacantRooms').textContent = vacantRooms;
    document.getElementById('outOfOrderRooms').textContent = outOfOrderRooms;
    document.getElementById('todayRevenue').textContent = `₱${todayRevenue.toFixed(2)}`;
    
    // Update recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    // Get recent transactions (last 5)
    const recentTransactions = hotelData.transactions.slice(-5).reverse();
    
    if (recentTransactions.length === 0) {
        activityList.innerHTML = '<div class="activity-item">No recent activity</div>';
        return;
    }
    
    activityList.innerHTML = recentTransactions.map(transaction => {
        const guest = hotelData.guests.find(g => g.id === transaction.guestId);
        const timeAgo = getTimeAgo(new Date(transaction.date));
        
        if (transaction.type === 'check-in') {
            return `
                <div class="activity-item">
                    <i class="fas fa-user-plus text-success"></i>
                    <div class="activity-details">
                        <strong>${guest ? guest.name : 'Guest'}</strong> checked into <strong>Room ${transaction.room}</strong>
                        <div class="activity-time">${timeAgo} • ${transaction.user}</div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="activity-item">
                    <i class="fas fa-user-minus text-primary"></i>
                    <div class="activity-details">
                        <strong>${guest ? guest.name : 'Guest'}</strong> checked out from <strong>Room ${transaction.room}</strong>
                        <div class="activity-time">${timeAgo} • ${transaction.user}</div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
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
