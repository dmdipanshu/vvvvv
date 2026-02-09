// --- GLOBAL ERROR HANDLER ---
window.onerror = function (msg, url, line, col, error) {
  alert("Error: " + msg + "\nLine: " + line + "\nCol: " + col);
  return false;
};

// --- DOM ELEMENTS ---
const viewHome = document.getElementById('view-home');
const viewBook = document.getElementById('view-book');
const viewProfile = document.getElementById('view-profile');
const viewStats = document.getElementById('view-stats');
const booksListEl = document.getElementById('books-list');
const fabAddBook = document.getElementById('fab-add-book');
const backToHomeBtn = document.getElementById('back-to-home');
const backFromProfileBtn = document.getElementById('back-from-profile');
const backFromStatsBtn = document.getElementById('back-from-stats');
const statsBtn = document.getElementById('stats-btn');

// Search Elements
// Search Elements
const searchWrapper = document.getElementById('search-wrapper');
const bookSearchInput = document.getElementById('book-search-input');
const searchToggleBtn = document.getElementById('search-toggle-btn');
const searchInput = document.getElementById('search-input');

// Business Switcher Elements
const businessSelectorBtn = document.getElementById('business-selector-btn');
const currentBusinessNameEl = document.getElementById('current-business-name');
const businessModal = document.getElementById('business-modal');
const closeBusinessModal = document.getElementById('close-business-modal');
const businessListEl = document.getElementById('business-list');
const addBusinessBtn = document.getElementById('add-business-btn');

// Book Detail Elements
const bookNameDisplay = document.getElementById('book-name-display');
const balanceEl = document.getElementById('balance');
const money_plusEl = document.getElementById('money-plus');
const money_minusEl = document.getElementById('money-minus');
const listContainer = document.getElementById('list-container');
const emptyState = document.getElementById('empty-state');
const entryCountEl = document.getElementById('entry-count');

// Transaction Modal Elements
const transactionModal = document.getElementById('transaction-modal');
const btnCashIn = document.getElementById('btn-cash-in');
const btnCashOut = document.getElementById('btn-cash-out');
const closeTransactionModal = document.getElementById('close-transaction-modal');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const paymentMode = document.getElementById('payment-mode');
const transactionTypeEl = document.getElementById('transaction-type');
const addCategoryBtn = document.getElementById('add-category-btn');

// Report Modal Elements
const reportModal = document.getElementById('report-modal');
const openReportModalBtn = document.getElementById('open-report-modal');
const closeReportModalBtn = document.getElementById('close-report-modal');
const generatePdfBtn = document.getElementById('generate-pdf-btn');
const generateExcelBtn = document.getElementById('generate-excel-btn');

// Filters
const dateRangeBtn = document.getElementById('date-range-btn');
const dateRangeDropdown = document.getElementById('date-range-dropdown');
const customDateRange = document.getElementById('custom-date-range');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const typeFilterBtn = document.getElementById('type-filter-btn');
const typeDropdown = document.getElementById('type-dropdown');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// Profile Elements
const profileNameInput = document.getElementById('profile-name');
const profileMobileInput = document.getElementById('profile-mobile');
const profileEmailInput = document.getElementById('profile-email');
const saveProfileBtn = document.getElementById('save-profile-btn');
const navSettings = document.getElementById('nav-settings');
const navCashbooks = document.getElementById('nav-cashbooks');

// Auth Elements
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authTitle = document.getElementById('auth-title');
const authSwitchText = document.getElementById('auth-switch-text');

// Category Manager Elements
const categoryModal = document.getElementById('category-modal');
const closeCategoryModal = document.getElementById('close-category-modal');
const manageCategoryBtn = document.getElementById('manage-category-btn');
const categoryListEl = document.getElementById('category-list');

// --- STATE MANAGEMENT ---
let books = [];
let currentBookId = null;
let categories = [];
let businesses = [];
let currentBusiness = '';
let profile = { name: '', mobile: '', email: '' };
let searchQuery = '';
let authToken = localStorage.getItem('auth_token');
let isLoginMode = true;
let editingTransactionId = null;

// Filter State
let currentFilters = {
  date: 'this_month',
  type: 'all'
};

// --- API INTEGRATION ---
// --- API INTEGRATION ---
// Smart API URL: Use localhost:5001 if on Live Server (Port 5500), otherwise use relative path (Production)
const API_URL = (window.location.port === '5500') ? 'http://localhost:5001/api' : '/api';
console.log('API Endpoint:', API_URL);

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
  loadingOverlay.classList.add('show');
}

function hideLoading() {
  loadingOverlay.classList.remove('show');
}

async function fetchData() {
  // 1. Try to load from Local Cache first (Instant Load)
  const cachedData = localStorage.getItem('cashbook_data');
  if (cachedData) {
    console.log('Loading from cache...');
    const data = JSON.parse(cachedData);
    localStorage.setItem('cashbook_data', JSON.stringify(data));

    // Update UI with fresh data
    applyData(data);
  } else {
    showLoading(); // Only show loader if no cache
  }

  try {
    // 2. Fetch from Server (Background Update)
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;

    const res = await fetch(`${API_URL}/data`, { headers });
    if (res.status === 401) {
      logout();
      return;
    }
    const data = await res.json();

    console.log('Fetched Data from Server:', data);

    // Update Cache
    localStorage.setItem('cashbook_data', JSON.stringify(data));

    // Update UI with fresh data
    applyData(data);
  } catch (err) {
    console.error('Error fetching data:', err);
    // If no cache and server fails, show error
    if (!cachedData) {
      alert('Failed to load data from server. Please ensure the server is running.');
    }
  } finally {
    hideLoading();
  }
}

function applyData(data) {
  books = data.books || [];
  businesses = data.businesses || ['October', 'September', 'Personal'];
  categories = data.categories || ['Food', 'Travel', 'Shopping', 'Bills', 'Others'];
  categoryBudgets = data.categoryBudgets || {};
  currentBusiness = data.currentBusiness || 'October';
  profile = data.profile || { name: '', mobile: '', email: '' };

  updateBusinessUI();
  renderBooksList();
  updateCategoryDropdown();
  updateProfileUI();
}

async function syncData() {
  // 1. Update Local Cache immediately (Optimistic UI)
  const dataToSave = {
    books,
    businesses,
    categories,
    categoryBudgets,
    currentBusiness,
    profile
  };
  localStorage.setItem('cashbook_data', JSON.stringify(dataToSave));

  // 2. Sync with Server
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;

    const res = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(dataToSave)
    });

    if (!res.ok) throw new Error('Server responded with ' + res.status);
    console.log('Data synced successfully');

  } catch (err) {
    console.error('CRITICAL SYNC ERROR:', err);
    let msg = err.message;
    if (msg.includes('Failed to fetch')) {
      msg = 'Server is unreachable!\n1. Is the server running? (node server.js)\n2. Is it on Port 5001?';
    }
    alert('CRITICAL ERROR: Data NOT saved!\n\n' + msg);
  }
}

function saveProfile() {
  profile.name = profileNameInput.value;
  profile.mobile = profileMobileInput.value;
  profile.email = profileEmailInput.value;

  syncData();
  alert('Profile saved successfully!');
}

function logout() {
  localStorage.removeItem('auth_token');
  authToken = null;
  location.reload();
}

// --- AUTH FUNCTIONS ---
function showAuthModal() {
  authModal.classList.add('show');
}

function toggleAuthMode(e) {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  if (isLoginMode) {
    authTitle.innerText = 'Login';
    authSubmitBtn.innerText = 'Login';
    authSwitchText.innerText = "Don't have an account?";
    authSwitchBtn.innerText = 'Register';
  } else {
    authTitle.innerText = 'Register';
    authSubmitBtn.innerText = 'Register';
    authSwitchText.innerText = "Already have an account?";
    authSwitchBtn.innerText = 'Login';
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = authUsernameInput.value;
  const password = authPasswordInput.value;
  const endpoint = isLoginMode ? '/login' : '/register';

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      authToken = data.token;
      localStorage.setItem('auth_token', authToken);
      authModal.classList.remove('show');
      await fetchData();
    } else {
      alert(data.msg || 'Authentication failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
}

// --- VIEW NAVIGATION ---
function showHomeView(pushHistory = true) {
  if (pushHistory) history.pushState({ view: 'home' }, '', '');
  viewBook.classList.remove('active');
  viewProfile.classList.remove('active');
  viewStats.classList.remove('active');
  viewHome.classList.add('active');

  navCashbooks.classList.add('active');
  navSettings.classList.remove('active');
  navCashbooks.style.color = 'var(--primary-color)';
  navSettings.style.color = 'var(--text-secondary)';

  currentBookId = null;
  renderBooksList();
}

function showBookView(bookId, pushHistory = true) {
  currentBookId = bookId;
  if (pushHistory) history.pushState({ view: 'book', id: bookId }, '', '');
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  bookNameDisplay.innerText = book.name;
  viewHome.classList.remove('active');
  viewProfile.classList.remove('active');
  viewStats.classList.remove('active');
  viewBook.classList.add('active');

  resetFilters();
  renderTransactions();
  updateValues();
}

function showProfileView(pushHistory = true) {
  if (pushHistory) history.pushState({ view: 'profile' }, '', '');
  viewHome.classList.remove('active');
  viewBook.classList.remove('active');
  viewProfile.classList.add('active');
  viewStats.classList.remove('active');

  navSettings.classList.add('active');
  navCashbooks.classList.remove('active');
  navSettings.style.color = 'var(--primary-color)';
  navCashbooks.style.color = 'var(--text-secondary)';

  updateProfileUI();
}

function updateProfileUI() {
  if (profileNameInput) profileNameInput.value = profile.name || '';
  if (profileMobileInput) profileMobileInput.value = profile.mobile || '';
  if (profileEmailInput) profileEmailInput.value = profile.email || '';
}

function showStatsView(pushHistory = true) {
  if (pushHistory) history.pushState({ view: 'stats' }, '', '');
  viewBook.classList.remove('active');
  viewHome.classList.remove('active');
  viewProfile.classList.remove('active');
  viewStats.classList.add('active');

  // Deactivate navs
  navCashbooks.classList.remove('active');
  navSettings.classList.remove('active');
  navCashbooks.style.color = 'var(--text-secondary)';
  navSettings.style.color = 'var(--text-secondary)';

  renderStats();
}

// --- BUSINESS MANAGEMENT ---
function updateBusinessUI() {
  currentBusinessNameEl.innerText = currentBusiness;
}

function renderBusinessList() {
  businessListEl.innerHTML = '';
  businesses.forEach(bus => {
    const item = document.createElement('div');
    item.classList.add('dropdown-item');
    item.style.padding = '16px';
    item.style.borderBottom = '1px solid var(--border-color)';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';

    const nameSpan = document.createElement('span');
    nameSpan.innerText = bus;
    nameSpan.style.flex = '1';
    nameSpan.style.cursor = 'pointer';
    nameSpan.onclick = () => {
      currentBusiness = bus;
      syncData(); // Save selection
      updateBusinessUI();
      businessModal.classList.remove('show');
      renderBooksList();
    };

    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '12px';

    if (bus === currentBusiness) {
      actionsDiv.innerHTML = '<i class="fa-solid fa-check" style="color: var(--success-color);"></i>';
    }

    const editBtn = document.createElement('i');
    editBtn.className = 'fa-solid fa-pen';
    editBtn.style.color = 'var(--text-secondary)';
    editBtn.style.cursor = 'pointer';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      renameBusiness(bus);
    };

    const deleteBtn = document.createElement('i');
    deleteBtn.className = 'fa-solid fa-trash';
    deleteBtn.style.color = 'var(--danger-color)';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteBusiness(bus);
    };

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    item.appendChild(nameSpan);
    item.appendChild(actionsDiv);

    businessListEl.appendChild(item);
  });
}

function addNewBusiness() {
  const name = prompt("Enter new business name:");
  if (name && name.trim()) {
    const newBus = name.trim();
    if (!businesses.includes(newBus)) {
      businesses.push(newBus);
      syncData();
      renderBusinessList();
    }
  }
}

function renameBusiness(oldName) {
  const newName = prompt("Rename business:", oldName);
  if (newName && newName.trim() && newName !== oldName) {
    const index = businesses.indexOf(oldName);
    if (index !== -1) {
      businesses[index] = newName.trim();

      // Update books associated with this business
      books.forEach(book => {
        if (book.business === oldName) {
          book.business = newName.trim();
        }
      });

      if (currentBusiness === oldName) {
        currentBusiness = newName.trim();
        updateBusinessUI();
      }
      syncData();
      renderBusinessList();
      renderBooksList();
    }
  }
}

function deleteBusiness(name) {
  if (confirm(`Are you sure you want to delete "${name}"? This will hide its books.`)) {
    businesses = businesses.filter(b => b !== name);

    if (currentBusiness === name) {
      currentBusiness = businesses[0] || 'Default';
      updateBusinessUI();
    }
    syncData();
    renderBusinessList();
    renderBooksList();
  }
}

// --- BOOKS MANAGEMENT ---
function renderBooksList() {
  booksListEl.innerHTML = '';

  // Filter by Business AND Search Query
  const filteredBooks = books.filter(b => {
    const matchesBusiness = (b.business || 'October') === currentBusiness;
    const matchesSearch = b.name.toLowerCase().includes(searchQuery);
    return matchesBusiness && matchesSearch;
  });

  if (filteredBooks.length === 0) {
    booksListEl.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No books found</div>';
    return;
  }

  filteredBooks.forEach(book => {
    const balance = calculateBalance(book.transactions);
    const lastUpdated = new Date(book.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const card = document.createElement('div');
    card.classList.add('book-card');
    card.onclick = () => showBookView(book.id);

    const balanceClass = balance < 0 ? 'negative' : 'positive';

    card.innerHTML = `
            <div class="book-icon">
                <i class="fa-solid fa-book"></i>
            </div>
            <div class="book-details">
                <div class="book-title" style="text-transform: capitalize;">${escapeHtml(book.name)}</div>
                <div class="book-meta">Updated on ${lastUpdated}</div>
            </div>
            <div class="book-balance ${balanceClass}">
                ${formatCurrency(balance)}
            </div>
            <div class="book-actions" style="display: flex; gap: 10px; margin-left: 10px;">
                <div class="book-edit" onclick="event.stopPropagation(); editBook(${book.id})">
                    <i class="fa-solid fa-pen" style="color: var(--text-secondary);"></i>
                </div>
                <div class="book-menu" onclick="event.stopPropagation(); showBookMenu(${book.id})">
                    <i class="fa-solid fa-trash" style="color: var(--danger-color);"></i>
                </div>
            </div>
        `;
    booksListEl.appendChild(card);
  });
}

// Helper: Currency Formatter
const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace(/^(\D+)(-\d+)/, '$1 $2'); // Ensure space if needed
  } catch (e) {
    return '₹' + amount;
  }
};

// Helper: Escape HTML (XSS Protection)
const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

function addNewBook() {
  const name = prompt("Enter new book name:");
  if (name && name.trim()) {
    const newBook = {
      id: Date.now(),
      name: name.trim(),
      transactions: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      business: currentBusiness
    };
    books.push(newBook);
    syncData();
    renderBooksList();
  } else if (name !== null) {
    alert("Book name cannot be empty.");
  }
}

function editBook(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  const newName = prompt("Enter new book name:", book.name);
  if (newName && newName.trim() && newName !== book.name) {
    book.name = newName.trim();
    book.updated = new Date().toISOString();
    syncData();
    renderBooksList();
  }
}

function showBookMenu(bookId) {
  const action = confirm("Do you want to delete this book? This action cannot be undone.");
  if (action) {
    books = books.filter(b => b.id !== bookId);
    syncData();
    renderBooksList();
  }
}

function calculateBalance(txs) {
  return txs.reduce((acc, t) => acc + t.amount, 0);
}

// --- TRANSACTION LOGIC ---
function getFilteredTransactions(book) {
  return book.transactions.filter(t => {
    let matchesDate = true;
    let matchesType = true;

    if (currentFilters.date) {
      const tDate = new Date(t.timestamp || t.date);
      const fDate = new Date(currentFilters.date);
      matchesDate = tDate.getDate() === fDate.getDate() &&
        tDate.getMonth() === fDate.getMonth() &&
        tDate.getFullYear() === fDate.getFullYear();
    }

    if (currentFilters.type !== 'all') {
      if (currentFilters.type === 'income') matchesType = t.amount > 0;
      if (currentFilters.type === 'expense') matchesType = t.amount < 0;
    }

    return matchesDate && matchesType;
  });
}

function renderTransactions() {
  const book = books.find(b => b.id === currentBookId);
  if (!book) return;

  listContainer.innerHTML = '';

  const filteredTransactions = getFilteredTransactions(book);

  if (filteredTransactions.length === 0) {
    emptyState.style.display = 'block';
    entryCountEl.innerText = '0';
    return;
  } else {
    emptyState.style.display = 'none';
  }

  const sortedTransactions = [...filteredTransactions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  entryCountEl.innerText = sortedTransactions.length;

  // Calculate Running Balance
  const allSortedAsc = [...book.transactions].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  let runningBal = 0;
  const balanceMap = {};
  allSortedAsc.forEach(t => {
    runningBal += t.amount;
    balanceMap[t.id] = runningBal;
  });

  const grouped = {};
  sortedTransactions.forEach(transaction => {
    const dateKey = transaction.date || 'Unknown Date';
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(transaction);
  });

  Object.keys(grouped).forEach(date => {
    const dateHeader = document.createElement('div');
    dateHeader.classList.add('date-header');
    dateHeader.innerText = date;
    listContainer.appendChild(dateHeader);

    grouped[date].forEach(transaction => {
      const item = document.createElement('div');
      item.classList.add('transaction-item');

      const amountClass = transaction.amount < 0 ? 'minus' : 'plus';
      const categoryVal = transaction.category || 'Others';
      const iconClass = categoryVal.toLowerCase().replace(/\s+/g, '-');
      let icon = 'fa-bag-shopping';
      // Map common categories to icons
      const iconMap = {
        'food': 'fa-utensils',
        'travel': 'fa-plane',
        'bills': 'fa-file-invoice-dollar',
        'others': 'fa-circle-question',
        'shopping': 'fa-bag-shopping',
        'salary': 'fa-money-bill-wave'
      };

      icon = iconMap[Object.keys(iconMap).find(k => iconClass.includes(k))] || 'fa-tag';

      item.setAttribute('onclick', 'toggleTransaction(this)');

      item.innerHTML = `
                <div class="t-left" style="pointer-events: none;">
                    <div class="t-icon ${iconClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="t-details">
                        <div class="t-tags">
                            <span class="tag">${escapeHtml(categoryVal)}</span>
                            <span class="tag">${escapeHtml(transaction.paymentMode || 'Cash')}</span>
                        </div>
                        <div class="t-desc">${escapeHtml(transaction.text)}</div>
                        <div class="t-meta">Entry by You ${transaction.time ? 'at ' + transaction.time : ''}</div>
                    </div>
                </div>
                <div class="t-right" style="pointer-events: none;">
                    <div class="t-amount money ${amountClass}">${formatCurrency(Math.abs(transaction.amount))}</div>
                    <div class="t-balance">Balance: ${formatCurrency(balanceMap[transaction.id])}</div>
                    <div style="font-size: 10px; color: var(--text-secondary); margin-top: 4px;">Tap for options <i class="fa-solid fa-chevron-down"></i></div>
                </div>
                
                <!-- Hidden Action Bar -->
                <div class="transaction-actions">
                    <div class="action-btn-row edit-action" onclick="event.stopPropagation(); editTransaction(${transaction.id})">
                        <i class="fa-solid fa-pen"></i> Edit
                    </div>
                    <div class="action-btn-row delete-action" onclick="event.stopPropagation(); deleteTransaction(${transaction.id})">
                        <i class="fa-solid fa-trash"></i> Delete
                    </div>
                </div>
            `;
      listContainer.appendChild(item);
    });
  });
}

// Toggle Transaction Expansion
function toggleTransaction(element) {
  // Close others
  document.querySelectorAll('.transaction-item.expanded').forEach(item => {
    if (item !== element) item.classList.remove('expanded');
  });
  element.classList.toggle('expanded');
}

function updateValues() {
  const book = books.find(b => b.id === currentBookId);
  if (!book) return;

  const amounts = book.transactions.map(t => t.amount);
  const total = amounts.reduce((acc, item) => acc + item, 0);
  const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0);
  const expense = amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1;

  balanceEl.innerText = formatCurrency(total);
  money_plusEl.innerText = formatCurrency(income);
  money_minusEl.innerText = formatCurrency(expense);
}

function addTransaction(e) {
  e.preventDefault();
  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a description and amount');
    return;
  }

  const type = transactionTypeEl.value;
  const amountValue = +amount.value;
  const finalAmount = type === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue);

  const book = books.find(b => b.id === currentBookId);
  if (!book) return;

  if (editingTransactionId) {
    // UPDATE EXISTING TRANSACTION
    const transactionIndex = book.transactions.findIndex(t => t.id === editingTransactionId);
    if (transactionIndex > -1) {
      book.transactions[transactionIndex] = {
        ...book.transactions[transactionIndex],
        text: text.value,
        amount: finalAmount,
        category: category.value,
        paymentMode: paymentMode.value,
        // Keep original date/time
      };
    }
    editingTransactionId = null;
  } else {
    // ADD NEW TRANSACTION
    const transaction = {
      id: Math.floor(Math.random() * 100000000),
      text: text.value,
      amount: finalAmount,
      category: category.value,
      paymentMode: paymentMode.value,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      timestamp: new Date().getTime()
    };
    book.transactions.push(transaction);
  }

  book.updated = new Date().toISOString();

  syncData();
  renderTransactions();
  updateValues();

  text.value = '';
  amount.value = '';
  transactionModal.classList.remove('show');
}

function editTransaction(id) {
  const book = books.find(b => b.id === currentBookId);
  const transaction = book.transactions.find(t => t.id === id);
  if (!transaction) return;

  editingTransactionId = id;

  // Pre-fill form
  text.value = transaction.text;
  amount.value = Math.abs(transaction.amount);
  category.value = transaction.category || 'Others';
  paymentMode.value = transaction.paymentMode || 'Cash';

  // Determine type
  const type = transaction.amount >= 0 ? 'income' : 'expense';
  openTransactionModal(type);
}

function deleteTransaction(id) {
  if (!confirm("Are you sure you want to delete this entry?")) return;
  const book = books.find(b => b.id === currentBookId);
  if (!book) return;

  book.transactions = book.transactions.filter(t => t.id !== id);
  book.updated = new Date().toISOString();
  syncData();
  renderTransactions();
  updateValues();
}

function openTransactionModal(type) {
  transactionModal.classList.add('show');
  transactionTypeEl.value = type;
  const modalTitle = document.getElementById('modal-title');
  const submitBtn = document.getElementById('submit-btn');

  if (type === 'income') {
    modalTitle.innerText = editingTransactionId ? 'Edit Income' : 'Cash In';
    submitBtn.innerText = editingTransactionId ? 'Update' : 'Add Transaction';
    submitBtn.style.backgroundColor = 'var(--success-color)';
  } else {
    modalTitle.innerText = editingTransactionId ? 'Edit Expense' : 'Cash Out';
    submitBtn.innerText = editingTransactionId ? 'Update' : 'Add Transaction';
    submitBtn.style.backgroundColor = 'var(--danger-color)';
  }
  text.focus();
}

// --- CATEGORIES ---
function updateCategoryDropdown() {
  category.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function addNewCategory() {
  const newCat = prompt('Enter new category name:');
  if (newCat && newCat.trim() !== '') {
    const formattedCat = newCat.trim();
    if (!categories.includes(formattedCat)) {
      categories.push(formattedCat);
      syncData();
      updateCategoryDropdown();
      category.value = formattedCat;
    }
  }
}

function renderCategoryManager() {
  categoryListEl.innerHTML = '';
  categories.forEach(cat => {
    const item = document.createElement('div');
    item.classList.add('dropdown-item');
    item.style.padding = '16px';
    item.style.borderBottom = '1px solid var(--border-color)';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';

    const nameSpan = document.createElement('span');
    nameSpan.innerText = cat;
    nameSpan.style.flex = '1';

    const budgetContainer = document.createElement('div');
    budgetContainer.style.display = 'flex';
    budgetContainer.style.alignItems = 'center';
    budgetContainer.style.gap = '8px';
    budgetContainer.style.marginRight = '12px';

    const budgetInput = document.createElement('input');
    budgetInput.type = 'number';
    budgetInput.placeholder = 'Budget';
    budgetInput.value = categoryBudgets[cat] || '';
    budgetInput.style.width = '80px';
    budgetInput.style.padding = '4px';
    budgetInput.style.border = '1px solid var(--border-color)';
    budgetInput.style.borderRadius = '4px';

    budgetInput.onchange = (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val > 0) {
        categoryBudgets[cat] = val;
      } else {
        delete categoryBudgets[cat];
      }
      syncData();
    };

    budgetContainer.appendChild(budgetInput);

    const actionsDiv = document.createElement('div');
    actionsDiv.style.display = 'flex';
    actionsDiv.style.gap = '12px';

    const editBtn = document.createElement('i');
    editBtn.className = 'fa-solid fa-pen';
    editBtn.style.color = 'var(--text-secondary)';
    editBtn.style.cursor = 'pointer';
    editBtn.onclick = () => renameCategory(cat);

    const deleteBtn = document.createElement('i');
    deleteBtn.className = 'fa-solid fa-trash';
    deleteBtn.style.color = 'var(--danger-color)';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.onclick = () => deleteCategory(cat);

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    item.appendChild(nameSpan);
    item.appendChild(budgetContainer);
    item.appendChild(actionsDiv);

    categoryListEl.appendChild(item);
  });
}

function renameCategory(oldName) {
  const newName = prompt("Rename category:", oldName);
  if (newName && newName.trim() && newName !== oldName) {
    const formattedName = newName.trim();
    const index = categories.indexOf(oldName);
    if (index !== -1) {
      categories[index] = formattedName;

      // Update ALL transactions in ALL books
      books.forEach(book => {
        book.transactions.forEach(t => {
          if (t.category === oldName) {
            t.category = formattedName;
          }
        });
      });

      syncData();
      updateCategoryDropdown();
      category.value = formattedName; // Select new name if adding txn
      renderCategoryManager();
      renderTransactions(); // Refresh list if filtered/viewing
    }
  }
}

function deleteCategory(name) {
  if (confirm(`Delete "${name}" category? Transactions will be kept but marked as 'Others'.`)) {
    categories = categories.filter(c => c !== name);
    // Remove budget for deleted category
    if (categoryBudgets[name]) delete categoryBudgets[name];

    // Update transactions to 'Others' or keep old name? 
    // Usually better to keep historical data or move to 'Others'.
    // Let's move to 'Others' to keep integrity.
    books.forEach(book => {
      book.transactions.forEach(t => {
        if (t.category === name) {
          t.category = 'Others';
        }
      });
    });

    syncData();
    updateCategoryDropdown();
    renderCategoryManager();
    renderTransactions();
  }
}

// --- STATISTICS & BUDGET ---
let pieChartInstance = null;
let barChartInstance = null;

function renderStats() {
  const book = books.find(b => b.id === currentBookId);
  if (!book) return;

  const transactions = getFilteredTransactions(book);

  // 1. Calculations
  let totalIncome = 0;
  let totalExpense = 0;
  const categorySpending = {};

  transactions.forEach(t => {
    if (t.amount > 0) {
      totalIncome += t.amount;
    } else {
      const expense = Math.abs(t.amount);
      totalExpense += expense;
      const cat = t.category || 'Others';
      categorySpending[cat] = (categorySpending[cat] || 0) + expense;
    }
  });

  // 2. Render Pie Chart (Income vs Expense)
  const ctxPie = document.getElementById('pie-chart').getContext('2d');
  if (pieChartInstance) pieChartInstance.destroy();

  pieChartInstance = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [totalIncome, totalExpense],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });

  // 3. Render Bar Chart (Category Spending)
  const ctxBar = document.getElementById('bar-chart').getContext('2d');
  if (barChartInstance) barChartInstance.destroy();

  const catLabels = Object.keys(categorySpending);
  const catData = Object.values(categorySpending);

  barChartInstance = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: catLabels,
      datasets: [{
        label: 'Spending',
        data: catData,
        backgroundColor: '#3498db',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              return ' ₹' + context.parsed.y;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // 4. Render Budget Progress
  const budgetContainer = document.getElementById('budget-progress-container');
  budgetContainer.innerHTML = '';

  const budgetKeys = Object.keys(categoryBudgets);
  if (budgetKeys.length === 0) {
    budgetContainer.innerHTML = '<p class="empty-state">Set budgets in "Category Settings" to see progress here.</p>';
  } else {
    budgetKeys.forEach(cat => {
      const budget = categoryBudgets[cat];
      const spent = categorySpending[cat] || 0;
      const percent = Math.min((spent / budget) * 100, 100);
      const isOver = spent > budget;
      const color = isOver ? 'var(--danger-color)' : 'var(--success-color)';

      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '12px';
      wrapper.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 14px; marginBottom: 4px;">
            <span>${cat}</span>
            <span>${Math.round(spent)} / ${budget}</span>
        </div>
        <div style="height: 8px; background: var(--bg-color); border-radius: 4px; overflow: hidden;">
            <div style="width: ${percent}%; height: 100%; background: ${color}; transition: width 0.3s;"></div>
        </div>
        ${isOver ? '<div style="color: var(--danger-color); font-size: 12px; margin-top: 2px;">Over Budget!</div>' : ''}
      `;
      budgetContainer.appendChild(wrapper);
    });
  }
}

// --- FILTERS ---
function setupFilters() {
  // DATE FILTER DROPDOWN
  // DATE FILTER DROPDOWN
  dateRangeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dateRangeDropdown.classList.toggle('show');
    // typeDropdown removed
  });

  document.querySelectorAll('#date-range-dropdown .dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const value = e.target.dataset.value;
      currentFilters.date = value; // Update state directly

      // Update Button Text
      dateRangeBtn.innerHTML = `${e.target.innerText} <i class="fa-solid fa-caret-down"></i>`;

      if (value === 'custom') {
        customDateRange.style.display = 'flex';
        const today = new Date().toISOString().split('T')[0];
        if (!startDateInput.value) startDateInput.value = today;
        if (!endDateInput.value) endDateInput.value = today;
      } else {
        customDateRange.style.display = 'none';
        renderTransactions();
      }

      dateRangeBtn.classList.toggle('active', value !== 'all');
    });
  });

  if (startDateInput) startDateInput.addEventListener('change', renderTransactions);
  if (endDateInput) endDateInput.addEventListener('change', renderTransactions);

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }

  window.addEventListener('click', (e) => {
    if (dateRangeDropdown && !dateRangeBtn.contains(e.target) && !dateRangeDropdown.contains(e.target)) {
      dateRangeDropdown.classList.remove('show');
    }
  });
}

function resetFilters() {
  currentFilters = { date: 'this_month', type: 'all' };

  // Reset Date Filter UI
  if (dateRangeBtn) {
    dateRangeBtn.innerHTML = `This Month <i class="fa-solid fa-caret-down"></i>`;
    dateRangeBtn.classList.remove('active');
  }
  if (customDateRange) customDateRange.style.display = 'none';
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';

  renderTransactions();
}

function getFilteredTransactions(book) {
  let filtered = book.transactions;

  // 1. Search Filter
  if (searchQuery) {
    filtered = filtered.filter(t => t.text.toLowerCase().includes(searchQuery));
  }

  // 2. Type Filter
  if (currentFilters.type !== 'all') {
    if (currentFilters.type === 'income') {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (currentFilters.type === 'expense') {
      filtered = filtered.filter(t => t.amount < 0);
    }
  }

  // 3. Date Range Filter
  const range = currentFilters.date;
  if (range && range !== 'all') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filtered = filtered.filter(t => {
      const tDate = new Date(t.date);
      tDate.setHours(0, 0, 0, 0);

      switch (range) {
        case 'today':
          return tDate.getTime() === today.getTime();
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return tDate.getTime() === yesterday.getTime();
        case 'this_week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start
          return tDate >= startOfWeek;
        case 'last_week':
          const endLastWeek = new Date(today);
          endLastWeek.setDate(today.getDate() - today.getDay() - 1);
          const startLastWeek = new Date(endLastWeek);
          startLastWeek.setDate(endLastWeek.getDate() - 6);
          return tDate >= startLastWeek && tDate <= endLastWeek;
        case 'this_month':
          return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        case 'last_month':
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          return tDate.getMonth() === lastMonth.getMonth() && tDate.getFullYear() === lastMonth.getFullYear();
        case 'custom':
          if (startDateInput.value && endDateInput.value) {
            const start = new Date(startDateInput.value);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDateInput.value);
            end.setHours(23, 59, 59, 999);
            return tDate >= start && tDate <= end;
          }
          return true;
        default:
          return true;
      }
    });
  }

  return filtered;
}

// --- REPORTS ---
function generatePDF() {
  const book = books.find(b => b.id === currentBookId);
  if (!book) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const reportType = document.querySelector('input[name="report-type"]:checked').value;

  doc.setFontSize(18);
  doc.text(book.name, 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} (${reportType.toUpperCase()} Report)`, 14, 30);

  const filteredTransactions = getFilteredTransactions(book);
  filteredTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  let tableColumn = [];
  let tableRows = [];

  if (reportType === 'all') {
    tableColumn = ["Date", "Description", "Category", "Mode", "Amount", "Type"];
    filteredTransactions.forEach(t => {
      tableRows.push([
        t.date,
        t.text,
        t.category || '-',
        t.paymentMode || '-',
        Math.abs(t.amount),
        t.amount < 0 ? 'Expense' : 'Income'
      ]);
    });
  } else if (reportType === 'day') {
    tableColumn = ["Date", "Total In (+)", "Total Out (-)", "Net Balance"];
    const dayStats = {};
    filteredTransactions.forEach(t => {
      if (!dayStats[t.date]) dayStats[t.date] = { in: 0, out: 0 };
      if (t.amount > 0) dayStats[t.date].in += t.amount;
      else dayStats[t.date].out += Math.abs(t.amount);
    });

    Object.keys(dayStats).forEach(date => {
      const stats = dayStats[date];
      tableRows.push([
        date,
        stats.in,
        stats.out,
        stats.in - stats.out
      ]);
    });
  } else if (reportType === 'category') {
    tableColumn = ["Category", "Total In (+)", "Total Out (-)"];
    const catStats = {};
    filteredTransactions.forEach(t => {
      const cat = t.category || 'Others';
      if (!catStats[cat]) catStats[cat] = { in: 0, out: 0 };
      if (t.amount > 0) catStats[cat].in += t.amount;
      else catStats[cat].out += Math.abs(t.amount);
    });

    Object.keys(catStats).forEach(cat => {
      const stats = catStats[cat];
      tableRows.push([
        cat,
        stats.in,
        stats.out
      ]);
    });
  }

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
  });

  doc.save(`${book.name}_${reportType}_Report.pdf`);
  reportModal.classList.remove('show');
}

function generateExcel() {
  const book = books.find(b => b.id === currentBookId);
  if (!book) return;

  const reportType = document.querySelector('input[name="report-type"]:checked').value;
  const filteredTransactions = getFilteredTransactions(book);
  filteredTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  let data = [];

  if (reportType === 'all') {
    data = filteredTransactions.map(t => ({
      Date: t.date,
      Description: t.text,
      Category: t.category || '-',
      PaymentMode: t.paymentMode || '-',
      Amount: Math.abs(t.amount),
      Type: t.amount < 0 ? 'Expense' : 'Income'
    }));
  } else if (reportType === 'day') {
    const dayStats = {};
    filteredTransactions.forEach(t => {
      if (!dayStats[t.date]) dayStats[t.date] = { in: 0, out: 0 };
      if (t.amount > 0) dayStats[t.date].in += t.amount;
      else dayStats[t.date].out += Math.abs(t.amount);
    });
    data = Object.keys(dayStats).map(date => ({
      Date: date,
      "Total In": dayStats[date].in,
      "Total Out": dayStats[date].out,
      "Net Balance": dayStats[date].in - dayStats[date].out
    }));
  } else if (reportType === 'category') {
    const catStats = {};
    filteredTransactions.forEach(t => {
      const cat = t.category || 'Others';
      if (!catStats[cat]) catStats[cat] = { in: 0, out: 0 };
      if (t.amount > 0) catStats[cat].in += t.amount;
      else catStats[cat].out += Math.abs(t.amount);
    });
    data = Object.keys(catStats).map(cat => ({
      Category: cat,
      "Total In": catStats[cat].in,
      "Total Out": catStats[cat].out
    }));
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  XLSX.writeFile(wb, `${book.name}_${reportType}_Report.xlsx`);
  reportModal.classList.remove('show');
}

// Start App
// --- INITIALIZATION ---
async function init() {
  console.log("App Initializing...");

  // 1. ATTACH ALL LISTENERS FIRST (Interactivity)

  // History Handling
  window.addEventListener('popstate', (event) => {
    const state = event.state;
    if (!state || state.view === 'home') {
      showHomeView(false);
    } else if (state.view === 'book') {
      showBookView(state.id, false);
    } else if (state.view === 'profile') {
      showProfileView(false);
    } else if (state.view === 'stats') {
      showStatsView(false);
    }
  });

  // Initial State
  history.replaceState({ view: 'home' }, '', '');

  try {
    // Auth Listeners
    if (authForm) authForm.addEventListener('submit', handleAuthSubmit);
    if (authSwitchBtn) authSwitchBtn.addEventListener('click', toggleAuthMode);

    // Navigation
    if (backToHomeBtn) backToHomeBtn.addEventListener('click', showHomeView);
    if (backFromProfileBtn) backFromProfileBtn.addEventListener('click', showHomeView);
    if (backFromStatsBtn) backFromStatsBtn.addEventListener('click', () => {
      if (currentBookId) {
        showBookView(currentBookId);
      } else {
        showHomeView();
      }
    });
    if (navCashbooks) navCashbooks.addEventListener('click', showHomeView);
    if (navSettings) navSettings.addEventListener('click', showProfileView);

    // Modals
    if (fabAddBook) fabAddBook.addEventListener('click', addNewBook);
    if (addBusinessBtn) addBusinessBtn.addEventListener('click', addNewBusiness);
    if (closeBusinessModal) closeBusinessModal.addEventListener('click', () => businessModal.classList.remove('show'));
    if (businessSelectorBtn) businessSelectorBtn.addEventListener('click', () => {
      updateBusinessUI();
      renderBusinessList();
      businessModal.classList.add('show');
    });

    if (closeTransactionModal) closeTransactionModal.addEventListener('click', () => transactionModal.classList.remove('show'));
    if (form) form.addEventListener('submit', addTransaction);

    if (manageCategoryBtn) manageCategoryBtn.addEventListener('click', () => {
      renderCategoryManager();
      categoryModal.classList.add('show');
    });
    if (closeCategoryModal) closeCategoryModal.addEventListener('click', () => categoryModal.classList.remove('show'));
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', addNewCategory);

    // Book Actions
    if (btnCashIn) btnCashIn.addEventListener('click', () => openTransactionModal('income'));
    if (btnCashOut) btnCashOut.addEventListener('click', () => openTransactionModal('expense'));

    // Reports & Stats
    if (openReportModalBtn) openReportModalBtn.addEventListener('click', () => reportModal.classList.add('show'));
    if (closeReportModalBtn) closeReportModalBtn.addEventListener('click', () => reportModal.classList.remove('show'));
    if (generatePdfBtn) generatePdfBtn.addEventListener('click', generatePDF);
    if (generateExcelBtn) generateExcelBtn.addEventListener('click', generateExcel);

    if (statsBtn && viewStats) statsBtn.addEventListener('click', showStatsView);

    // Profile
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);

    // Filters
    try {
      setupFilters();
    } catch (err) {
      console.error("Filter setup failed:", err);
      alert("Filter Error: " + err.message);
    }

    // Search
    if (searchToggleBtn) searchToggleBtn.addEventListener('click', () => {
      searchWrapper.style.display = searchWrapper.style.display === 'none' ? 'block' : 'none';
      if (searchWrapper.style.display === 'block') bookSearchInput.focus();
    });

    if (bookSearchInput) bookSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderBooksList();
    });

    if (searchInput) searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderTransactions();
    });

  } catch (err) {
    console.error("Error attaching listeners:", err);
    alert("App error: Buttons may not work. Reload page.");
  }

  // 2. LOAD DATA (Async)
  // Check Auth
  if (!authToken) {
    showAuthModal();
  } else {
    authModal.classList.remove('show');
    try {
      // Render from Cache First
      renderBooksList();
      // Then fetch fresh data
      await fetchData();
    } catch (err) {
      console.error("Data load error:", err);
    }
  }
}

// Start App
init();
