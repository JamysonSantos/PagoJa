// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCRhjUGAAwWDrxA3AAv5EJuehulBk5hn9E",
  authDomain: "seificontas.firebaseapp.com",
  projectId: "seificontas",
  storageBucket: "seificontas.appspot.com",
  messagingSenderId: "454487656313",
  appId: "1:454487656313:web:bbc2fe6d220068bdc7d1a8"
};

// Inicializa Firebase
const appFirebase = initializeApp(firebaseConfig);
const messaging = getMessaging(appFirebase);

// Registra o service worker e solicita permissão para notificações
document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration);
        requestNotificationPermission(registration);
      })
      .catch(err => {
        console.error('❌ Erro ao registrar Service Worker:', err);
      });
  }
});

async function requestNotificationPermission(registration) {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    try {
      const token = await getToken(messaging, {
        vapidKey: 'BCQlBNQ5hD-PhZaO6l5VZB3KRTYgUWjt0uK74nRkUwIbkd0IMcxuJnx8ukqpya9dCkZclhNRhX3s2HN1edfY8_o',
        serviceWorkerRegistration: registration
      });
      console.log('🔐 Token FCM:', token);
      // Aqui você pode salvar o token no backend se quiser
    } catch (error) {
      console.error('⚠️ Erro ao obter token FCM:', error);
    }
  } else {
    console.warn('🔕 Permissão para notificações negada.');
  }
}

// Notificação em Foreground
onMessage(messaging, (payload) => {
  console.log('📩 Notificação recebida (foreground):', payload);
  alert(`${payload.notification.title}\n${payload.notification.body}`);
});

// =====================
// Lógica principal do Seificontas
// =====================

// Referências DOM
const form = document.getElementById('subscription-form');
const list = document.getElementById('subscription-list');
const totalCost = document.getElementById('total-cost');
const categoryField = document.getElementById('category');
const streamingFields = document.getElementById('streaming-fields');
const togglePasswordBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const usageRadios = document.getElementsByName('usage');
const sharedUsersContainer = document.getElementById('shared-users-container');

// Mostrar campos de streaming
function updateStreamingFieldsVisibility() {
  if (categoryField.value === 'Streaming') {
    streamingFields.classList.remove('hidden');
  } else {
    streamingFields.classList.add('hidden');
  }
}
categoryField.addEventListener('change', updateStreamingFieldsVisibility);
updateStreamingFieldsVisibility();

// Alternar visibilidade da senha
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', () => {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  });
}

// Mostrar ou ocultar campo de compartilhamento
usageRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'compartilhado' && radio.checked) {
      sharedUsersContainer.classList.remove('hidden');
    } else {
      sharedUsersContainer.classList.add('hidden');
    }
  });
});

// Toast
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = "fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded shadow-lg z-50";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Utilidades
function saveToLocalStorage(data) {
  localStorage.setItem('subscriptions', JSON.stringify(data));
}
function loadFromLocalStorage() {
  const data = localStorage.getItem('subscriptions');
  return data ? JSON.parse(data) : [];
}
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
function addPeriodToDate(dateStr, frequency) {
  const date = new Date(dateStr);
  switch (frequency) {
    case 'Mensal': date.setMonth(date.getMonth() + 1); break;
    case 'Trimestral': date.setMonth(date.getMonth() + 3); break;
    case 'Anual': date.setFullYear(date.getFullYear() + 1); break;
  }
  return date.toISOString().split('T')[0];
}

// Renderizar total
function renderTotal(subscriptions) {
  const total = subscriptions.reduce((sum, item) => sum + parseFloat(item.value), 0);
  totalCost.textContent = formatCurrency(total);
}

// Renderizar lista
function renderList() {
  list.innerHTML = '';
  const subscriptions = loadFromLocalStorage();
  subscriptions.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = "bg-gray-50 border-l-4 border-primary p-4 rounded shadow-sm mb-3";
    div.innerHTML = `
      <div class="flex justify-between items-start flex-wrap gap-2">
        <div>
          <p class="text-lg font-bold">${item.name}</p>
          <p class="text-sm text-gray-600">
            Valor: ${formatCurrency(item.value)} | Próxima: ${formatDate(item.nextDate)}
          </p>
          <p class="text-xs text-gray-500">${item.frequency} · ${item.paymentMethod} · ${item.category}</p>
          ${item.category === 'Streaming' && item.usage === 'compartilhado' ? `<p class="text-xs text-gray-500">Compartilhado com: ${item.sharedUsers}</p>` : ''}
        </div>
        <div class="flex flex-wrap gap-2 mt-2">
          ${item.category === 'Streaming' ? `<button class="px-2 py-1 bg-blue-600 text-white rounded text-sm" onclick="showAccess(${index})">Ver acesso</button>` : ''}
          <button class="px-2 py-1 bg-primary text-white rounded text-sm" onclick="markAsPaid(${index})">Paguei</button>
          <button class="px-2 py-1 bg-yellow-500 text-white rounded text-sm" onclick="markAsPaidAndCancel(${index})">Paguei e cancelar</button>
          <button class="px-2 py-1 bg-red-500 text-white rounded text-sm" onclick="cancelSubscription(${index})">Cancelar</button>
          <button class="px-2 py-1 bg-gray-600 text-white rounded text-sm" onclick="changeDate(${index})">Alterar data</button>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
  renderTotal(subscriptions);
}

// Ações
function markAsPaid(index) {
  const subs = loadFromLocalStorage();
  subs[index].nextDate = addPeriodToDate(subs[index].nextDate, subs[index].frequency);
  saveToLocalStorage(subs);
  renderList();
  showToast("Assinatura renovada!");
}

function markAsPaidAndCancel(index) {
  if (confirm("Deseja cancelar após esse pagamento?")) removeSubscription(index);
}
function cancelSubscription(index) {
  if (confirm("Tem certeza que quer cancelar?")) removeSubscription(index);
}
function changeDate(index) {
  const subs = loadFromLocalStorage();
  const newDate = prompt("Nova data (aaaa-mm-dd):", subs[index].nextDate);
  if (/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    subs[index].nextDate = newDate;
    saveToLocalStorage(subs);
    renderList();
  } else {
    alert("Formato inválido.");
  }
}
function removeSubscription(index) {
  const subs = loadFromLocalStorage();
  subs.splice(index, 1);
  saveToLocalStorage(subs);
  renderList();
}
function showAccess(index) {
  const subs = loadFromLocalStorage();
  const item = subs[index];
  alert(`E-mail: ${item.email || '-'}\nSenha: ${item.password || '-'}`);
}

// Cadastro
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const sub = {
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
  const subs = loadFromLocalStorage();
  subs.push(sub);
  saveToLocalStorage(subs);
  form.reset();
  streamingFields.classList.add('hidden');
  sharedUsersContainer.classList.add('hidden');
  renderList();
});

// Inicializa
renderList();







