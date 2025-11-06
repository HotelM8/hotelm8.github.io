// Login System
document.addEventListener('DOMContentLoaded', function() {
    initializeSystemData();
    
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        authenticateUser(username, password);
    });
});

function initializeSystemData() {
    let hotelData = localStorage.getItem('hotelM8Data');
    
    if (!hotelData) {
        const initialData = {
            rooms: [],
            guests: [],
            transactions: [],
            users: [
                {
                    id: '1',
                    username: 'admin',
                    password: 'admin123',
                    fullName: 'System Administrator',
                    role: 'admin',
                    lastLogin: null,
                    isActive: true
                }
            ],
            settings: {
                hotelName: "HotelM8",
                hotelAddress: "",
                hotelContact: "",
                vatRate: 0.12
            },
            roomTypes: [
                { type: "Standard", rate: 2500, maxGuests: 2, beds: 1 },
                { type: "Deluxe", rate: 4500, maxGuests: 4, beds: 2 },
                { type: "Suite", rate: 7500, maxGuests: 4, beds: 2 }
            ]
        };

        // Create 30 rooms across 6 floors
        const floors = [
            { number: 1, rooms: ['101', '102', '103', '104', '105'] },
            { number: 2, rooms: ['106', '107', '108', '109', '110'] },
            { number: 3, rooms: ['201', '202', '203', '204', '205'] },
            { number: 4, rooms: ['206', '207', '208', '209', '210'] },
            { number: 5, rooms: ['301', '302', '303', '304', '305'] },
            { number: 6, rooms: ['306', '307', '308', '309', '310'] }
        ];

        floors.forEach(floor => {
            floor.rooms.forEach((roomNumber, index) => {
                let typeIndex = index % 3;
                initialData.rooms.push({
                    number: roomNumber,
                    type: initialData.roomTypes[typeIndex].type,
                    rate: initialData.roomTypes[typeIndex].rate,
                    maxGuests: initialData.roomTypes[typeIndex].maxGuests,
                    beds: initialData.roomTypes[typeIndex].beds,
                    status: 'vacant',
                    guest: null,
                    floor: floor.number,
                    outOfOrder: null
                });
            });
        });

        localStorage.setItem('hotelM8Data', JSON.stringify(initialData));
    }
}

function authenticateUser(username, password) {
    const savedData = localStorage.getItem('hotelM8Data');
    if (!savedData) {
        showLoginAlert('System error: No data found', 'error');
        return;
    }

    const hotelData = JSON.parse(savedData);
    const user = hotelData.users.find(u => 
        u.username === username && u.isActive === true
    );

    if (!user) {
        showLoginAlert('Invalid username or password', 'error');
        return;
    }

    if (user.password !== password) {
        showLoginAlert('Invalid username or password', 'error');
        return;
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    localStorage.setItem('hotelM8Data', JSON.stringify(hotelData));

    // Store current user session and redirect
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'dashboard.html';
}

function showLoginAlert(message, type) {
    const alertDiv = document.getElementById('loginAlert');
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