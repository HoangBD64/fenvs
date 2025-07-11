<template>
  <div class="container">
    <h2>Orders</h2>
    <div class="store-filter-box">
      <label>Store ID:
        <select v-model="filterStoreId">
          <option value="">Any</option>
          <!-- <option v-for="id in storeIdOptions" :key="id" :value="id">{{ id }}</option> -->
          <!-- test -->
          <option v-for="s in storeIdOptions" :key="s.id" :value="s.id">
            {{ s.label }}
          </option>
        </select>
      </label>
      <button class="sync-btn" @click="syncOrders" :disabled="!filterStoreId">Đồng bộ</button>
      <div class="order-filter-row">
        <label>Status:
          <select v-model="filterStatus">
            <option value="">Any</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label>Fulfillment Status:
          <select v-model="filterFulfillmentStatus">
            <option value="">Any</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="partial">Partial</option>
          </select>
        </label>
        <label>Start Time:
          <input v-model="filterStartTime" type="date" />
        </label>
        <label>End Time:
          <input v-model="filterEndTime" type="date" />
        </label>
      </div>
    </div>
    <span v-if="syncMessage" class="sync-message">{{ syncMessage }}</span>
    <!-- <button @click="showCreate = true">Create Order</button> -->
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>{{ order.id }}</td>
          <td>{{ order.name }}</td>
          <td>{{ order.email }}</td>
          <td>{{ order.financial_status }}</td>
          <td>{{ order.created_at }}</td>
          <td>
            <div class="action-btn-group">
              <button @click="viewOrder(order)">View</button>
              <button @click="editOrder(order)">Edit</button>
              <button @click="deleteOrder(order.id)">Delete</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination-box">
      <button @click="prevPage" :disabled="orderPageStack.length === 0">Prev</button>
      <span>Page {{ orderPageStack.length + 1 }}</span>
      <button @click="nextPage" :disabled="!orderNextPageInfo">Next</button>
    </div>
    <div v-if="showCreate || editingOrder" class="modal">
      <div class="modal-content">
        <h3>{{ editingOrder ? 'Edit' : 'Create' }} Order</h3>
        <form @submit.prevent="saveOrder">
          <label>Name: <input v-model="form.name" required /></label><br />
          <label>Email: <input v-model="form.email" required /></label><br />
          <label>Status: <input v-model="form.financial_status" required /></label><br />
          <button type="submit">Save</button>
          <button type="button" @click="closeModal">Cancel</button>
        </form>
      </div>
    </div>
    <div v-if="viewingOrder" class="modal">
      <div class="modal-content">
        <h3>Order Detail</h3>
        <div class="order-detail-box">
          <h4>General Information</h4>
          <table class="detail-table">
            <tr><td><b>Order ID</b></td><td>{{ viewingOrder.id }}</td></tr>
            <tr><td><b>Order Name</b></td><td>{{ viewingOrder.name }}</td></tr>
            <tr><td><b>Order Number</b></td><td>{{ viewingOrder.order_number }}</td></tr>
            <tr><td><b>Email</b></td><td>{{ viewingOrder.email }}</td></tr>
            <tr><td><b>Contact Email</b></td><td>{{ viewingOrder.contact_email }}</td></tr>
            <tr><td><b>Financial Status</b></td><td>{{ viewingOrder.financial_status }}</td></tr>
            <tr><td><b>Fulfillment Status</b></td><td>{{ viewingOrder.fulfillment_status }}</td></tr>
            <tr><td><b>Currency</b></td><td>{{ viewingOrder.currency }}</td></tr>
            <tr><td><b>Total Price</b></td><td>{{ viewingOrder.total_price }} {{ viewingOrder.currency }}</td></tr>
            <tr><td><b>Subtotal Price</b></td><td>{{ viewingOrder.subtotal_price }} {{ viewingOrder.currency }}</td></tr>
            <tr><td><b>Total Tax</b></td><td>{{ viewingOrder.total_tax }} {{ viewingOrder.currency }}</td></tr>
            <tr><td><b>Total Discounts</b></td><td>{{ viewingOrder.total_discounts }} {{ viewingOrder.currency }}</td></tr>
            <tr><td><b>Created At</b></td><td>{{ viewingOrder.created_at }}</td></tr>
            <tr><td><b>Updated At</b></td><td>{{ viewingOrder.updated_at }}</td></tr>
            <tr><td><b>Processed At</b></td><td>{{ viewingOrder.processed_at }}</td></tr>
            <tr><td><b>Source</b></td><td>{{ viewingOrder.source_name }}</td></tr>
            <tr><td><b>Test Order</b></td><td>{{ viewingOrder.test ? 'Yes' : 'No' }}</td></tr>
          </table>

          <div v-if="viewingOrder.customer">
            <h4>Customer Information</h4>
            <table class="detail-table">
              <tr><td><b>Customer ID</b></td><td>{{ viewingOrder.customer.id }}</td></tr>
              <tr><td><b>First Name</b></td><td>{{ viewingOrder.customer.first_name }}</td></tr>
              <tr><td><b>Last Name</b></td><td>{{ viewingOrder.customer.last_name }}</td></tr>
              <tr><td><b>Email</b></td><td>{{ viewingOrder.customer.email }}</td></tr>
              <tr><td><b>Phone</b></td><td>{{ viewingOrder.customer.phone || 'N/A' }}</td></tr>
              <tr><td><b>Created At</b></td><td>{{ viewingOrder.customer.created_at }}</td></tr>
              <tr><td><b>Updated At</b></td><td>{{ viewingOrder.customer.updated_at }}</td></tr>
            </table>
          </div>

          <div v-if="viewingOrder.billing_address">
            <h4>Billing Address</h4>
            <table class="detail-table">
              <tr><td><b>Name</b></td><td>{{ viewingOrder.billing_address.name }}</td></tr>
              <tr><td><b>First Name</b></td><td>{{ viewingOrder.billing_address.first_name }}</td></tr>
              <tr><td><b>Last Name</b></td><td>{{ viewingOrder.billing_address.last_name }}</td></tr>
              <tr><td><b>Address 1</b></td><td>{{ viewingOrder.billing_address.address1 }}</td></tr>
              <tr><td><b>Address 2</b></td><td>{{ viewingOrder.billing_address.address2 || 'N/A' }}</td></tr>
              <tr><td><b>City</b></td><td>{{ viewingOrder.billing_address.city }}</td></tr>
              <tr><td><b>Province</b></td><td>{{ viewingOrder.billing_address.province || 'N/A' }}</td></tr>
              <tr><td><b>Country</b></td><td>{{ viewingOrder.billing_address.country }}</td></tr>
              <tr><td><b>Country Code</b></td><td>{{ viewingOrder.billing_address.country_code }}</td></tr>
              <tr><td><b>ZIP</b></td><td>{{ viewingOrder.billing_address.zip }}</td></tr>
              <tr><td><b>Phone</b></td><td>{{ viewingOrder.billing_address.phone || 'N/A' }}</td></tr>
              <tr><td><b>Latitude</b></td><td>{{ viewingOrder.billing_address.latitude }}</td></tr>
              <tr><td><b>Longitude</b></td><td>{{ viewingOrder.billing_address.longitude }}</td></tr>
            </table>
          </div>

          <div v-if="viewingOrder.line_items && viewingOrder.line_items.length">
            <h4>Line Items</h4>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant ID</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>SKU</th>
                  <th>Vendor</th>
                  <th>Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in viewingOrder.line_items" :key="idx">
                  <td>{{ item.title }}</td>
                  <td>{{ item.variant_id }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.price }} {{ viewingOrder.currency }}</td>
                  <td>{{ (parseFloat(item.price) * item.quantity).toFixed(2) }} {{ viewingOrder.currency }}</td>
                  <td>{{ item.sku || 'N/A' }}</td>
                  <td>{{ item.vendor }}</td>
                  <td>{{ item.fulfillment_status }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="viewingOrder.tax_lines && viewingOrder.tax_lines.length">
            <h4>Tax Lines</h4>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Rate</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(tax, idx) in viewingOrder.tax_lines" :key="idx">
                  <td>{{ tax.title }}</td>
                  <td>{{ (tax.rate * 100).toFixed(2) }}%</td>
                  <td>{{ tax.price }} {{ viewingOrder.currency }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="viewingOrder.fulfillments && viewingOrder.fulfillments.length">
            <h4>Fulfillments</h4>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Tracking Company</th>
                  <th>Tracking Number</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(fulfillment, idx) in viewingOrder.fulfillments" :key="idx">
                  <td>{{ fulfillment.id }}</td>
                  <td>{{ fulfillment.status }}</td>
                  <td>{{ fulfillment.tracking_company || 'N/A' }}</td>
                  <td>{{ fulfillment.tracking_number || 'N/A' }}</td>
                  <td>{{ fulfillment.created_at }}</td>
                  <td>{{ fulfillment.updated_at }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="viewingOrder.discount_codes && viewingOrder.discount_codes.length">
            <h4>Discount Codes</h4>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(discount, idx) in viewingOrder.discount_codes" :key="idx">
                  <td>{{ discount.code }}</td>
                  <td>{{ discount.type }}</td>
                  <td>{{ discount.amount }} {{ viewingOrder.currency }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <button @click="closeView">Close</button>
      </div>
    </div>
    <NuxtLink to="/">Back</NuxtLink>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
const orders = ref([])
const showCreate = ref(false)
const editingOrder = ref(null)
const viewingOrder = ref(null)
const form = ref({ name: '', email: '', financial_status: '' })
// const storeIdOptions = ref([])
//test
const storeIdOptions = computed(() =>
  storeList.value.map(s => ({
    id: s.id,
    label: s.name || s.domain || s.id
  }))
)
const filterStoreId = ref(storeIdOptions[0])
const filterStatus = ref('')
const filterStartTime = ref('')
const filterEndTime = ref('')
const filterFulfillmentStatus = ref('')
const syncMessage = ref('')
const orderNextPageInfo = ref('')
const orderPageStack = ref([])
const orderPageInfo = ref('')

const fetchOrders = async () => {
  let url = 'https://hoangnd.shopprint.click/api/order.json'
  const params = []
  if (filterStoreId.value) params.push(`store_id=${encodeURIComponent(filterStoreId.value)}`)
  if (filterStatus.value) params.push(`status=${encodeURIComponent(filterStatus.value)}`)
  if (filterStartTime.value) {
    const d = new Date(filterStartTime.value + 'T00:00:00.000Z')
    params.push(`start_time=${encodeURIComponent(d.toISOString())}`)
  }
  if (filterEndTime.value) {
    const d = new Date(filterEndTime.value + 'T23:59:59.999Z')
    params.push(`end_time=${encodeURIComponent(d.toISOString())}`)
  }
  if (filterFulfillmentStatus.value) params.push(`fulfillment_status=${encodeURIComponent(filterFulfillmentStatus.value)}`)
  if (orderPageInfo.value) params.push(`page_info=${encodeURIComponent(orderPageInfo.value)}`)
  params.push('limit=10')
  if (params.length) url += '?' + params.join('&')
  const res = await fetch(url)
  const data = await res.json()
  orders.value = data.orders || data
  orderNextPageInfo.value = data.page_info || ''
}

const storeList = ref([])

const fetchStoreIds = async () => {
  const res = await fetch('https://hoangnd.shopprint.click/api/store.json')
  const data = await res.json()
  storeList.value = Array.isArray(data) ? data : []
  if (!filterStoreId.value && storeList.value.length > 0) {
    filterStoreId.value = storeList.value[0].id
  }
}

onMounted(() => {
  fetchStoreIds()
  fetchOrders()
})
watch([filterStoreId, filterStatus, filterStartTime, filterEndTime, filterFulfillmentStatus], () => {
  orderPageInfo.value = ''
  orderPageStack.value = []
  fetchOrders()
})

function nextPage() {
  if (orderNextPageInfo.value) {
    orderPageStack.value.push(orderPageInfo.value)
    orderPageInfo.value = orderNextPageInfo.value
    fetchOrders()
  }
}
function prevPage() {
  if (orderPageStack.value.length > 0) {
    orderPageInfo.value = orderPageStack.value.pop() || ''
    fetchOrders()
  }
}

function viewOrder(order) {
  viewingOrder.value = order
}

function closeView() {
  viewingOrder.value = null
}

function editOrder(order) {
  editingOrder.value = order
  form.value = { ...order }
  showCreate.value = false
}
function closeModal() {
  editingOrder.value = null
  showCreate.value = false
  form.value = { name: '', email: '', financial_status: '' }
}
async function saveOrder() {
  if (editingOrder.value) {
    await fetch(`https://hoangnd.shopprint.click/order.json/${editingOrder.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  } else {
    await fetch('https://hoangnd.shopprint.click/order.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  }
  closeModal()
  fetchOrders()
}
async function deleteOrder(id) {
  await fetch(`https://hoangnd.shopprint.click/orders/${id}.json`, { method: 'DELETE' })
  fetchOrders()
}
async function syncOrders() {
  if (!filterStoreId.value) return
  try {
    const res = await fetch(`https://hoangnd.shopprint.click/api/order/sync.json?store_id=${encodeURIComponent(filterStoreId.value)}`, {
      method: 'POST'
    })
    if (res.ok) {
      syncMessage.value = 'Đồng bộ thành công!'
      setTimeout(() => syncMessage.value = '', 2000)
    } else {
      syncMessage.value = 'Đồng bộ thất bại!'
      setTimeout(() => syncMessage.value = '', 2000)
    }
  } catch {
    syncMessage.value = 'Đồng bộ thất bại!'
    setTimeout(() => syncMessage.value = '', 2000)
  }
}
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 40px auto;
  background: #fff;
  padding: 36px 28px 32px 28px;
  border-radius: 16px;
  box-shadow: 0 4px 24px #0002;
}
h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 18px;
  color: #2d3748;
  letter-spacing: 1px;
}
.store-filter-box {
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.store-filter-box label {
  font-size: 1rem;
  font-weight: 500;
  color: #444;
  margin-bottom: 4px;
}
.store-filter-box select, .store-filter-box input[type="date"], .store-filter-box input[type="text"], .store-filter-box input[type="number"] {
  margin-left: 8px;
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 1rem;
  transition: border 0.2s;
}
.store-filter-box select:focus, .store-filter-box input:focus {
  border: 1.5px solid #3182ce;
  outline: none;
}
button {
  margin: 0 4px;
  padding: 6px 18px;
  border-radius: 6px;
  border: none;
  background: linear-gradient(90deg, #3182ce 60%, #63b3ed 100%);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px #3182ce22;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
}
button:hover {
  background: linear-gradient(90deg, #2563eb 60%, #4299e1 100%);
  box-shadow: 0 4px 16px #3182ce33;
  transform: translateY(-2px) scale(1.03);
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
  background: #f8fafc;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px #3182ce11;
}
th, td {
  border: 1px solid #e2e8f0;
  padding: 10px 14px;
  text-align: left;
  font-size: 1rem;
}
th {
  background: #e3e8ee;
  color: #2d3748;
  font-weight: 700;
}
tbody tr:hover {
  background: #ebf8ff;
  transition: background 0.2s;
}
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #0007;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  padding: 32px 28px;
  border-radius: 14px;
  min-width: 350px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px #3182ce33;
}
.sync-btn {
  margin-left: 10px;
  background: linear-gradient(90deg, #38a169 60%, #68d391 100%);
  color: #fff;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  border-radius: 6px;
  padding: 6px 18px;
  box-shadow: 0 2px 8px #38a16922;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
}
.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sync-btn:hover:enabled {
  background: linear-gradient(90deg, #2f855a 60%, #48bb78 100%);
  box-shadow: 0 4px 16px #38a16933;
  transform: translateY(-2px) scale(1.03);
}
.sync-message {
  color: #38a169;
  font-weight: 600;
  margin-left: 16px;
  font-size: 1rem;
}
.order-filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-left: 18px;
}
.order-filter-row label {
  font-size: 1rem;
  font-weight: 500;
  color: #444;
  margin-bottom: 0;
}
.order-filter-row select, .order-filter-row input[type="date"] {
  margin-left: 8px;
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 1rem;
  transition: border 0.2s;
}
.order-filter-row select:focus, .order-filter-row input:focus {
  border: 1.5px solid #3182ce;
  outline: none;
}
.pagination-box {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  justify-content: center;
}
.pagination-box button {
  background: linear-gradient(90deg, #3182ce 60%, #63b3ed 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px #3182ce22;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
}
.pagination-box button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-box button:hover:enabled {
  background: linear-gradient(90deg, #2563eb 60%, #4299e1 100%);
  box-shadow: 0 4px 16px #3182ce33;
  transform: translateY(-2px) scale(1.03);
}
.pagination-box span {
  font-weight: 600;
  color: #2d3748;
  font-size: 1.1rem;
}
.order-detail-box {
  margin-top: 20px;
  padding: 15px;
  background: #f0f9eb;
  border-radius: 8px;
  border: 1px solid #e1f3d8;
}
.detail-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.detail-table th, .detail-table td {
  border: 1px solid #e1f3d8;
  padding: 8px 12px;
  text-align: left;
}
.detail-table th {
  background-color: #e1f3d8;
  color: #2f6c46;
  font-weight: 600;
}
.detail-table tbody tr:hover {
  background-color: #f9fcf6;
}

.action-btn-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-btn-group button {
  margin: 0;
  padding: 4px 12px;
  font-size: 0.9rem;
}
@media (max-width: 700px) {
  .container {
    padding: 10px 2vw;
  }
  .modal-content {
    padding: 12px 2vw;
    min-width: 0;
  }
  .store-filter-box label {
    min-width: 100px;
    font-size: 13px;
  }
  .order-filter-row label {
    min-width: 100px;
    font-size: 13px;
  }
  th, td {
    font-size: 13px;
    padding: 6px 4px;
  }
}
</style> 