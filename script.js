let debts = JSON.parse(localStorage.getItem("debts")) || [];

function saveDebts() {
  localStorage.setItem("debts", JSON.stringify(debts));
}

function formatMoney(amount) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function addDebt() {
  const nameInput = document.getElementById("debtName");
  const amountInput = document.getElementById("debtAmount");
  const colorInput = document.getElementById("debtColor");

  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);
  const color = colorInput.value;

  if (!name || amount <= 0) {
    alert("Please enter a debt name and a valid amount.");
    return;
  }

  const newDebt = {
    id: Date.now(),
    name: name,
    totalAmount: amount,
    color: color,
    payments: []
  };

  debts.push(newDebt);
  saveDebts();
  renderDebts();

  nameInput.value = "";
  amountInput.value = "";
  colorInput.value = "#6c63ff";
}

function addPayment(debtId) {
  const paymentInput = document.getElementById(`payment-${debtId}`);
  const paymentAmount = Number(paymentInput.value);

  if (paymentAmount <= 0) {
    alert("Please enter a valid payment amount.");
    return;
  }

  const debt = debts.find(item => item.id === debtId);
  if (!debt) return;

  const totalPaid = debt.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remaining = debt.totalAmount - totalPaid;

  if (paymentAmount > remaining) {
    alert("This payment is more than the remaining balance.");
    return;
  }

  debt.payments.push({
    amount: paymentAmount,
    date: new Date().toLocaleDateString()
  });

  const newTotalPaid = totalPaid + paymentAmount;

  saveDebts();
  renderDebts();

  if (newTotalPaid === debt.totalAmount) {
    if (typeof confetti === "function") {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.6 }
      });
    }

    setTimeout(() => {
      debts = debts.filter(item => item.id !== debtId);
      saveDebts();
      renderDebts();
    }, 10000);
  }
}

function deleteDebt(debtId) {
  const confirmDelete = confirm("Are you sure you want to delete this debt?");
  if (!confirmDelete) return;

  debts = debts.filter(debt => debt.id !== debtId);
  saveDebts();
  renderDebts();
}

function renderDashboard() {
  const debtLimit = 50000;

  const totalDebt = debts.reduce((sum, debt) => sum + debt.totalAmount, 0);

  const totalPaid = debts.reduce((sum, debt) => {
    const debtPaid = debt.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    return sum + debtPaid;
  }, 0);

  const totalRemaining = totalDebt - totalPaid;

  const debtUsedPercent = Math.min(
    Math.max((totalRemaining / debtLimit) * 100, 0),
    100
  );

  document.getElementById("totalDebt").textContent = formatMoney(totalDebt);
  document.getElementById("totalPaid").textContent = formatMoney(totalPaid);
  document.getElementById("totalRemaining").textContent = formatMoney(totalRemaining);
  document.getElementById("overallPercent").textContent = `${Math.round(debtUsedPercent)}%`;
  document.getElementById("overallProgressFill").style.width = `${debtUsedPercent}%`;
}

function renderDebts() {
  renderDashboard();

  const debtList = document.getElementById("debtList");
  debtList.innerHTML = "";

  if (debts.length === 0) {
    debtList.innerHTML = `
      <div class="card">
        <h2>No debts added yet</h2>
        <p>Add your first debt above to start tracking your payoff progress.</p>
      </div>
    `;
    return;
  }

  debts.forEach(debt => {
    const totalPaid = debt.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = debt.totalAmount - totalPaid;
    const percentPaid = Math.round((totalPaid / debt.totalAmount) * 100);

    const paymentHistory = debt.payments
      .map(payment => `<li>${payment.date} — ${formatMoney(payment.amount)}</li>`)
      .join("");

    const debtCard = document.createElement("div");
    debtCard.className = "debt-card";

    debtCard.innerHTML = `
      <div 
        class="chart" 
        style="background: conic-gradient(${debt.color} ${percentPaid}%, #e5e5e5 ${percentPaid}%);"
      >
        <div class="chart-inner">${percentPaid}%</div>
      </div>

      <div class="debt-info">
        <h3>${debt.name}</h3>
        <p><strong>Original Debt:</strong> ${formatMoney(debt.totalAmount)}</p>
        <p><strong>Paid So Far:</strong> ${formatMoney(totalPaid)}</p>
        <p><strong>Remaining:</strong> ${formatMoney(remaining)}</p>

        <div class="payment-row">
          <input id="payment-${debt.id}" type="number" placeholder="Payment amount" />
          <button onclick="addPayment(${debt.id})">Add Payment</button>
        </div>

        <ul class="payment-history">
          ${paymentHistory || "<li>No payments yet</li>"}
        </ul>

        <button class="delete-btn" onclick="deleteDebt(${debt.id})">Delete Debt</button>
      </div>
    `;

    debtList.appendChild(debtCard);
  });
}

renderDebts();