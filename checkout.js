// Check-Out Management
let hotelData = null;
let currentUser = null;
const PH_VAT_RATE = 0.12;

document.addEventListener('DOMContentLoaded', function() {
    initializeCheckOut();
});

function initializeCheckOut() {
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
    document.getElementById('checkoutRoomSelect').addEventListener('change', function() {
        updateCheckoutDetails();
    });
    
    document.getElementById('processCheckout').addEventListener('click', function() {
        processCheckOut();
    });
    
    document.getElementById('extraCharges').addEventListener('input', function() {
        updateCheckoutDetails();
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

function updateRoomSelects() {
    const checkoutSelect = document.getElementById('checkoutRoomSelect');
    if (!checkoutSelect) return;
    
    checkoutSelect.innerHTML = '<option value="">-- Choose Occupied Room --</option>';
    
    hotelData.rooms.forEach(room => {
        if (room.status === 'occupied') {
            const option = document.createElement('option');
            option.value = room.number;
            const guest = hotelData.guests.find(g => g.room === room.number && g.status === 'checked-in');
            option.textContent = `${room.number} - ${room.type} - ${guest ? guest.name : 'Unknown'}`;
            checkoutSelect.appendChild(option);
        }
    });
}

function updateCheckoutDetails() {
    const roomNumber = document.getElementById('checkoutRoomSelect').value;
    const checkoutDetails = document.getElementById('checkoutDetails');
    
    if (!roomNumber) {
        checkoutDetails.style.display = 'none';
        return;
    }
    
    // Find guest in this room
    const guest = hotelData.guests.find(g => g.room === roomNumber && g.status === 'checked-in');
    if (!guest) {
        showAlert('No guest found in this room', 'error');
        return;
    }
    
    // Calculate charges
    const roomCharges = guest.nights * guest.roomRate;
    const extraCharges = parseFloat(document.getElementById('extraCharges').value) || 0;
    const tax = (roomCharges + extraCharges) * PH_VAT_RATE;
    const total = roomCharges + extraCharges + tax;
    
    // Update UI with guest information
    document.getElementById('checkoutGuestName').textContent = guest.name;
    document.getElementById('checkoutRoomNumber').textContent = guest.room;
    document.getElementById('checkoutCheckInDate').textContent = new Date(guest.checkIn).toLocaleDateString();
    document.getElementById('checkoutNights').textContent = guest.nights;
    document.getElementById('checkoutGuestPhone').textContent = guest.phone;
    document.getElementById('checkoutTotalGuests').textContent = `${guest.adults + guest.children} (${guest.adults} adults, ${guest.children} children)`;
    
    // Update billing information
    document.getElementById('checkoutRoomCharges').textContent = `₱${roomCharges.toFixed(2)}`;
    document.getElementById('checkoutTax').textContent = `₱${tax.toFixed(2)}`;
    document.getElementById('checkoutTotal').textContent = `₱${total.toFixed(2)}`;
    
    checkoutDetails.style.display = 'block';
}

function processCheckOut() {
    const roomNumber = document.getElementById('checkoutRoomSelect').value;
    const extraCharges = parseFloat(document.getElementById('extraCharges').value) || 0;
    
    // Find guest and room
    const guestIndex = hotelData.guests.findIndex(g => g.room === roomNumber && g.status === 'checked-in');
    const roomIndex = hotelData.rooms.findIndex(r => r.number === roomNumber);
    
    if (guestIndex === -1 || roomIndex === -1) {
        showAlert('Error processing check-out', 'error');
        return;
    }
    
    const guest = hotelData.guests[guestIndex];
    
    // Calculate final bill
    const roomCharges = guest.nights * guest.roomRate;
    const tax = (roomCharges + extraCharges) * PH_VAT_RATE;
    const total = roomCharges + extraCharges + tax;
    
    // Update guest status
    hotelData.guests[guestIndex].status = 'checked-out';
    hotelData.guests[guestIndex].checkOut = new Date().toISOString();
    hotelData.guests[guestIndex].totalBill = total;
    hotelData.guests[guestIndex].extraCharges = extraCharges;
    
    // Update room status
    hotelData.rooms[roomIndex].status = 'vacant';
    hotelData.rooms[roomIndex].guest = null;
    
    // Add transaction
    hotelData.transactions.push({
        id: Date.now().toString(),
        type: 'check-out',
        guestId: guest.id,
        room: roomNumber,
        amount: total,
        date: new Date().toISOString(),
        user: currentUser.username
    });
    
    // Save data
    saveData();
    
    // Generate receipt
    generateReceipt(guest, roomCharges, extraCharges, tax, total);
    
    // Show success message
    showAlert(`Successfully checked out ${guest.name} from Room ${roomNumber}. Total: ₱${total.toFixed(2)}. Receipt window opened.`, 'success');
    
    // Reset form and update room selections
    document.getElementById('checkoutRoomSelect').value = '';
    document.getElementById('checkoutDetails').style.display = 'none';
    document.getElementById('extraCharges').value = '0';
    updateRoomSelects();
}

function generateReceipt(guest, roomCharges, extraCharges, tax, total) {
    const receiptNumber = Date.now().toString().slice(-8);
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    // Create receipt HTML for the separate window
    const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>HotelM8 Receipt - ${receiptNumber}</title>
            <style>
                body { 
                    font-family: 'Courier New', monospace; 
                    margin: 0; 
                    padding: 20px; 
                    font-size: 14px;
                    line-height: 1.3;
                    background: white;
                }
                .receipt-container { 
                    max-width: 300px; 
                    margin: 0 auto; 
                    border: 1px solid #000;
                    padding: 20px;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 15px;
                    border-bottom: 2px dashed #000;
                    padding-bottom: 10px;
                }
                .hotel-name { 
                    font-size: 18px; 
                    font-weight: bold; 
                    margin-bottom: 5px;
                }
                .receipt-title { 
                    font-size: 16px; 
                    font-weight: bold; 
                    margin: 10px 0;
                    text-align: center;
                }
                .section { 
                    margin: 12px 0; 
                }
                .line { 
                    display: flex; 
                    justify-content: space-between; 
                    margin: 4px 0;
                }
                .label { 
                    font-weight: bold; 
                    margin-bottom: 5px;
                }
                .divider { 
                    border-bottom: 1px dashed #000; 
                    margin: 8px 0;
                }
                .total-section { 
                    border-top: 2px solid #000; 
                    margin-top: 12px; 
                    padding-top: 8px;
                    font-weight: bold;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 15px; 
                    font-size: 12px;
                    border-top: 2px dashed #000;
                    padding-top: 8px;
                }
                .thank-you { 
                    font-weight: bold; 
                    margin: 8px 0;
                }
                .actions {
                    text-align: center;
                    margin-top: 15px;
                }
                .print-btn {
                    padding: 8px 16px;
                    background: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: Arial, sans-serif;
                }
                @media print {
                    .actions { display: none !important; }
                    .receipt-container { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <div class="hotel-name">${hotelData.settings.hotelName || 'HotelM8'}</div>
                    <div>${hotelData.settings.hotelAddress || 'Professional Hotel Management'}</div>
                    <div>${hotelData.settings.hotelContact || ''}</div>
                </div>
                
                <div class="receipt-title">OFFICIAL RECEIPT</div>
                
                <div class="section">
                    <div class="line">
                        <span>Receipt No:</span>
                        <span>${receiptNumber}</span>
                    </div>
                    <div class="line">
                        <span>Date:</span>
                        <span>${currentDate}</span>
                    </div>
                    <div class="line">
                        <span>Time:</span>
                        <span>${currentTime}</span>
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <div class="section">
                    <div class="label">GUEST INFORMATION</div>
                    <div class="line">
                        <span>Name:</span>
                        <span>${guest.name}</span>
                    </div>
                    <div class="line">
                        <span>Room:</span>
                        <span>${guest.room}</span>
                    </div>
                    <div class="line">
                        <span>Check-In:</span>
                        <span>${new Date(guest.checkIn).toLocaleDateString()}</span>
                    </div>
                    <div class="line">
                        <span>Nights:</span>
                        <span>${guest.nights}</span>
                    </div>
                    <div class="line">
                        <span>Guests:</span>
                        <span>${guest.adults} Adult(s), ${guest.children} Child(ren)</span>
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <div class="section">
                    <div class="label">BILLING DETAILS</div>
                    <div class="line">
                        <span>Room Charges:</span>
                        <span>₱${roomCharges.toFixed(2)}</span>
                    </div>
                    <div class="line">
                        <span>Extra Charges:</span>
                        <span>₱${extraCharges.toFixed(2)}</span>
                    </div>
                    <div class="line">
                        <span>VAT (12%):</span>
                        <span>₱${tax.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="total-section">
                    <div class="line">
                        <span>TOTAL AMOUNT:</span>
                        <span>₱${total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <div class="section">
                    <div class="line">
                        <span>Processed by:</span>
                        <span>${currentUser.username}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="thank-you">Thank you for your stay!</div>
                    <div>BIR Approved</div>
                    <div>This receipt is valid for official purposes</div>
                    <div>Receipt generated by HotelM8 Hotel manager Software</div>
                </div>

                <div class="actions">
                    <button class="print-btn" onclick="window.print()">
                        🖨️ Print Receipt
                    </button>
                </div>
            </div>
        </body>
        </html>
    `;

    // Open receipt in a new window
    const receiptWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
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
