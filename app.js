const form = document.getElementById('subscription-form');
const list = document.getElementById('subscription-list');
const totalCost = document.getElementById('total-cost');
const categoryField = document.getElementById('category');
const streamingFields = document.getElementById('streaming-fields');
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const usageRadios = document.getElementsByName('usage');
const sharedUsersContainer = document.getElementById('shared-users-container');

categoryField.addEventListener('change', () => {
  if (categoryField.value === 'Streaming') {
    streamingFields.classList.remove('hidden');
  } else {
    streamingFields.classList.add('hidden');
  }
});

if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
  });
}

usageRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'compartilhado' && radio.checked) {
      sharedUsersContainer.classList.remove('hidden');
    } else if (radio.value === 'pessoal' && radio.checked) {
      sharedUsersContainer.classList.add('hidden');
    }
  });
});

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
          <p class="text-sm text-gray-600">Valor: ${formatCurrency(item.value)} | Próxima cobrança: ${formatDate(item.nextDate)}</p>
          <p class="text-xs text-gray-500">${item.frequency} · ${item.paymentMethod} · ${item.category}</p>
          ${item.category === 'Streaming' && item.usage === 'compartilhado' ? `<p class="text-xs text-gray-500 mt-1">Compartilhado com: ${item.sharedUsers || '-'}</p>` : ''}
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          <button class="px-3 py-1 bg-primary text-white rounded text-sm" onclick="markAsPaid(${index})">Paguei</button>
          <button class="px-3 py-1 bg-yellow-500 text-white rounded text-sm" onclick="markAsPaidAndCancel(${index})">Paguei, mas vou cancelar</button>
          <button class="px-3 py-1 bg-red-500 text-white rounded text-sm" onclick="cancelSubscription(${index})">Cancelei</button>
          <button class="px-3 py-1 bg-blue-600 text-white rounded text-sm" onclick="changeDate(${index})">Alterar data</button>
          ${item.category === 'Streaming' ? `<button class="px-3 py-1 bg-gray-800 text-white rounded text-sm" onclick="showAccessData(${index})">Ver dados de acesso</button>` : ''}
        </div>
      </div>
    `;

    list.appendChild(div);
  });
  renderTotal(subscriptions);
}

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

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const subscription = {
    name: document.getElementById('name').value,
    value: parseFloat(document.getElementById('value').value),
    nextDate: document.getElementById('nextDate').value,
    frequency: document.getElementById('frequency').value,
    paymentMethod: document.getElementById('paymentMethod').value,
    category: document.getElementById('category').value,
    email: document.getElementById('email')?.value || '',
    password: document.getElementById('password')?.value || '',
    usage: document.querySelector('input[name="usage"]:checked')?.value || 'pessoal',
    sharedUsers: document.getElementById('sharedUsers')?.value || ''
  };
  const subscriptions = loadFromLocalStorage();
  subscriptions.push(subscription);
  saveToLocalStorage(subscriptions);
  form.reset();
  streamingFields.classList.add('hidden');
  sharedUsersContainer.classList.add('hidden');
  renderList();
});

// ================= NOTIFICAÇÕES ===================

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}

function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.png'
        });
      }
    });
  }
}

function checkAndNotify() {
  const today = new Date();
  const subscriptions = loadFromLocalStorage();
  const notifiedKey = `notified-${today.toISOString().split('T')[0]}`;
  const alreadyNotified = localStorage.getItem(notifiedKey);
  if (alreadyNotified) return;

  subscriptions.forEach(sub => {
    if (sub.paymentMethod !== 'Cartão') return;

    const nextDate = new Date(sub.nextDate);
    const diff = Math.floor((nextDate - today) / (1000 * 60 * 60 * 24));

    if (diff === 3) {
      showNotification(
        `Seificontas · ${sub.name}`,
        `Opa, em 3 dias a ${sub.name} cobrará a mensalidade desse mês. Só te avisando mesmo! 😉`
      );
    } else if (diff === 0) {
      showNotification(
        `Seificontas · ${sub.name}`,
        `A ${sub.name} cobra hoje, hein? Só pra ficar atento! 💳`
      );
    } else if (diff === -1 || diff === -2) {
      showNotification(
        `Seificontas · ${sub.name}`,
        `E aí, a ${sub.name} cobrou? Se sim, lembra de atualizar aqui no Seifi 😎`
      );
    }
  });

  localStorage.setItem(notifiedKey, 'true');
}

// Inicialização
requestNotificationPermission();
renderList();
checkAndNotify();



