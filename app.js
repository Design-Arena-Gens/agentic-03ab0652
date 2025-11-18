// Data Storage
let currentUser = null;
let firms = JSON.parse(localStorage.getItem('firms')) || {};
let currentFirmData = null;

// Utility Functions
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.screen.active .container') ||
                     document.querySelector('.screen.active .content');

    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => alertDiv.remove(), 3000);
    }
}

function generateFirmId() {
    return 'FIRM' + Date.now().toString().substr(-8);
}

// Navigation Functions
function showLogin() {
    showScreen('login-screen');
}

function showRegistration() {
    showScreen('registration-screen');
}

function showPasswordReset() {
    showScreen('reset-screen');
}

function showDashboard() {
    showScreen('dashboard-screen');
    updateDashboard();
}

function showJournal() {
    showScreen('journal-screen');
    loadJournalEntries();
    updateNavFirmName('journal');
}

function showInventory() {
    showScreen('inventory-screen');
    loadInventory();
    updateNavFirmName('inventory');
}

function showInvoicing() {
    showScreen('invoicing-screen');
    loadInvoices();
    updateNavFirmName('invoicing');
}

function showReports() {
    showScreen('reports-screen');
    updateNavFirmName('reports');
}

function updateNavFirmName(section) {
    const firmName = currentFirmData?.firmName || '';
    const element = document.getElementById(`nav-firm-name${section ? '-' + section : ''}`);
    if (element) {
        element.textContent = firmName;
    }
}

// Authentication Functions
function register(event) {
    event.preventDefault();

    const pin = document.getElementById('pin').value;
    const confirmPin = document.getElementById('confirm-pin').value;

    if (pin !== confirmPin) {
        showAlert('PINs do not match!', 'error');
        return;
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        showAlert('PIN must be exactly 4 digits!', 'error');
        return;
    }

    const firmId = generateFirmId();

    firms[firmId] = {
        firmId: firmId,
        firmName: document.getElementById('firm-name').value,
        address: document.getElementById('firm-address').value,
        phone: document.getElementById('firm-phone').value,
        email: document.getElementById('firm-email').value,
        gstin: document.getElementById('gstin').value,
        pan: document.getElementById('pan').value,
        taxRegime: document.getElementById('tax-regime').value,
        bankName: document.getElementById('bank-name').value,
        accountNumber: document.getElementById('account-number').value,
        ifsc: document.getElementById('ifsc').value,
        pin: pin,
        securityQuestions: [
            {
                question: document.getElementById('security-q1').value,
                answer: document.getElementById('security-a1').value.toLowerCase()
            },
            {
                question: document.getElementById('security-q2').value,
                answer: document.getElementById('security-a2').value.toLowerCase()
            },
            {
                question: document.getElementById('security-q3').value,
                answer: document.getElementById('security-a3').value.toLowerCase()
            }
        ],
        journal: [],
        inventory: [],
        invoices: [],
        capital: 0
    };

    localStorage.setItem('firms', JSON.stringify(firms));

    alert(`Registration Successful!\n\nYour Firm ID: ${firmId}\n\nPlease save this ID for login.`);

    document.getElementById('registration-form').reset();
    showLogin();
}

function login() {
    const firmId = document.getElementById('login-firm-id').value;
    const pin = document.getElementById('login-pin').value;

    if (!firms[firmId]) {
        showAlert('Firm ID not found!', 'error');
        return;
    }

    if (firms[firmId].pin !== pin) {
        showAlert('Incorrect PIN!', 'error');
        return;
    }

    currentUser = firmId;
    currentFirmData = firms[firmId];

    document.getElementById('nav-firm-name').textContent = currentFirmData.firmName;

    showDashboard();
}

function logout() {
    currentUser = null;
    currentFirmData = null;
    document.getElementById('login-firm-id').value = '';
    document.getElementById('login-pin').value = '';
    showLogin();
}

function resetPassword(event) {
    event.preventDefault();

    const firmId = document.getElementById('reset-firm-id').value;

    if (!firms[firmId]) {
        showAlert('Firm ID not found!', 'error');
        return;
    }

    const firm = firms[firmId];
    let allCorrect = true;

    firm.securityQuestions.forEach((sq, index) => {
        const answer = document.getElementById(`reset-answer-${index}`).value.toLowerCase();
        if (answer !== sq.answer) {
            allCorrect = false;
        }
    });

    if (!allCorrect) {
        showAlert('Security answers are incorrect!', 'error');
        return;
    }

    const newPin = prompt('Enter new 4-digit PIN:');
    if (newPin && newPin.length === 4 && /^\d+$/.test(newPin)) {
        firms[firmId].pin = newPin;
        localStorage.setItem('firms', JSON.stringify(firms));
        showAlert('PIN reset successful!');
        setTimeout(() => showLogin(), 2000);
    } else {
        showAlert('Invalid PIN format!', 'error');
    }
}

// Load security questions for password reset
document.getElementById('reset-firm-id')?.addEventListener('blur', function() {
    const firmId = this.value;
    if (firms[firmId]) {
        const questionsDiv = document.getElementById('security-questions');
        questionsDiv.innerHTML = '';

        firms[firmId].securityQuestions.forEach((sq, index) => {
            const questionText = {
                'mother': "Mother's maiden name?",
                'pet': "First pet's name?",
                'school': "First school name?",
                'city': "City of birth?",
                'teacher': "Favorite teacher?",
                'book': "Favorite book?",
                'food': "Favorite food?",
                'car': "First car?",
                'friend': "Best friend's name?"
            };

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `reset-answer-${index}`;
            input.placeholder = questionText[sq.question];
            input.required = true;
            questionsDiv.appendChild(input);
        });
    }
});

// Dashboard Functions
function updateDashboard() {
    if (!currentFirmData) return;

    const stats = calculateStats();

    document.getElementById('stat-sales').textContent = `₹${stats.sales.toLocaleString('en-IN')}`;
    document.getElementById('stat-revenue').textContent = `₹${stats.revenue.toLocaleString('en-IN')}`;
    document.getElementById('stat-tax').textContent = `₹${stats.tax.toLocaleString('en-IN')}`;
    document.getElementById('stat-expenses').textContent = `₹${stats.expenses.toLocaleString('en-IN')}`;
    document.getElementById('stat-purchases').textContent = `₹${stats.purchases.toLocaleString('en-IN')}`;
    document.getElementById('stat-inventory').textContent = `₹${stats.inventoryCost.toLocaleString('en-IN')}`;
    document.getElementById('stat-capital').textContent = `₹${stats.capital.toLocaleString('en-IN')}`;

    renderCharts(stats);
}

function calculateStats() {
    const journal = currentFirmData.journal || [];
    const inventory = currentFirmData.inventory || [];
    const invoices = currentFirmData.invoices || [];

    let sales = 0;
    let expenses = 0;
    let purchases = 0;

    journal.forEach(entry => {
        const particulars = entry.particulars.toLowerCase();
        if (particulars.includes('sales') || particulars.includes('revenue')) {
            sales += parseFloat(entry.credit || 0);
        }
        if (particulars.includes('expense') || particulars.includes('payment')) {
            expenses += parseFloat(entry.debit || 0);
        }
        if (particulars.includes('purchase')) {
            purchases += parseFloat(entry.debit || 0);
        }
    });

    invoices.forEach(inv => {
        sales += parseFloat(inv.totalAmount || 0);
    });

    let inventoryCost = 0;
    inventory.forEach(item => {
        inventoryCost += parseFloat(item.purchaseCost) * parseFloat(item.quantity);
    });

    const revenue = sales - expenses;
    const tax = sales * 0.18; // Simplified GST calculation
    const capital = currentFirmData.capital || revenue;

    return { sales, revenue, tax, expenses, purchases, inventoryCost, capital };
}

function renderCharts(stats) {
    // Sales & Revenue Chart
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        if (window.salesChartInstance) {
            window.salesChartInstance.destroy();
        }

        window.salesChartInstance = new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Sales',
                    data: generateTrendData(stats.sales),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Revenue',
                    data: generateTrendData(stats.revenue),
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    // Expense Chart
    const expenseCtx = document.getElementById('expenseChart');
    if (expenseCtx) {
        if (window.expenseChartInstance) {
            window.expenseChartInstance.destroy();
        }

        window.expenseChartInstance = new Chart(expenseCtx, {
            type: 'doughnut',
            data: {
                labels: ['Expenses', 'Purchases', 'Tax'],
                datasets: [{
                    data: [stats.expenses, stats.purchases, stats.tax],
                    backgroundColor: ['#667eea', '#764ba2', '#f093fb']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function generateTrendData(total) {
    const data = [];
    for (let i = 0; i < 6; i++) {
        data.push(Math.round(total * (0.6 + Math.random() * 0.4) / 6));
    }
    return data;
}

// Journal Functions
function switchJournalTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

    if (tab === 'manual') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('manual-entry').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('smart-entry').classList.add('active');
    }
}

function addManualEntry(event) {
    event.preventDefault();

    const entry = {
        date: document.getElementById('manual-date').value,
        particulars: document.getElementById('manual-particulars').value,
        debit: document.getElementById('manual-debit').value || 0,
        credit: document.getElementById('manual-credit').value || 0,
        narration: document.getElementById('manual-narration').value
    };

    currentFirmData.journal.push(entry);
    firms[currentUser] = currentFirmData;
    localStorage.setItem('firms', JSON.stringify(firms));

    showAlert('Journal entry added successfully!');
    document.getElementById('manual-date').value = '';
    document.getElementById('manual-particulars').value = '';
    document.getElementById('manual-debit').value = '';
    document.getElementById('manual-credit').value = '';
    document.getElementById('manual-narration').value = '';

    loadJournalEntries();
}

function addSmartEntry(event) {
    event.preventDefault();

    const narration = document.getElementById('smart-narration').value.toLowerCase();
    const amount = parseFloat(document.getElementById('smart-amount').value);
    const date = document.getElementById('smart-date').value;

    let entry = {
        date: date,
        particulars: '',
        debit: 0,
        credit: 0,
        narration: document.getElementById('smart-narration').value
    };

    // AI-like parsing logic
    if (narration.includes('sold') || narration.includes('becha') || narration.includes('sale')) {
        entry.particulars = 'Cash A/c Dr.\n    To Sales A/c';
        entry.debit = amount;
        entry.credit = amount;
    } else if (narration.includes('purchase') || narration.includes('bought') || narration.includes('kharida')) {
        entry.particulars = 'Purchase A/c Dr.\n    To Cash A/c';
        entry.debit = amount;
        entry.credit = amount;
    } else if (narration.includes('expense') || narration.includes('paid') || narration.includes('payment')) {
        entry.particulars = 'Expense A/c Dr.\n    To Cash A/c';
        entry.debit = amount;
        entry.credit = amount;
    } else if (narration.includes('received') || narration.includes('mila')) {
        entry.particulars = 'Cash A/c Dr.\n    To Income A/c';
        entry.debit = amount;
        entry.credit = amount;
    } else {
        entry.particulars = 'Transaction A/c Dr.\n    To Cash A/c';
        entry.debit = amount;
        entry.credit = amount;
    }

    currentFirmData.journal.push(entry);
    firms[currentUser] = currentFirmData;
    localStorage.setItem('firms', JSON.stringify(firms));

    showAlert('Smart entry generated successfully!');
    document.getElementById('smart-date').value = '';
    document.getElementById('smart-amount').value = '';
    document.getElementById('smart-quantity').value = '';
    document.getElementById('smart-price').value = '';
    document.getElementById('smart-narration').value = '';

    loadJournalEntries();
}

function loadJournalEntries() {
    const tbody = document.getElementById('journal-tbody');
    tbody.innerHTML = '';

    const journal = currentFirmData.journal || [];
    journal.reverse().forEach(entry => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.particulars}</td>
            <td>₹${parseFloat(entry.debit).toLocaleString('en-IN')}</td>
            <td>₹${parseFloat(entry.credit).toLocaleString('en-IN')}</td>
            <td>${entry.narration}</td>
        `;
    });
}

// Inventory Functions
function showAddInventory() {
    document.getElementById('add-inventory-form').style.display = 'block';
}

function hideAddInventory() {
    document.getElementById('add-inventory-form').style.display = 'none';
}

function addInventoryItem(event) {
    event.preventDefault();

    const item = {
        name: document.getElementById('inv-name').value,
        supplier: document.getElementById('inv-supplier').value,
        invoice: document.getElementById('inv-invoice').value,
        purchaseCost: document.getElementById('inv-purchase-cost').value,
        salesPrice: document.getElementById('inv-sales-price').value,
        hsnCode: document.getElementById('inv-hsn').value,
        gst: document.getElementById('inv-gst').value,
        quantity: document.getElementById('inv-quantity').value
    };

    currentFirmData.inventory.push(item);
    firms[currentUser] = currentFirmData;
    localStorage.setItem('firms', JSON.stringify(firms));

    showAlert('Inventory item added successfully!');
    document.getElementById('inv-name').value = '';
    document.getElementById('inv-supplier').value = '';
    document.getElementById('inv-invoice').value = '';
    document.getElementById('inv-purchase-cost').value = '';
    document.getElementById('inv-sales-price').value = '';
    document.getElementById('inv-hsn').value = '';
    document.getElementById('inv-gst').value = '';
    document.getElementById('inv-quantity').value = '';

    hideAddInventory();
    loadInventory();
}

function loadInventory() {
    const tbody = document.getElementById('inventory-tbody');
    tbody.innerHTML = '';

    const inventory = currentFirmData.inventory || [];
    inventory.forEach((item, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.supplier}</td>
            <td>₹${parseFloat(item.purchaseCost).toLocaleString('en-IN')}</td>
            <td>₹${parseFloat(item.salesPrice).toLocaleString('en-IN')}</td>
            <td>${item.hsnCode}</td>
            <td>${item.gst}%</td>
            <td>${item.quantity}</td>
            <td>
                <button class="action-btn action-btn-delete" onclick="deleteInventoryItem(${index})">Delete</button>
            </td>
        `;
    });
}

function deleteInventoryItem(index) {
    if (confirm('Are you sure you want to delete this item?')) {
        currentFirmData.inventory.splice(index, 1);
        firms[currentUser] = currentFirmData;
        localStorage.setItem('firms', JSON.stringify(firms));
        loadInventory();
        showAlert('Item deleted successfully!');
    }
}

// Invoicing Functions
function showCreateInvoice() {
    document.getElementById('create-invoice-form').style.display = 'block';
    populateInventorySelect();
}

function hideCreateInvoice() {
    document.getElementById('create-invoice-form').style.display = 'none';
}

function populateInventorySelect() {
    const selects = document.querySelectorAll('.invoice-item-select');
    selects.forEach(select => {
        select.innerHTML = '<option value="">Select Item</option>';
        currentFirmData.inventory.forEach((item, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${item.name} - ₹${item.salesPrice}`;
            select.appendChild(option);
        });
    });
}

function addInvoiceItem() {
    const itemsDiv = document.getElementById('invoice-items');
    const newItem = document.createElement('div');
    newItem.className = 'invoice-item';
    newItem.innerHTML = `
        <select class="invoice-item-select" required>
            <option value="">Select Item</option>
        </select>
        <input type="number" class="invoice-item-qty" placeholder="Quantity" step="1" required>
        <button type="button" onclick="this.parentElement.remove()" class="btn-small">-</button>
    `;
    itemsDiv.appendChild(newItem);
    populateInventorySelect();
}

function createInvoice(event) {
    event.preventDefault();

    const customerName = document.getElementById('invoice-customer-name').value;
    const customerAddress = document.getElementById('invoice-customer-address').value;
    const customerGstin = document.getElementById('invoice-customer-gstin').value;
    const invoiceDate = document.getElementById('invoice-date').value;

    const items = [];
    let totalAmount = 0;

    document.querySelectorAll('.invoice-item').forEach(itemDiv => {
        const select = itemDiv.querySelector('.invoice-item-select');
        const qtyInput = itemDiv.querySelector('.invoice-item-qty');

        if (select.value && qtyInput.value) {
            const itemIndex = parseInt(select.value);
            const item = currentFirmData.inventory[itemIndex];
            const quantity = parseInt(qtyInput.value);
            const amount = parseFloat(item.salesPrice) * quantity;
            const gstAmount = amount * (parseFloat(item.gst) / 100);

            items.push({
                name: item.name,
                quantity: quantity,
                rate: item.salesPrice,
                gst: item.gst,
                amount: amount + gstAmount
            });

            totalAmount += amount + gstAmount;

            // Update inventory quantity
            currentFirmData.inventory[itemIndex].quantity -= quantity;
        }
    });

    const invoiceNumber = 'INV' + Date.now().toString().substr(-8);

    const invoice = {
        invoiceNumber: invoiceNumber,
        date: invoiceDate,
        customerName: customerName,
        customerAddress: customerAddress,
        customerGstin: customerGstin,
        items: items,
        totalAmount: totalAmount
    };

    currentFirmData.invoices.push(invoice);

    // Add to journal
    currentFirmData.journal.push({
        date: invoiceDate,
        particulars: `${customerName} A/c Dr.\n    To Sales A/c`,
        debit: totalAmount,
        credit: totalAmount,
        narration: `Invoice ${invoiceNumber} to ${customerName}`
    });

    firms[currentUser] = currentFirmData;
    localStorage.setItem('firms', JSON.stringify(firms));

    showAlert('Invoice created successfully!');

    // Display invoice
    displayInvoice(invoice);

    hideCreateInvoice();
    loadInvoices();
}

function displayInvoice(invoice) {
    const invoiceWindow = window.open('', '_blank');
    let itemsHtml = '';

    invoice.items.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${parseFloat(item.rate).toLocaleString('en-IN')}</td>
                <td>${item.gst}%</td>
                <td>₹${parseFloat(item.amount).toLocaleString('en-IN')}</td>
            </tr>
        `;
    });

    invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .invoice-header { text-align: center; margin-bottom: 30px; }
                .invoice-details { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background: #667eea; color: white; }
                .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="invoice-header">
                <h1>${currentFirmData.firmName}</h1>
                <p>${currentFirmData.address}</p>
                <p>GSTIN: ${currentFirmData.gstin}</p>
            </div>

            <div class="invoice-details">
                <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Date:</strong> ${invoice.date}</p>
                <p><strong>Customer:</strong> ${invoice.customerName}</p>
                <p><strong>Address:</strong> ${invoice.customerAddress}</p>
                ${invoice.customerGstin ? `<p><strong>GSTIN:</strong> ${invoice.customerGstin}</p>` : ''}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>GST</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="total">
                Total Amount: ₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')}
            </div>

            <script>window.print();</script>
        </body>
        </html>
    `);
}

function loadInvoices() {
    const tbody = document.getElementById('invoice-tbody');
    tbody.innerHTML = '';

    const invoices = currentFirmData.invoices || [];
    invoices.reverse().forEach((invoice, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.date}</td>
            <td>${invoice.customerName}</td>
            <td>₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')}</td>
            <td>
                <button class="action-btn action-btn-view" onclick="displayInvoice(${JSON.stringify(invoice).replace(/"/g, '&quot;')})">View</button>
            </td>
        `;
    });
}

// Reports Functions
function generateReport(reportType) {
    const output = document.getElementById('report-output');

    switch(reportType) {
        case 'ledger':
            output.innerHTML = generateLedger();
            break;
        case 'trial-balance':
            output.innerHTML = generateTrialBalance();
            break;
        case 'profit-loss':
            output.innerHTML = generateProfitLoss();
            break;
        case 'balance-sheet':
            output.innerHTML = generateBalanceSheet();
            break;
        case 'cash-flow':
            output.innerHTML = generateCashFlow();
            break;
        case 'gst-return':
            output.innerHTML = generateGSTReturn();
            break;
    }
}

function generateLedger() {
    const journal = currentFirmData.journal || [];
    let html = '<h3>General Ledger</h3><table><thead><tr><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th></tr></thead><tbody>';

    let totalDebit = 0;
    let totalCredit = 0;

    journal.forEach(entry => {
        html += `
            <tr>
                <td>${entry.date}</td>
                <td>${entry.particulars}</td>
                <td>₹${parseFloat(entry.debit).toLocaleString('en-IN')}</td>
                <td>₹${parseFloat(entry.credit).toLocaleString('en-IN')}</td>
            </tr>
        `;
        totalDebit += parseFloat(entry.debit);
        totalCredit += parseFloat(entry.credit);
    });

    html += `
        <tr style="font-weight: bold;">
            <td colspan="2">Total</td>
            <td>₹${totalDebit.toLocaleString('en-IN')}</td>
            <td>₹${totalCredit.toLocaleString('en-IN')}</td>
        </tr>
    </tbody></table>`;

    return html;
}

function generateTrialBalance() {
    const stats = calculateStats();
    return `
        <h3>Trial Balance</h3>
        <p>As of ${new Date().toLocaleDateString()}</p>
        <table>
            <thead>
                <tr>
                    <th>Account</th>
                    <th>Debit</th>
                    <th>Credit</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Sales Account</td>
                    <td></td>
                    <td>₹${stats.sales.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Purchase Account</td>
                    <td>₹${stats.purchases.toLocaleString('en-IN')}</td>
                    <td></td>
                </tr>
                <tr>
                    <td>Expense Account</td>
                    <td>₹${stats.expenses.toLocaleString('en-IN')}</td>
                    <td></td>
                </tr>
                <tr>
                    <td>Inventory Account</td>
                    <td>₹${stats.inventoryCost.toLocaleString('en-IN')}</td>
                    <td></td>
                </tr>
                <tr style="font-weight: bold;">
                    <td>Total</td>
                    <td>₹${(stats.purchases + stats.expenses + stats.inventoryCost).toLocaleString('en-IN')}</td>
                    <td>₹${stats.sales.toLocaleString('en-IN')}</td>
                </tr>
            </tbody>
        </table>
    `;
}

function generateProfitLoss() {
    const stats = calculateStats();
    const grossProfit = stats.sales - stats.purchases;
    const netProfit = stats.revenue;

    return `
        <h3>Profit & Loss Statement</h3>
        <p>For the period ending ${new Date().toLocaleDateString()}</p>
        <table>
            <tbody>
                <tr>
                    <td><strong>Sales</strong></td>
                    <td>₹${stats.sales.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Less: Purchases</td>
                    <td>₹${stats.purchases.toLocaleString('en-IN')}</td>
                </tr>
                <tr style="font-weight: bold;">
                    <td>Gross Profit</td>
                    <td>₹${grossProfit.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Less: Expenses</td>
                    <td>₹${stats.expenses.toLocaleString('en-IN')}</td>
                </tr>
                <tr style="font-weight: bold; color: #667eea;">
                    <td>Net Profit</td>
                    <td>₹${netProfit.toLocaleString('en-IN')}</td>
                </tr>
            </tbody>
        </table>
    `;
}

function generateBalanceSheet() {
    const stats = calculateStats();

    return `
        <h3>Balance Sheet</h3>
        <p>As of ${new Date().toLocaleDateString()}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h4>Liabilities</h4>
                <table>
                    <tbody>
                        <tr>
                            <td>Capital</td>
                            <td>₹${stats.capital.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td>Tax Payable</td>
                            <td>₹${stats.tax.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style="font-weight: bold;">
                            <td>Total</td>
                            <td>₹${(stats.capital + stats.tax).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div>
                <h4>Assets</h4>
                <table>
                    <tbody>
                        <tr>
                            <td>Cash</td>
                            <td>₹${stats.revenue.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td>Inventory</td>
                            <td>₹${stats.inventoryCost.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style="font-weight: bold;">
                            <td>Total</td>
                            <td>₹${(stats.revenue + stats.inventoryCost).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateCashFlow() {
    const stats = calculateStats();

    return `
        <h3>Cash Flow Statement</h3>
        <p>For the period ending ${new Date().toLocaleDateString()}</p>
        <table>
            <tbody>
                <tr>
                    <td colspan="2"><strong>Operating Activities</strong></td>
                </tr>
                <tr>
                    <td>Cash from Sales</td>
                    <td>₹${stats.sales.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>Cash for Purchases</td>
                    <td>(₹${stats.purchases.toLocaleString('en-IN')})</td>
                </tr>
                <tr>
                    <td>Cash for Expenses</td>
                    <td>(₹${stats.expenses.toLocaleString('en-IN')})</td>
                </tr>
                <tr style="font-weight: bold; color: #667eea;">
                    <td>Net Cash Flow</td>
                    <td>₹${stats.revenue.toLocaleString('en-IN')}</td>
                </tr>
            </tbody>
        </table>
    `;
}

function generateGSTReturn() {
    const stats = calculateStats();
    const gstOnSales = stats.sales * 0.18;
    const gstOnPurchases = stats.purchases * 0.18;
    const gstPayable = gstOnSales - gstOnPurchases;

    return `
        <h3>GST Return Summary</h3>
        <p>For the period ending ${new Date().toLocaleDateString()}</p>
        <p><strong>GSTIN:</strong> ${currentFirmData.gstin}</p>
        <table>
            <tbody>
                <tr>
                    <td colspan="2"><strong>Output GST (Sales)</strong></td>
                </tr>
                <tr>
                    <td>Taxable Value</td>
                    <td>₹${stats.sales.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>GST @ 18%</td>
                    <td>₹${gstOnSales.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td colspan="2"><strong>Input GST (Purchases)</strong></td>
                </tr>
                <tr>
                    <td>Taxable Value</td>
                    <td>₹${stats.purchases.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                    <td>GST @ 18%</td>
                    <td>₹${gstOnPurchases.toLocaleString('en-IN')}</td>
                </tr>
                <tr style="font-weight: bold; color: #667eea;">
                    <td>Net GST Payable</td>
                    <td>₹${gstPayable.toLocaleString('en-IN')}</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    firms = JSON.parse(localStorage.getItem('firms')) || {};
    showLogin();
});
