// Reports Management
let hotelData = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeReports();
});

function initializeReports() {
    loadCurrentUser();
    loadHotelData();
    setupEventListeners();
    generateDailyReport();
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
    document.getElementById('generateDailyReport').addEventListener('click', function() {
        generateDailyReport();
    });
    
    document.getElementById('generateCustomReport').addEventListener('click', function() {
        generateCustomReport();
    });
    
    document.getElementById('printReport').addEventListener('click', function() {
        printReport();
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

function generateDailyReport() {
    const today = new Date().toDateString();
    generateReportForPeriod(today, today);
}

function generateCustomReport() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        showAlert('Please select both start and end dates', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showAlert('Start date cannot be after end date', 'error');
        return;
    }
    
    generateReportForPeriod(startDate, endDate);
}

function generateReportForPeriod(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59');
    
    // Filter transactions for the period
    const periodTransactions = hotelData.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= start && transactionDate <= end;
    });
    
    // Calculate statistics
    const checkins = periodTransactions.filter(t => t.type === 'check-in').length;
    const checkouts = periodTransactions.filter(t => t.type === 'check-out').length;
    const totalRevenue = periodTransactions
        .filter(t => t.type === 'check-out')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const currentGuests = hotelData.guests.filter(g => g.status === 'checked-in').length;
    const totalRooms = hotelData.rooms.length;
    const occupiedRooms = hotelData.rooms.filter(r => r.status === 'occupied').length;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
    
    // Update summary cards
    document.getElementById('reportTotalGuests').textContent = currentGuests;
    document.getElementById('reportCheckins').textContent = checkins;
    document.getElementById('reportCheckouts').textContent = checkouts;
    document.getElementById('reportTotalRevenue').textContent = `₱${totalRevenue.toFixed(2)}`;
    document.getElementById('reportOccupancyRate').textContent = `${occupancyRate}%`;
    
    // Generate detailed report
    generateDetailedReport(periodTransactions, start, end, totalRevenue, occupancyRate);
    
    showAlert('Report generated successfully', 'success');
}

function generateDetailedReport(transactions, startDate, endDate, totalRevenue, occupancyRate) {
    const reportDetails = document.getElementById('reportDetails');
    
    // Room occupancy breakdown
    const roomTypes = {};
    hotelData.rooms.forEach(room => {
        if (!roomTypes[room.type]) {
            roomTypes[room.type] = { total: 0, occupied: 0 };
        }
        roomTypes[room.type].total++;
        if (room.status === 'occupied') {
            roomTypes[room.type].occupied++;
        }
    });
    
    // Revenue by room type
    const revenueByType = {};
    transactions.filter(t => t.type === 'check-out').forEach(transaction => {
        const guest = hotelData.guests.find(g => g.id === transaction.guestId);
        if (guest) {
            const room = hotelData.rooms.find(r => r.number === guest.room);
            if (room && room.type) {
                if (!revenueByType[room.type]) {
                    revenueByType[room.type] = 0;
                }
                revenueByType[room.type] += transaction.amount;
            }
        }
    });
    
    reportDetails.innerHTML = `
        <div class="report-section">
            <h4>Period Summary</h4>
            <div class="info-grid">
                <div class="info-item">
                    <label>Report Period:</label>
                    <span>${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}</span>
                </div>
                <div class="info-item">
                    <label>Generated On:</label>
                    <span>${new Date().toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <label>Generated By:</label>
                    <span>${currentUser.username}</span>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h4>Room Occupancy</h4>
            <div class="room-occupancy-grid">
                ${Object.keys(roomTypes).map(type => `
                    <div class="occupancy-item">
                        <div class="room-type">${type}</div>
                        <div class="occupancy-stats">
                            <span class="occupied">${roomTypes[type].occupied} occupied</span>
                            <span class="total">/ ${roomTypes[type].total} total</span>
                        </div>
                        <div class="occupancy-rate">
                            ${((roomTypes[type].occupied / roomTypes[type].total) * 100).toFixed(1)}%
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="report-section">
            <h4>Revenue Breakdown</h4>
            <div class="revenue-grid">
                ${Object.keys(revenueByType).map(type => `
                    <div class="revenue-item">
                        <div class="room-type">${type}</div>
                        <div class="revenue-amount">₱${revenueByType[type].toFixed(2)}</div>
                        <div class="revenue-percentage">
                            ${totalRevenue > 0 ? ((revenueByType[type] / totalRevenue) * 100).toFixed(1) : 0}%
                        </div>
                    </div>
                `).join('')}
                <div class="revenue-total">
                    <div class="room-type">TOTAL REVENUE</div>
                    <div class="revenue-amount">₱${totalRevenue.toFixed(2)}</div>
                    <div class="revenue-percentage">100%</div>
                </div>
            </div>
        </div>
        
        <div class="report-section">
            <h4>Recent Transactions</h4>
            <div class="transactions-list">
                ${transactions.slice(-10).reverse().map(transaction => `
                    <div class="transaction-item">
                        <div class="transaction-type ${transaction.type}">${transaction.type.toUpperCase()}</div>
                        <div class="transaction-details">
                            <span class="room">Room ${transaction.room}</span>
                            <span class="date">${new Date(transaction.date).toLocaleString()}</span>
                        </div>
                        <div class="transaction-amount">
                            ${transaction.type === 'check-out' ? `₱${transaction.amount.toFixed(2)}` : '-'}
                        </div>
                        <div class="transaction-user">
                            ${transaction.user}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function printReport() {
    const reportContent = document.getElementById('reportDetails').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>HotelM8 Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-section { margin-bottom: 30px; }
                    .report-section h4 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
                    .info-grid, .room-occupancy-grid, .revenue-grid { display: grid; gap: 10px; margin-top: 15px; }
                    .info-item { display: flex; justify-content: space-between; }
                    .occupancy-item, .revenue-item { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; }
                    .transaction-item { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; }
                    .revenue-total { font-weight: bold; border-top: 2px solid #2c3e50; margin-top: 10px; padding-top: 10px; }
                    .transaction-type.check-out { color: #27ae60; }
                    .transaction-type.check-in { color: #3498db; }
                </style>
            </head>
            <body>
                <h1>🏨 HotelM8 Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Generated by: ${currentUser.username}</p>
                ${reportContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
