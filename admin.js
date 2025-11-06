// Admin Management
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser && currentUser.role === 'admin') {
        updateUsersTable();
        
        document.getElementById('addUserBtn').addEventListener('click', function() {
            document.getElementById('addUserModal').style.display = 'flex';
        });
        
        document.getElementById('addUserForm').addEventListener('submit', function(e) {
            e.preventDefault();
            addNewUser();
        });
    }
}

function updateUsersTable() {
    const tableBody = document.getElementById('usersTableBody');
    const hotelData = JSON.parse(localStorage.getItem('hotelM8Data'));
    
    if (!hotelData || !hotelData.users) {
        tableBody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = hotelData.users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td>${user.role}</td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
            <td>${user.isActive ? 'Active' : 'Inactive'}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}')" ${user.username === 'admin' ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function addNewUser() {
    const username = document.getElementById('newUsername').value;
    const fullName = document.getElementById('newFullName').value;
    const role = document.getElementById('newUserRole').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    const hotelData = JSON.parse(localStorage.getItem('hotelM8Data'));
    if (hotelData.users.find(u => u.username === username)) {
        alert('Username already exists');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        username: username,
        password: password,
        fullName: fullName,
        role: role,
        lastLogin: null,
        isActive: true
    };
    
    hotelData.users.push(newUser);
    localStorage.setItem('hotelM8Data', JSON.stringify(hotelData));
    
    updateUsersTable();
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
    alert('User created successfully');
}

// Global functions
window.editUser = function(userId) {
    alert('Edit user functionality to be implemented');
};

window.deleteUser = function(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const hotelData = JSON.parse(localStorage.getItem('hotelM8Data'));
        hotelData.users = hotelData.users.filter(u => u.id !== userId);
        localStorage.setItem('hotelM8Data', JSON.stringify(hotelData));
        updateUsersTable();
        alert('User deleted successfully');
    }
};

function loadHotelSettings() {
    const hotelData = JSON.parse(localStorage.getItem('hotelM8Data')) || { settings: {} };
    document.getElementById('hotelName').value = hotelData.settings.hotelName || 'HotelM8';
    document.getElementById('hotelContact').value = hotelData.settings.hotelContact || '';
    document.getElementById('hotelAddress').value = hotelData.settings.hotelAddress || '';
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
    loadHotelSettings(); // <-- Load settings when admin panel opens
});
// Save settings button click
document.getElementById('saveSettings').addEventListener('click', function() {
    const hotelName = document.getElementById('hotelName').value.trim();
    const hotelContact = document.getElementById('hotelContact').value.trim();
    const hotelAddress = document.getElementById('hotelAddress').value.trim();

    const hotelData = JSON.parse(localStorage.getItem('hotelM8Data')) || {};
    if (!hotelData.settings) hotelData.settings = {};

    hotelData.settings.hotelName = hotelName || 'HotelM8';
    hotelData.settings.hotelContact = hotelContact;
    hotelData.settings.hotelAddress = hotelAddress;

    // Save to localStorage
    localStorage.setItem('hotelM8Data', JSON.stringify(hotelData));

    // Trigger update across all open pages (this is the key line)
    localStorage.setItem('hotelNameUpdate', Date.now());

    // Show alert like check-in success
    showAlert('Hotel information saved successfully!', 'success');

    // Update header immediately
    updateHotelHeader();
});

// --- Dynamic hotel name header ---
function updateHotelHeader() {
    const hotelData = JSON.parse(localStorage.getItem('hotelM8Data'));
    const name = hotelData?.settings?.hotelName || 'HotelM8';
    const headers = document.querySelectorAll('.app-header h1');
    headers.forEach(h => h.textContent = `${name} Manager`);
}

document.addEventListener('DOMContentLoaded', updateHotelHeader);
