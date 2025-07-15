<template>
  <div class="container">
    <div class="header-section">
      <h2>Products</h2>
      <button class="add-store-btn" @click="showAddStore = true">Add Store</button>
    </div>
    <div class="store-filter-box">
      <label>Store ID:
        <select v-model="filterStoreId">
          <option value="">Any</option>
          <option v-for="store in storeList" :key="store.id" :value="store.id">
            {{ store.name || store.domain || store.id }}
          </option>
        </select>
      </label>
      <button class="sync-btn" @click="syncProducts" :disabled="!filterStoreId">Đồng bộ</button>
    </div>
    <button @click="showCreate = true">Create Product</button>
    <table>
      <thead>
        <tr>
          <th>Image</th>
          <th>ID</th>
          <th>Title</th>
          <th>Vendor</th>
          <th>Type</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>
            <img v-if="product.images && product.images.length > 0" :src="product.images[0].src" alt="Product Image" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #eee;" />
          </td>
          <td>{{ product.id }}</td>
          <td>{{ product.title }}</td>
          <td>{{ product.vendor }}</td>
          <td>{{ product.product_type }}</td>
          <td>{{ product.created_at }}</td>
          <td>
            <div class="action-btn-group">
              <button @click="viewProduct(product)">View</button>
              <button @click="editProduct(product)">Edit</button>
              <button @click="deleteProduct(product.id)">Delete</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="pagination-box">
      <button @click="prevPage" :disabled="filterStoreId ? pageStack.length === 0 : filterPage === 1">Prev</button>
      <span v-if="filterStoreId">Page {{ pageStack.length + 1 }}</span>
      <span v-else>Page {{ filterPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="filterStoreId ? !nextPageInfo : filterPage === totalPages">Next</button>
    </div>
    <div v-if="showCreate || editingProduct" class="modal">
      <div class="modal-content">
        <h3>{{ editingProduct ? 'Edit' : 'Create' }} Product</h3>
        <form @submit.prevent="saveProduct">
          <fieldset class="section">
            <legend>Product Information</legend>
            <div class="form-row">
              <label>Title:<input v-model="form.title" required /></label>
              <label>Vendor:<input v-model="form.vendor" required /></label>
              <label>Product Type:<input v-model="form.product_type" required /></label>
            </div>
            <div class="form-row">
              <label>Handle:<input v-model="form.handle" /></label>
              <label>Status:
                <select v-model="form.status">
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label>Tags:<input v-model="form.tags" /></label>
            </div>
            <div class="form-row">
              <label>Store ID:<input v-model="form.store_id" /></label>
            </div>
            <div class="form-row">
              <label style="flex:1">Body HTML:<textarea v-model="form.body_html" rows="2" /></label>
            </div>
          </fieldset>

          <fieldset class="section">
            <legend>Variants</legend>
            <div v-for="(variant, vIdx) in form.variants" :key="vIdx" class="variant-box">
              <div class="form-row">
                <label>Title:<input v-model="variant.title" /></label>
                <label>Price:<input v-model="variant.price" /></label>
                <label>Compare At Price:<input v-model="variant.compare_at_price" /></label>
                <label>SKU:<input v-model="variant.sku" /></label>
                <label>Barcode:<input v-model="variant.barcode" /></label>
              </div>
              <div class="form-row">
                <label>Option1:<input v-model="variant.option1" /></label>
                <label>Option2:<input v-model="variant.option2" /></label>
                <label>Option3:<input v-model="variant.option3" /></label>
                <label>Weight:<input type="number" v-model.number="variant.weight" /></label>
                <label>Weight Unit:<input v-model="variant.weight_unit" /></label>
              </div>
              <div class="form-row">
                <label>Inventory Quantity:<input type="number" v-model.number="variant.inventory_quantity" /></label>
                <label>Inventory Management:<input v-model="variant.inventory_management" /></label>
                <label>Fulfillment Service:<input v-model="variant.fulfillment_service" /></label>
                <label>Requires Shipping:<input type="checkbox" v-model="variant.requires_shipping" /></label>
                <label>Taxable:<input type="checkbox" v-model="variant.taxable" /></label>
              </div>
              <button type="button" class="remove-btn" @click="removeVariant(vIdx)">Remove Variant</button>
            </div>
            <button type="button" class="add-btn" @click="addVariant">Add Variant</button>
          </fieldset>

          <fieldset class="section">
            <legend>Options</legend>
            <div v-for="(option, oIdx) in form.options" :key="oIdx" class="option-box">
              <div class="form-row">
                <label>Name:<input v-model="option.name" /></label>
                <label>Values (comma separated):<input v-model="option.valuesStr" /></label>
                <button type="button" class="remove-btn" @click="removeOption(oIdx)">Remove Option</button>
              </div>
            </div>
            <button type="button" class="add-btn" @click="addOption">Add Option</button>
          </fieldset>

          <fieldset class="section">
            <legend>Images</legend>
            <div v-for="(image, iIdx) in form.images" :key="iIdx" class="image-box">
              <div class="form-row">
                <label>Src:<input v-model="image.src" /></label>
                <label>Position:<input type="number" v-model.number="image.position" /></label>
                <label>Variant IDs (comma separated):<input v-model="image.variant_idsStr" /></label>
                <button type="button" class="remove-btn" @click="removeImage(iIdx)">Remove Image</button>
              </div>
            </div>
            <button type="button" class="add-btn" @click="addImage">Add Image</button>
          </fieldset>

          <div class="form-actions">
            <button type="submit">Save</button>
            <button type="button" @click="closeModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="viewingProduct" class="modal">
      <div class="modal-content">
        <h3>Product Detail</h3>
        <div class="product-detail-box">
          <h4>General Information</h4>
          <table class="detail-table">
            <tr><td><b>ID</b></td><td>{{ viewingProduct.id }}</td></tr>
            <tr><td><b>Title</b></td><td>{{ viewingProduct.title }}</td></tr>
            <tr><td><b>Body HTML</b></td><td><div v-html="viewingProduct.body_html" /></td></tr>
            <tr><td><b>Vendor</b></td><td>{{ viewingProduct.vendor }}</td></tr>
            <tr><td><b>Product Type</b></td><td>{{ viewingProduct.product_type }}</td></tr>
            <tr><td><b>Handle</b></td><td>{{ viewingProduct.handle }}</td></tr>
            <tr><td><b>Status</b></td><td>{{ viewingProduct.status }}</td></tr>
            <tr><td><b>Tags</b></td><td>{{ viewingProduct.tags }}</td></tr>
            <tr><td><b>Store ID</b></td><td>{{ viewingProduct.store_id }}</td></tr>
            <tr><td><b>Created At</b></td><td>{{ viewingProduct.created_at }}</td></tr>
          </table>
          <div v-if="viewingProduct.variants && viewingProduct.variants.length">
            <h4>Variants</h4>
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Title</th><th>Price</th><th>Compare At Price</th><th>SKU</th><th>Barcode</th><th>Option1</th><th>Option2</th><th>Option3</th><th>Weight</th><th>Weight Unit</th><th>Inventory Qty</th><th>Inventory Mgmt</th><th>Fulfillment</th><th>Requires Shipping</th><th>Taxable</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(v, idx) in viewingProduct.variants" :key="idx">
                  <td>{{ v.title }}</td>
                  <td>{{ v.price }}</td>
                  <td>{{ v.compare_at_price }}</td>
                  <td>{{ v.sku }}</td>
                  <td>{{ v.barcode }}</td>
                  <td>{{ v.option1 }}</td>
                  <td>{{ v.option2 }}</td>
                  <td>{{ v.option3 }}</td>
                  <td>{{ v.weight }}</td>
                  <td>{{ v.weight_unit }}</td>
                  <td>{{ v.inventory_quantity }}</td>
                  <td>{{ v.inventory_management }}</td>
                  <td>{{ v.fulfillment_service }}</td>
                  <td>{{ v.requires_shipping ? 'Yes' : 'No' }}</td>
                  <td>{{ v.taxable ? 'Yes' : 'No' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="viewingProduct.options && viewingProduct.options.length">
            <h4>Options</h4>
            <table class="detail-table">
              <thead>
                <tr><th>Name</th><th>Values</th></tr>
              </thead>
              <tbody>
                <tr v-for="(o, idx) in viewingProduct.options" :key="idx">
                  <td>{{ o.name }}</td>
                  <td>{{ Array.isArray(o.values) ? o.values.join(', ') : o.values }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="viewingProduct.images && viewingProduct.images.length">
            <h4>Images</h4>
            <div class="image-list">
              <div v-for="(img, idx) in viewingProduct.images" :key="idx" class="image-item">
                <img v-if="img.src" :src="img.src" alt="Product Image" class="detail-img" />
                <div><b>Position:</b> {{ img.position }}</div>
                <div><b>Variant IDs:</b> {{ Array.isArray(img.variant_ids) ? img.variant_ids.join(', ') : img.variant_ids }}</div>
              </div>
            </div>
          </div>
        </div>
        <button @click="closeView">Close</button>
      </div>
    </div>
    <div v-if="showAddStore" class="modal">
      <div class="modal-content">
        <h3>Add Store</h3>
        <form @submit.prevent="saveStore">
          <div class="form-row">
            <label>Name: <input v-model="storeForm.name" required /></label>
          </div>
          <div class="form-row">
            <label>Domain: <input v-model="storeForm.domain" required /></label>
          </div>
          <div class="form-row">
            <label>Token: <input v-model="storeForm.token" required /></label>
          </div>
          <div class="form-actions">
            <button type="submit">Save</button>
            <button type="button" @click="closeAddStore">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <NuxtLink to="/">Back</NuxtLink>
    <span v-if="syncMessage" class="sync-message">{{ syncMessage }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
const products = ref([])
const showCreate = ref(false)
const editingProduct = ref(null)
const viewingProduct = ref(null)
const showAddStore = ref(false)
const storeForm = ref({ name: '', domain: '', token: '' })
const storeList = ref([])
const filterStoreId = ref('')
const filterPageInfo = ref('')
const filterLimit = ref(10)
const filterIDs = ref('')
const orders = ref([])
const syncMessage = ref('')
const nextPageInfo = ref('')
const pageStack = ref([]) // stack lưu page_info các trang trước
const filterPage = ref(1)
const totalProducts = ref(0)
const totalPages = ref(1)

const defaultForm = () => ({
  title: '',
  body_html: '',
  vendor: '',
  product_type: '',
  handle: '',
  status: 'active',
  tags: '',
  store_id: 'a2d7e9c0-9b6f-11ee-a1f2-0242ac120003',
  variants: [],
  options: [],
  images: []
})

const form = ref(defaultForm())

const fetchProducts = async () => {
  let url = 'https://hoangnd.shopprint.click/api/product.json'
  const params = []
  if (filterStoreId.value) {
    // Cursor-based pagination
    params.push(`store_id=${encodeURIComponent(filterStoreId.value)}`)
    if (filterPageInfo.value) params.push(`page_info=${encodeURIComponent(filterPageInfo.value)}`)
    params.push(`limit=10`)
    if (filterIDs.value) params.push(`ids=${encodeURIComponent(filterIDs.value)}`)
  } else {
    // Offset-based pagination
    params.push(`limit=${filterLimit.value}`)
    params.push(`page=${filterPage.value}`)
    if (filterIDs.value) params.push(`ids=${encodeURIComponent(filterIDs.value)}`)
  }
  if (params.length) url += '?' + params.join('&')
  const res = await fetch(url)
  const data = await res.json()
  products.value = data.products || data
  nextPageInfo.value = data.page_info || ''
  if (!filterStoreId.value) {
    totalProducts.value = data.total || (Array.isArray(data.products) ? data.products.length : 0)
    totalPages.value = Math.max(1, Math.ceil(totalProducts.value / filterLimit.value))
  }
}

// const fetchOrders = async () => {
//   if (!filterStoreId.value) {
//     orders.value = []
//     return
//   }
//   let url = `https://hoangnd.shopprint.click/api/order.json?store_id=${encodeURIComponent(filterStoreId.value)}`
//   const res = await fetch(url)
//   const data = await res.json()
//   orders.value = data.orders || data
// }

const fetchStoreIds = async () => {
  const res = await fetch('https://hoangnd.shopprint.click/api/store.json')
  const data = await res.json()
  storeList.value = Array.isArray(data) ? data : []
  if (!filterStoreId.value && storeList.value.length > 0) {
    filterStoreId.value = storeList.value[0].id
  }
}


watch([filterStoreId, filterIDs], () => {
  filterPageInfo.value = ''
  pageStack.value = []
  filterPage.value = 1 // reset page when filter changes
  fetchProducts()
}, { immediate: true })

//watch(filterStoreId, fetchOrders, { immediate: true })

onMounted(() => {
  fetchStoreIds()
  fetchProducts()
})


function editProduct(product) {
  editingProduct.value = product
  form.value = { ...product }
  showCreate.value = false
}
function closeModal() {
  editingProduct.value = null
  showCreate.value = false
  form.value = defaultForm()
}

function closeAddStore() {
  showAddStore.value = false
  storeForm.value = { name: '', domain: '', token: '' }
}

async function saveStore() {
  try {
    const res = await fetch('https://hoangnd.shopprint.click/api/store.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeForm.value)
    })
    if (res.ok) {
      closeAddStore()
      fetchStoreIds() // Refresh store list
      syncMessage.value = 'Store added successfully!'
      setTimeout(() => syncMessage.value = '', 2000)
    } else {
      syncMessage.value = 'Failed to add store!'
      setTimeout(() => syncMessage.value = '', 2000)
    }
  } catch (error) {
    syncMessage.value = 'Failed to add store!'
    setTimeout(() => syncMessage.value = '', 2000)
  }
}

function addVariant() {
  form.value.variants.push({
    title: 'Default Title',
    price: '0',
    compare_at_price: null,
    option1: 'Default Title',
    option2: null,
    option3: null,
    sku: null,
    barcode: '',
    weight: 0,
    weight_unit: 'kg', // Hợp lệ: 'kg', 'g', 'lb', 'oz'
    inventory_quantity: 0,
    inventory_management: null, // hoặc 'shopify' nếu dùng quản lý kho
    fulfillment_service: 'manual', // Shopify yêu cầu
    requires_shipping: true,
    taxable: true
  })
}

function removeVariant(idx) {
  form.value.variants.splice(idx, 1)
}
function addOption() {
  form.value.options.push({ name: '', valuesStr: '' })
}
function removeOption(idx) {
  form.value.options.splice(idx, 1)
}
function addImage() {
  form.value.images.push({ src: '', position: 0, variant_idsStr: '' })
}
function removeImage(idx) {
  form.value.images.splice(idx, 1)
}
function prepareFormData() {
  // Convert options valuesStr to array
  const options = form.value.options.map(opt => ({
    name: opt.name,
    values: opt.valuesStr.split(',').map(v => v.trim()).filter(Boolean)
  }))
  // Convert images variant_idsStr to array of int
  const images = form.value.images.map(img => ({
    src: img.src,
    position: img.position,
    variant_ids: img.variant_idsStr.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
  }))
  // Convert compare_at_price, option2, option3, sku to null if empty string
  const variants = form.value.variants.map(variant => ({
    ...variant,
    compare_at_price: variant.compare_at_price === '' ? null : variant.compare_at_price,
    option2: variant.option2 === '' ? null : variant.option2,
    option3: variant.option3 === '' ? null : variant.option3,
    sku: variant.sku === '' ? null : variant.sku
  }))
  return {
    ...form.value,
    options,
    images,
    variants
  }
}
async function saveProduct() {
  const payload = prepareFormData()
  if (editingProduct.value) {
    await fetch(`https://hoangnd.shopprint.click/api/product/${editingProduct.value.id}?store_id=${encodeURIComponent(form.value.store_id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } else {
    await fetch(`https://hoangnd.shopprint.click/api/product.json?store_id=${encodeURIComponent(form.value.store_id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }
  closeModal()
  fetchProducts()
}
async function deleteProduct(id) {
  if (!filterStoreId.value) {
    alert('Vui lòng chọn Store trước khi xóa sản phẩm!');
    return;
  }
  await fetch(`https://hoangnd.shopprint.click/api/product/${id}?store_id=${encodeURIComponent(filterStoreId.value)}`, { method: 'DELETE' });
  fetchProducts();
}
async function syncProducts() {
  if (!filterStoreId.value) return
  try {
    const res = await fetch(`https://hoangnd.shopprint.click/api/product/sync.json?store_id=${encodeURIComponent(filterStoreId.value)}`, {
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
function viewProduct(product) {
  viewingProduct.value = product
}
function closeView() {
  viewingProduct.value = null
}
function nextPage() {
  if (filterStoreId.value) {
    // Cursor-based
    if (nextPageInfo.value) {
      pageStack.value.push(filterPageInfo.value)
      filterPageInfo.value = nextPageInfo.value
      fetchProducts()
    }
  } else {
    // Offset-based
    if (filterPage.value < totalPages.value) {
      filterPage.value++
      fetchProducts()
    }
  }
}
function prevPage() {
  if (filterStoreId.value) {
    // Cursor-based
    if (pageStack.value.length > 0) {
      filterPageInfo.value = pageStack.value.pop() || ''
      fetchProducts()
    }
  } else {
    // Offset-based
    if (filterPage.value > 1) {
      filterPage.value--
      fetchProducts()
    }
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
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.add-store-btn {
  background: linear-gradient(90deg, #38a169 60%, #68d391 100%);
  color: #fff;
  border: none;
  padding: 6px 18px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px #38a16922;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
}
.add-store-btn:hover {
  background: linear-gradient(90deg, #2f855a 60%, #48bb78 100%);
  box-shadow: 0 4px 16px #38a16933;
  transform: translateY(-2px) scale(1.03);
}
.store-filter-box {
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.store-filter-box label {
  font-size: 1rem;
  font-weight: 500;
  color: #444;
}
.store-filter-box select {
  margin-left: 8px;
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 1rem;
  transition: border 0.2s;
}
.store-filter-box select:focus {
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
.add-btn {
  background: linear-gradient(90deg, #38a169 60%, #68d391 100%);
  color: #fff;
  border: none;
  margin-top: 8px;
}
.add-btn:hover {
  background: linear-gradient(90deg, #2f855a 60%, #48bb78 100%);
}
.remove-btn {
  background: linear-gradient(90deg, #e53e3e 60%, #feb2b2 100%);
  color: #fff;
  border: none;
  margin-left: 10px;
}
.remove-btn:hover {
  background: linear-gradient(90deg, #c53030 60%, #fc8181 100%);
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
.section {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  margin-bottom: 22px;
  padding: 18px 20px 12px 20px;
  background: #f8fafc;
}
.section legend {
  font-weight: bold;
  padding: 0 8px;
  color: #3182ce;
  font-size: 1.1rem;
}
.form-row {
  display: flex;
  gap: 18px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.form-row label {
  display: flex;
  flex-direction: column;
  font-size: 15px;
  min-width: 140px;
  flex: 1;
  color: #374151;
}
input, textarea {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 7px 12px;
  font-size: 1rem;
  margin-top: 4px;
  background: #f8fafc;
  transition: border 0.2s;
}
input:focus, textarea:focus {
  border: 1.5px solid #3182ce;
  outline: none;
}
.variant-box, .option-box, .image-box {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  padding: 12px 14px;
  background: #f1f5f9;
  box-shadow: 0 1px 4px #3182ce11;
}
.form-actions {
  display: flex;
  gap: 18px;
  justify-content: flex-end;
  margin-top: 22px;
}
.product-detail-box {
  margin-bottom: 18px;
}
.detail-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 6px #3182ce11;
}
.detail-table th, .detail-table td {
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  font-size: 15px;
  text-align: left;
}
.detail-table th {
  background: #e3e8ee;
  color: #2d3748;
}
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 10px;
}
.image-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  background: #f1f5f9;
  min-width: 120px;
  max-width: 180px;
  text-align: center;
  box-shadow: 0 1px 4px #3182ce11;
}
.detail-img {
  max-width: 100%;
  max-height: 100px;
  margin-bottom: 6px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
}
.action-btn-group {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  align-items: center;
}
.order-list-box {
  margin-bottom: 18px;
  background: #f8fafc;
  border-radius: 10px;
  box-shadow: 0 2px 12px #3182ce11;
  padding: 18px 20px;
}
.order-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}
.order-table th, .order-table td {
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  font-size: 15px;
  text-align: left;
}
.order-table th {
  background: #e3e8ee;
  color: #2d3748;
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
@media (max-width: 700px) {
  .container {
    padding: 10px 2vw;
  }
  .modal-content {
    padding: 12px 2vw;
    min-width: 0;
  }
  .form-row label {
    min-width: 100px;
    font-size: 13px;
  }
  th, td, .detail-table th, .detail-table td {
    font-size: 13px;
    padding: 6px 4px;
  }
}
</style> 