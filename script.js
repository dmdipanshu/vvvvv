// --- DOM ELEMENTS ---
const viewHome = document.getElementById('view-home');
const viewBook = document.getElementById('view-book');
const viewProfile = document.getElementById('view-profile');
const booksListEl = document.getElementById('books-list');
const fabAddBook = document.getElementById('fab-add-book');
const backToHomeBtn = document.getElementById('back-to-home');
const backFromProfileBtn = document.getElementById('back-from-profile');

// Search Elements
const searchWrapper = document.getElementById('search-wrapper');
const bookSearchInput = document.getElementById('book-search-input');
const searchToggleBtn = document.getElementById('search-toggle-btn');

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
const dateFilterBtn = document.getElementById('date-filter-btn');
const dateFilterInput = document.getElementById('date-filter-input');
const dateFilterText = document.getElementById('date-filter-text');
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

// Filter State
let currentFilters = {
  date: null,
  type: 'all'
};

// --- API INTEGRATION ---
// --- API INTEGRATION ---
const API_URL = '/api';
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
    currentBusiness,
    profile
  };
  localStorage.setItem('cashbook_data', JSON.stringify(dataToSave));

  // 2. Sync with Server
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = authToken;

    await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(dataToSave)
    });
  } catch (err) {
    console.error('Error syncing data:', err);
  }
}

// --- INITIALIZATION ---
async function init() {
  if (!authToken) {
    showAuthModal();
  } else {
    authModal.classList.remove('show');
    await fetchData();
  }

  // Auth Listeners
  authForm.addEventListener('submit', handleAuthSubmit);
  authSwitchBtn.addEventListener('click', toggleAuthMode);

  // Event Listeners
  fabAddBook.addEventListener('click', addNewBook);
  backToHomeBtn.addEventListener('click', showHomeView);
  backFromProfileBtn.addEventListener('click', showHomeView);

  // Navigation
  navSettings.addEventListener('click', showProfileView);
  navCashbooks.addEventListener('click', showHomeView);

  // Profile
  saveProfileBtn.addEventListener('click', saveProfile);

  // Search
  searchToggleBtn.addEventListener('click', () => {
    if (searchWrapper.style.display === 'none') {
      searchWrapper.style.display = 'block';
      bookSearchInput.focus();
    } else {
      searchWrapper.style.display = 'none';
      searchQuery = '';
      bookSearchInput.value = '';
      renderBooksList();
    }
  });

  bookSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderBooksList();
  });

  // Business Switcher
  businessSelectorBtn.addEventListener('click', () => {
    renderBusinessList();
    businessModal.classList.add('show');
  });
  closeBusinessModal.addEventListener('click', () => businessModal.classList.remove('show'));
  addBusinessBtn.addEventListener('click', addNewBusiness);

  // Transaction Modal
  btnCashIn.addEventListener('click', () => openTransactionModal('income'));
  btnCashOut.addEventListener('click', () => openTransactionModal('expense'));
  closeTransactionModal.addEventListener('click', () => transactionModal.classList.remove('show'));
  form.addEventListener('submit', addTransaction);

  // Report Modal
  openReportModalBtn.addEventListener('click', () => reportModal.classList.add('show'));
  closeReportModalBtn.addEventListener('click', () => reportModal.classList.remove('show'));
  generatePdfBtn.addEventListener('click', generatePDF);
  generateExcelBtn.addEventListener('click', generateExcel);

  // Filters
  setupFilters();

  // Categories
  addCategoryBtn.addEventListener('click', addNewCategory);
}

// --- PROFILE MANAGEMENT ---
function updateProfileUI() {
  if (profileNameInput) profileNameInput.value = profile.name || '';
  if (profileMobileInput) profileMobileInput.value = profile.mobile || '';
  if (profileEmailInput) profileEmailInput.value = profile.email || '';
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
function showHomeView() {
  viewBook.classList.remove('active');
  viewProfile.classList.remove('active');
  viewHome.classList.add('active');

  navCashbooks.classList.add('active');
  navSettings.classList.remove('active');

  currentBookId = null;
  renderBooksList();
}

function showBookView(bookId) {
  currentBookId = bookId;
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  bookNameDisplay.innerText = book.name;
  viewHome.classList.remove('active');
  viewProfile.classList.remove('active');
  viewBook.classList.add('active');

  resetFilters();
  renderTransactions();
  updateValues();
}

function showProfileView() {
  viewHome.classList.remove('active');
  viewBook.classList.remove('active');
  viewProfile.classList.add('active');

  navSettings.classList.add('active');
  navCashbooks.classList.remove('active');

  updateProfileUI();
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
                <div class="book-title">${book.name}</div>
                <div class="book-meta">Updated on ${lastUpdated}</div>
            </div>
            <div class="book-balance ${balanceClass}">
                ${balance < 0 ? '-' : ''}₹${Math.abs(balance)}
            </div>
            <div class="book-menu" onclick="event.stopPropagation(); showBookMenu(${book.id})">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </div>
        `;
    booksListEl.appendChild(card);
  });
}

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
  }
}

function showBookMenu(bookId) {
  const action = confirm("Do you want to delete this book?");
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
      const iconClass = categoryVal.toLowerCase();

      let icon = 'fa-bag-shopping';
      if (iconClass === 'food') icon = 'fa-utensils';
      else if (iconClass === 'travel') icon = 'fa-plane';
      else if (iconClass === 'bills') icon = 'fa-file-invoice-dollar';
      else if (iconClass === 'others') icon = 'fa-circle-question';
      if (!['food', 'travel', 'shopping', 'bills', 'others'].includes(iconClass)) icon = 'fa-tag';

      item.innerHTML = `
                <div class="t-left">
                    <div class="t-icon ${['food', 'travel', 'shopping', 'bills', 'others'].includes(iconClass) ? iconClass : 'custom'}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="t-details">
                        <div class="t-tags">
                            <span class="tag">${categoryVal}</span>
                            <span class="tag">${transaction.paymentMode || 'Cash'}</span>
                        </div>
                        <div class="t-desc">${transaction.text}</div>
                        <div class="t-meta">Entry by You ${transaction.time ? 'at ' + transaction.time : ''}</div>
                    </div>
                </div>
                <div class="t-right">
                    <div class="t-amount money ${amountClass}">${Math.abs(transaction.amount)}</div>
                    <div class="t-balance">Balance: ${balanceMap[transaction.id]}</div>
                </div>
            `;
      listContainer.appendChild(item);
    });
  });
}

function updateValues() {
  const book = books.find(b => b.id === currentBookId);
  if (!book) return;

  const amounts = book.transactions.map(t => t.amount);
  const total = amounts.reduce((acc, item) => acc + item, 0);
  const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0);
  const expense = amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1;

  balanceEl.innerText = `${total}`;
  money_plusEl.innerText = `${income}`;
  money_minusEl.innerText = `${expense}`;
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

  const book = books.find(b => b.id === currentBookId);
  book.transactions.push(transaction);
  book.updated = new Date().toISOString();

  syncData();
  renderTransactions();
  updateValues();

  text.value = '';
  amount.value = '';
  transactionModal.classList.remove('show');
}

function openTransactionModal(type) {
  transactionModal.classList.add('show');
  transactionTypeEl.value = type;
  const modalTitle = document.getElementById('modal-title');
  const submitBtn = document.getElementById('submit-btn');

  if (type === 'income') {
    modalTitle.innerText = 'Cash In';
    submitBtn.style.backgroundColor = 'var(--success-color)';
  } else {
    modalTitle.innerText = 'Cash Out';
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

// --- FILTERS ---
function setupFilters() {
  dateFilterBtn.addEventListener('click', () => dateFilterInput.showPicker());
  dateFilterInput.addEventListener('change', (e) => {
    if (e.target.value) {
      currentFilters.date = e.target.value;
      dateFilterText.innerText = new Date(e.target.value).toLocaleDateString();
      dateFilterBtn.classList.add('active');
      renderTransactions();
    }
  });

  typeFilterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    typeDropdown.classList.toggle('show');
  });

  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const value = e.target.dataset.value;
      currentFilters.type = value;
      typeFilterBtn.innerHTML = `${e.target.innerText} <i class="fa-solid fa-caret-down"></i>`;
      typeDropdown.classList.remove('show');
      typeFilterBtn.classList.toggle('active', value !== 'all');
      renderTransactions();
    });
  });

  resetFiltersBtn.addEventListener('click', resetFilters);

  window.addEventListener('click', (e) => {
    if (!typeFilterBtn.contains(e.target) && !typeDropdown.contains(e.target)) {
      typeDropdown.classList.remove('show');
    }
  });
}

function resetFilters() {
  currentFilters = { date: null, type: 'all' };
  dateFilterInput.value = '';
  dateFilterText.innerText = 'Select Date';
  dateFilterBtn.classList.remove('active');
  typeFilterBtn.innerHTML = `Entry Type <i class="fa-solid fa-caret-down"></i>`;
  typeFilterBtn.classList.remove('active');
  renderTransactions();
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
init();
