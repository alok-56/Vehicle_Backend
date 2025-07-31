const fetch = require("node-fetch");

const CASHFREE_BASE_URL = "https://payout-api.cashfree.com";
const CASHFREE_PG_BASE_URL = "https://api.cashfree.com/pg";
const CASHFREE_API_VERSION = "2021-05-21";
const CASHFREE_CLIENT_ID = "your-payout-client-id";
const CASHFREE_CLIENT_SECRET = "your-payout-client-secret";
const CASHFREE_CLIENT_PG_ID = "your-pg-client-id";
const CASHFREE_CLIENT_PG_SECRET = "your-pg-client-secret";

const CONTENT_TYPE = "application/json";

async function postRequest(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`POST ${url} failed: ${res.status} ${errorText}`);
  }
  return res.json();
}

async function getRequest(url, headers = {}) {
  const res = await fetch(url, {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GET ${url} failed: ${res.status} ${errorText}`);
  }
  return res.json();
}

async function deleteRequest(url, headers = {}) {
  const res = await fetch(url, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DELETE ${url} failed: ${res.status} ${errorText}`);
  }
  return res.json();
}

const getPayoutHeaders = () => ({
  "x-api-version": CASHFREE_API_VERSION,
  "x-client-id": CASHFREE_CLIENT_ID,
  "x-client-secret": CASHFREE_CLIENT_SECRET,
  "Content-Type": CONTENT_TYPE,
});

const getPGHeaders = () => ({
  "Content-Type": CONTENT_TYPE,
  "x-client-id": CASHFREE_CLIENT_PG_ID,
  "x-client-secret": CASHFREE_CLIENT_PG_SECRET,
});

// Generate a payment link for customers (user pays online)
async function generatePaymentLink({
  customerId,
  customerPhone,
  customerEmail,
  orderId,
  orderAmount,
  orderNote = "Payment for mechanic service",
  returnUrl,
}) {
  const payload = {
    customer_details: {
      customer_id: customerId,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    },
    order_id: orderId,
    order_amount: orderAmount,
    order_currency: "INR",
    order_note: orderNote,
    order_meta: {
      return_url: returnUrl,
    },
  };

  return postRequest(`${CASHFREE_PG_BASE_URL}/orders`, payload, getPGHeaders());
}

// Verify mechanic's bank account details before adding beneficiary
async function verifyBankAccount({ name, phone, ifsc, accountNumber }) {
  return postRequest(
    `${CASHFREE_BASE_URL}/payout/verifyBankAccount`,
    { name, phone, ifsc, account_number: accountNumber },
    getPayoutHeaders()
  );
}

// Verify mechanic's UPI VPA before adding beneficiary
async function verifyUPI(upiVpa) {
  return postRequest(
    `${CASHFREE_BASE_URL}/payout/validateUPI`,
    { upi: upiVpa },
    getPayoutHeaders()
  );
}

// Add a new beneficiary (mechanic bank or UPI details)
async function addBeneficiary(data = {}) {
  return postRequest(
    `${CASHFREE_BASE_URL}/payout/beneficiary`,
    data,
    getPayoutHeaders()
  );
}

// Get beneficiary details by ID
async function getBeneficiary(beneficiaryId) {
  if (!beneficiaryId) throw new Error("Missing beneficiary ID.");
  return getRequest(
    `${CASHFREE_BASE_URL}/payout/beneficiary?beneficiary_id=${beneficiaryId}`,
    getPayoutHeaders()
  );
}

// Remove beneficiary by ID
async function removeBeneficiary(beneficiaryId) {
  if (!beneficiaryId) throw new Error("Missing beneficiary ID.");
  return deleteRequest(
    `${CASHFREE_BASE_URL}/payout/beneficiary?beneficiary_id=${beneficiaryId}`,
    getPayoutHeaders()
  );
}

// Transfer money to mechanic's linked beneficiary account
async function transferMoney({
  transferId,
  amount,
  beneficiaryId,
  remarks = "Service earnings",
}) {
  const payload = {
    transfer_id: transferId,
    amount,
    currency: "INR",
    beneficiary_id: beneficiaryId,
    remarks,
  };
  return postRequest(
    `${CASHFREE_BASE_URL}/payout/transfers`,
    payload,
    getPayoutHeaders()
  );
}

// Get status of a payout transfer by ID
async function getTransferStatus(transferId) {
  return getRequest(
    `${CASHFREE_BASE_URL}/payout/transfers?transfer_id=${transferId}`,
    getPayoutHeaders()
  );
}

// Get an auth token for payouts (used internally)
async function getCashFreeToken() {
  return postRequest(
    `https://payout-gamma.cashfree.com/payout/v1/authorize`,
    {},
    getPayoutHeaders()
  );
}

// Get current payout account balance
async function getCashFreeBalance() {
  const { data = {} } = await getCashFreeToken();
  if (!data?.token) return { balance: 0, availableBalance: 0 };

  const payoutData = await getRequest(
    `https://payout-gamma.cashfree.com/payout/v1.2/getBalance`,
    { Authorization: `Bearer ${data.token}` }
  );

  return payoutData?.data || {};
}

module.exports = {
  generatePaymentLink,
  verifyBankAccount,
  verifyUPI,
  addBeneficiary,
  getBeneficiary,
  removeBeneficiary,
  transferMoney,
  getTransferStatus,
  getCashFreeToken,
  getCashFreeBalance,
};
