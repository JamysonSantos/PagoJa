const form = document.getElementById('subscription-form');
const list = document.getElementById('subscription-list');
const totalCost = document.getElementById('total-cost');
const categoryField = document.getElementById('category');
const streamingFields = document.getElementById('streaming-fields');
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const usageRadios = document.getElementsByName('usage');
const sharedUsersContainer = document.getElementById('shared-users-container');

const accessModal = document.getElementById('access-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalCancelBtn = document.getElementById('modal-cancel');
const accessForm = document.getElementById('access-form');
const modalEmail = document.getElementById('modal-email');
const modalPassword = document.getElementById('modal-password');
const modalTogglePassword = document.getElementById('modal-toggle-password');

const modalEditBtn = document.createElement('button'); // Botão Editar, será criado dinamicamente
modalEditBtn.type = 'button';
modalEditBtn.textContent = 'Editar';
modalEditBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';

// Controle do index atual que está sendo editado no modal
let currentEditingIndex = null;
let modalIsEditing = false; // Flag para controlar estado do modal

// Função para atualizar visibilidade dos campos streaming no formulário conforme categoria
function updateStreamingFieldsVisibility() {
  if (categoryField.value === 'Streaming') {
    streamingFields.classList.remove('hidden');
  } else {
    streamingFields.classList.add('hidden');
  }
}

// Inicializar visibilidade logo no carregamento da página
updateStreamingFieldsVisibility();

// Atualizar visibilidade ao mudar categoria
categoryField.addEventListener('change', updateStreamingFieldsVisibility);

// Toggle senha formulário principal
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
  });
}

// Mostrar/ocultar campo compartilhado
usageRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'compartilhado' && radio.checked) {
      sharedUsersContainer.classList.remove('hidden');
    } else if (radio.value === 'pessoal' && radio.checked) {
      sharedUsersContainer.classList.add('hidden');
    }
  });
});

// Toast de notificação
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = "fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded shadow-lg animate-fade z-50";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function saveToLocalStorage(data) {
  localStorage.setItem('subscriptions', JSON.stringify(data));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem('subscriptions');
  return data ? JSON.parse(data) : [];
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function addPeriodToDate(dateStr, frequency) {
  const date = new Date(dateStr);
  switch (frequency) {
    case 'Mensal':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Anual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'Trimestral':
      date.setMonth(date.getMonth() + 3);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
}

function renderTotal(subscriptions) {
  const total = subscriptions.reduce((sum, item) => sum + parseFloat(item.value), 0);
  totalCost.textContent = formatCurrency(total);
}

function renderList() {
  list.innerHTML = '';
  const subscriptions = loadFromLocalStorage();
  subscriptions.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = "bg-gray-50 border-l-4 border-primary p-4 rounded shadow-sm";

    div.innerHTML = `
      <div class="flex justify-between items-start flex-wrap gap-2">
        <div>
          <p class="text-lg font-bold text-dark">${item.name}</p>
          <p class="text-sm text-gray-600">
            Valor: ${formatCurrency(item.value)} | Próxima cobrança: ${formatDate(item.nextDate)}
          </p>
          <p class="text-xs text-gray-500 my-2">${item.frequency} · ${item.paymentMethod} · ${item.category}</p>
          ${item.category === 'Streaming' && item.usage === 'compartilhado' ? `
            <p class="text-xs text-gray-500 mb-2">Compartilhado com: ${item.sharedUsers || '-'}</p>
          ` : ''}
        </div>
        <div class="flex flex-col gap-2 mt-2">
          ${item.category === 'Streaming' ? `<button class="btn-access bg-blue-600 text-white px-3 py-1 rounded text-sm" data-index="${index}">Ver dados de acesso</button>` : ''}
          <button class="px-3 py-1 bg-primary text-white rounded text-sm" onclick="markAsPaid(${index})">Paguei</button>
          <button class="px-3 py-1 bg-yellow-500 text-white rounded text-sm" onclick="markAsPaidAndCancel(${index})">Paguei, mas vou cancelar</button>
          <button class="px-3 py-1 bg-red-500 text-white rounded text-sm" onclick="cancelSubscription(${index})">Cancelei</button>
          <button class="px-3 py-1 bg-blue-600 text-white rounded text-sm" onclick="changeDate(${index})">Alterar data</button>
        </div>
      </div>
    `;

    list.appendChild(div);
  });
  renderTotal(subscriptions);
}

// Funções para ações nos cards

function markAsPaid(index) {
  const subscriptions = loadFromLocalStorage();
  const sub = subscriptions[index];
  sub.nextDate = addPeriodToDate(sub.nextDate, sub.frequency);
  saveToLocalStorage(subscriptions);
  renderList();
  showToast("Assinatura renovada com sucesso!");
}

function markAsPaidAndCancel(index) {
  const confirmed = confirm("Tem certeza de que deseja cancelar após este pagamento?");
  if (confirmed) {
    removeSubscription(index);
  }
}

function cancelSubscription(index) {
  const confirmed = confirm("Tem certeza de que deseja cancelar esta assinatura?");
  if (confirmed) {
    removeSubscription(index);
  }
}

function changeDate(index) {
  const subscriptions = loadFromLocalStorage();
  const current = subscriptions[index];
  const newDate = prompt("Nova data de pagamento (aaaa-mm-dd):", current.nextDate);
  if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    current.nextDate = newDate;
    saveToLocalStorage(subscriptions);
    renderList();
  } else if (newDate) {
    alert("Formato inválido. Use o padrão aaaa-mm-dd.");
  }
}

function removeSubscription(index) {
  const subscriptions = loadFromLocalStorage();
  subscriptions.splice(index, 1);
  saveToLocalStorage(subscriptions);
  renderList();
}

// Cadastro novo item via formulário
form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (!categoryField.value) {
    alert("Por favor, escolha uma categoria válida.");
    return;
  }
  const subscription = {
    name: document.getElementById('name').value.trim(),
    value: parseFloat(document.getElementById('value').value),
    nextDate: document.getElementById('nextDate').value,
    frequency: document.getElementById('frequency').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    category: categoryField.value,
    email: document.getElementById('email')?.value.trim() || '',
    password: document.getElementById('password')?.value || '',
    usage: document.querySelector('input[name="usage"]:checked')?.value || 'pessoal',
    sharedUsers: document.getElementById('sharedUsers')?.value.trim() || ''
  };
  const subscriptions = loadFromLocalStorage();
  subscriptions.push(subscription);
  saveToLocalStorage(subscriptions);
  form.reset();
  streamingFields.classList.add('hidden');
  sharedUsersContainer.classList.add('hidden');
  renderList();
});

// Modal Dados de Acesso

// Variáveis para guardar dados originais no modo visualização
let modalOriginalEmail = '';
let modalOriginalPassword = '';

// Delegação para botão "Ver dados de acesso"
list.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-access')) {
    currentEditingIndex = parseInt(e.target.dataset.index, 10);
    openAccessModal(currentEditingIndex);
  }
});

function openAccessModal(index) {
  const subscriptions = loadFromLocalStorage();
  const item = subscriptions[index];
  if (!item) return;

  modalOriginalEmail = item.email || '';
  modalOriginalPassword = item.password || '';

  setModalFields(modalOriginalEmail, modalOriginalPassword);
  setModalViewMode();

  accessModal.classList.remove('hidden');
}

// Configura campos do modal com valores dados e mascara
function setModalFields(email, password) {
  modalEmail.value = email;
  modalPassword.value = password;
  modalPassword.type = 'password';
  modalTogglePassword.textContent = '👁';
}

// Ajusta modal para modo visualização (inputs desabilitados)
// Ajusta modal para modo visualização (inputs desabilitados)
function setModalViewMode() {
  modalIsEditing = false;
  modalEmail.disabled = true;
  modalPassword.disabled = true;
  modalTogglePassword.style.visibility = 'visible';
  modalTogglePassword.textContent = '👁';

  // Remover botão salvar e cancelar, adicionar editar
  if (!accessForm.contains(modalEditBtn)) {
    accessForm.appendChild(modalEditBtn);
  }
  modalCancelBtn.style.display = 'none';
  accessForm.querySelector('button[type="submit"]').style.display = 'none';

  modalEditBtn.style.display = 'inline-block';
}

// Ajusta modal para modo edição (inputs habilitados)
function setModalEditMode() {
  modalIsEditing = true;

  modalEmail.disabled = false;
  modalPassword.disabled = false;
  
  // Se estava com atributo readonly, remove (caso tenha usado)
  modalEmail.removeAttribute('readonly');
  modalPassword.removeAttribute('readonly');

  modalTogglePassword.style.visibility = 'visible';

  modalEditBtn.style.display = 'none';
  modalCancelBtn.style.display = 'inline-block';
  accessForm.querySelector('button[type="submit"]').style.display = 'inline-block';
}

// Ajusta modal para modo edição (inputs habilitados)
function setModalEditMode() {
  modalIsEditing = true;
  modalEmail.disabled = false;
  modalPassword.disabled = false;
  modalTogglePassword.style.visibility = 'visible';

  modalEditBtn.style.display = 'none';
  modalCancelBtn.style.display = 'inline-block';
  accessForm.querySelector('button[type="submit"]').style.display = 'inline-block';
}

// Alternar visibilidade da senha no modal
modalTogglePassword.addEventListener('click', () => {
  if (modalPassword.type === 'password') {
    modalPassword.type = 'text';
    modalTogglePassword.textContent = '🙈';
  } else {
    modalPassword.type = 'password';
    modalTogglePassword.textContent = '👁';
  }
});

// Fechar modal
closeModalBtn.addEventListener('click', () => {
  closeAccessModal();
});

modalCancelBtn.addEventListener('click', () => {
  // Reverter para dados originais e modo visualização
  setModalFields(modalOriginalEmail, modalOriginalPassword);
  setModalViewMode();
});

// Botão editar do modal
modalEditBtn.addEventListener('click', () => {
  setModalEditMode();
});

// Salvar alterações do modal
accessForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (currentEditingIndex === null) return;

  const subscriptions = loadFromLocalStorage();
  const item = subscriptions[currentEditingIndex];

  item.email = modalEmail.value.trim();
  item.password = modalPassword.value;

  saveToLocalStorage(subscriptions);
  renderList();

  // Atualiza dados originais para o modo visualização
  modalOriginalEmail = item.email;
  modalOriginalPassword = item.password;

  setModalViewMode();
  showToast('Dados de acesso atualizados!');
});

// Fechar modal (função)
function closeAccessModal() {
  accessModal.classList.add('hidden');
  currentEditingIndex = null;
  setModalViewMode();
}

// Inicializar lista ao carregar
renderList();





