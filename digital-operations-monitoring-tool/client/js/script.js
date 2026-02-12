// Main Script for Digital Operations Monitoring Tool
document.addEventListener('DOMContentLoaded', () => {
    // Logic will correspond to the current page
    const path = window.location.pathname;

    // Check which page functionality to load
    if (path.includes('index.html') || path === '/') {
        initLanding();
    } else if (path.includes('login.html')) {
        initLogin();
    } else if (path.includes('signup.html')) {
        initSignup();
    } else if (path.includes('dashboard.html')) {
        initDashboard();
    }
});

// Implementations for each page's logic will be added here
function initLanding() {
    console.log('Landing page loaded');
    // Animation is handled by CSS
}

function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');

        // Simulated validation (hardcoded for now as per requirements)
        if (username === 'admin' && password === 'admin') {
            window.location.href = 'dashboard.html';
        } else {
            // Check simulator for wrong credentials
            errorMsg.textContent = "Wrong username or password";
            errorMsg.style.display = 'block';
        }
    });
}

function initSignup() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Simulate signup success
        alert('Signup successful! Redirecting to login...');
        window.location.href = 'login.html';
    });
}

// Dashboard Data Storage (InMemory)
let products = [
    { name: 'Widget A', quantity: 150, date: '2023-10-25', status: 'Completed' },
    { name: 'Widget B', quantity: 50, date: '2023-10-26', status: 'Pending' },
    { name: 'Gadget X', quantity: 200, date: '2023-10-27', status: 'Completed' }
];

let chartInstance = null;

function initDashboard() {
    renderTable(products);
    initChart(products);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    // Add Product
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('prodName').value;
            const quantity = parseInt(document.getElementById('prodQty').value);
            const date = document.getElementById('prodDate').value;
            const status = document.getElementById('prodStatus').value;

            products.push({ name, quantity, date, status });

            // Refresh UI
            renderTable(products);
            updateChart(products);
            addProductForm.reset();
        });
    }

    // Date Filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            if (!selectedDate) {
                renderTable(products); // Show all
            } else {
                const filtered = products.filter(p => p.date === selectedDate);
                renderTable(filtered);
            }
        });
    }
}

function renderTable(data) {
    const tbody = document.getElementById('stockTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.date}</td>
            <td>${item.status}</td>
        `;
        tbody.appendChild(row);
    });
}

function initChart(data) {
    const ctx = document.getElementById('opsChart');
    if (!ctx) return;

    const completed = data.filter(p => p.status === 'Completed').length;
    const pending = data.filter(p => p.status === 'Pending').length;

    // Destroy existing if needed (though init runs once usually)
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: ['#28a745', '#ffc107'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'white' }
                }
            }
        }
    });
}

function updateChart(data) {
    if (!chartInstance) return;

    const completed = data.filter(p => p.status === 'Completed').length;
    const pending = data.filter(p => p.status === 'Pending').length;

    chartInstance.data.datasets[0].data = [completed, pending];
    chartInstance.update();
}
