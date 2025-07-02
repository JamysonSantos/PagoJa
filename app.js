// Importação dos módulos Firebase (via ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js";

// Configuração Firebase - substitua pelas suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCRhjUGAAwWDrxA3AAv5EJuehulBk5hn9E",
  authDomain: "seificontas.firebaseapp.com",
  projectId: "seificontas",
  storageBucket: "seificontas.firebasestorage.app",
  messagingSenderId: "454487656313",
  appId: "1:454487656313:web:bbc2fe6d220068bdc7d1a8"
};

// Inicializa o Firebase
const appFirebase = initializeApp(firebaseConfig);

// Inicializa o Messaging
const messaging = getMessaging(appFirebase);

// Registra o service worker do Firebase Messaging
navigator.serviceWorker.register('/firebase-messaging-sw.js')
  .then((registration) => {
    console.log('Service Worker registrado com sucesso:', registration);

    // Solicita permissão para notificações e obtém token
    requestNotificationPermission(registration);
  })
  .catch(err => {
    console.error('Erro ao registrar o Service Worker:', err);
  });

// Função para solicitar permissão e obter token
async function requestNotificationPermission(registration) {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    console.log('Permissão para notificações concedida.');

    try {
      const token = await getToken(messaging, {
         vapidKey: 'BCQlBNQ5hD-PhZaO6l5VZB3KRTYgUWjt0uK74nRkUwIbkd0IMcxuJnx8ukqpya9dCkZclhNRhX3s2HN1edfY8_o',
         serviceWorkerRegistration: registration
        });
      console.log('Token FCM obtido:', token);

      // TODO: envie esse token para seu backend para armazenar e usar nas notificações push
      // exemplo: await sendTokenToBackend(token);
    } catch (error) {
      console.error('Erro ao obter token FCM:', error);
    }
  } else {
    console.log('Permissão para notificações negada.');
  }
}

// Exemplo básico de função para enviar token ao backend (implemente conforme sua API)
async function sendTokenToBackend(token) {
  try {
    await fetch('/api/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
  } catch (error) {
    console.error('Erro ao enviar token para backend:', error);
  }
}

// Escuta mensagens recebidas com o app aberto (foreground)
onMessage(messaging, (payload) => {
  console.log('Mensagem recebida em foreground:', payload);
  // Aqui você pode mostrar um toast, alert ou atualizar a interface
});

// Referências aos elementos do DOM
const form = document.getElementById('subscription-form');
const list = document.getElementById('subscription-list');
const totalCost = document.getElementById('total-cost');
const categoryField = document.getElementById('category');
const streamingFields = document.getElementById('streaming-fields');
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const usageRadios = document.getElementsByName('usage');
const sharedUsersContainer = document.getElementById('shared-users-container');

// Mostrar/ocultar campos adicionais para streaming
categoryField.addEventListener('change', () => {
  if (categoryField.value === 'Streaming') {
    streamingFields.classList.remove('hidden');
  } else {
    streamingFields.classList.add('hidden');
  }
});

// Mostrar/ocultar senha
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
  });
}

// Mostrar/ocultar campo de compartilhamento
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
          <p class="text-sm text-gray-600">Valor: ${formatCurrency(item.value)} | Próxima cobrança: ${formatDate(item.nextDate)}</p>
          <p class="text-xs text-gray-500">${item.frequency} · ${item.paymentMethod} · ${item.category}</p>
          ${item.category === 'Streaming' && item.usage === 'compartilhado' ? `<p class="text-xs text-gray-500 mt-1">Compartilhado com: ${item.sharedUsers || '-'}</p>` : ''}
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          ${item.category === 'Streaming' ? `<button class="px-3 py-1 bg-blue-500 text-white rounded text-sm" onclick="showAccess(${index})">Ver dados de acesso</button>` : ''}
          <button class="px-3 py-1 bg-primary text-white rounded text-sm" onclick="markAsPaid(${index})">Paguei</button>
          <button class="px-3 py-1 bg-yellow-500 text-white rounded text-sm" onclick="markAsPaidAndCancel(${index})">Paguei, mas vou cancelar</button>
          <button class="px-3 py-1 bg-red-500 text-white rounded text-sm" onclick="cancelSubscription(${index})">Cancelei</button>
          <button class="px-3 py-1 bg-gray-600 text-white rounded text-sm" onclick="changeDate(${index})">Alterar data</button>
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

function showAccess(index) {
  const subscriptions = loadFromLocalStorage();
  const item = subscriptions[index];
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white text-gray-900 p-6 rounded shadow-lg w-full max-w-md relative">
      <button class="absolute top-2 right-3 text-xl text-gray-600 hover:text-black" onclick="this.parentElement.parentElement.remove()">×</button>
      <h3 class="text-lg font-semibold mb-4">Dados de Acesso</h3>
      <div class="space-y-2">
        <p><strong>E-mail:</strong> ${item.email}</p>
        <p><strong>Senha:</strong> <span id="popup-password">********</span> <button onclick="togglePopupPassword(this, '${item.password}')">👁</button></p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function togglePopupPassword(button, actualPassword) {
  const span = button.previousElementSibling;
  if (span.textContent === '********') {
    span.textContent = actualPassword;
  } else {
    span.textContent = '********';
  }
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

// Inicializa a lista ao carregar
renderList();




