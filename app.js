const form = document.getElementById('subscription-form');
const list = document.getElementById('subscription-list');
const totalCost = document.getElementById('total-cost');

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
          <p class="text-sm text-gray-600">Valor: ${formatCurrency(item.value)} | Próx: ${formatDate(item.nextDate)}</p>
          <p class="text-xs text-gray-500">${item.frequency} · ${item.paymentMethod} · ${item.category}</p>
        </div>
        <div class="flex flex-col gap-1 text-sm text-right">
          <button class="text-primary hover:underline" onclick="markAsPaid(${index})">Paguei</button>
          <button class="text-yellow-600 hover:underline" onclick="markAsPaidAndCancel(${index})">Paguei, mas vou cancelar</button>
          <button class="text-red-500 hover:underline" onclick="cancelSubscription(${index})">Cancelei</button>
          <button class="text-blue-600 hover:underline" onclick="changeDate(${index})">Alterar data</button>
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
    category: document.getElementById('category').value
  };
  const subscriptions = loadFromLocalStorage();
  subscriptions.push(subscription);
  saveToLocalStorage(subscriptions);
  form.reset();
  renderList();
});

// Inicializar
renderList();
