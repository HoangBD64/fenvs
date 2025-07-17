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
      <label>
        Search Title:
        <input v-model="filterTitle" placeholder="Enter product title..." />
      </label>
      <button class="sync-btn" @click="syncProducts" :disabled="!filterStoreId">Đồng bộ</button>
    </div>
    <button @click="showCreate = true">Create Product</button>
    <span v-if="productMessage" class="product-message">{{ productMessage }}</span>
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
      <button @click="prevPage" :disabled="filterPage === 1">Prev</button>
      <span>Page {{ filterPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="filterPage === totalPages">Next</button>
    </div>
    <div v-if="showCreate || editingProduct" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingProduct ? 'Edit' : 'Create' }} Product</h3>
        <form @submit.prevent="saveProduct">
          <div v-if="!editingProduct" class="template-store-row">
            <label v-if="templateList.length" class="template-label">
              <span class="template-icon">📋</span> Chọn template:
              <select v-model="selectedTemplateId" class="template-select" @change="() => { const t = templateList.find(t => t.id === selectedTemplateId); if (t) applyTemplate(t) }">
                <option value="">-- Không chọn --</option>
                <option v-for="tpl in templateList" :key="tpl.id" :value="tpl.id">{{ tpl.title || tpl.template_name || tpl.id }}</option>
              </select>
            </label>
            <label class="store-label">
              <span class="store-icon">🏬</span> Store ID:
              <select v-model="form.store_id" required class="store-select">
                <option value="">Chọn Store</option>
                <option v-for="store in storeList" :key="store.id" :value="store.id">
                  {{ store.name || store.domain || store.id }}
                </option>
              </select>
            </label>
          </div>
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
              <label style="flex:1">Body HTML:<textarea v-model="form.body_html" rows="2" /></label>
            </div>
          </fieldset>

          <fieldset class="section">
            <legend>Variants</legend>
            <div v-for="(variant, vIdx) in form.variants" :key="vIdx" class="variant-box">
              <div class="form-row">
                <label>Title:<input v-model="variant.title" placeholder="Variant title..." /></label>
                <label>Price:<input type="number" v-model.number="variant.price" placeholder="0" min="0" /></label>
                <label>Compare At Price:<input type="number" v-model.number="variant.compare_at_price" placeholder="0" min="0" /></label>
                <label>Quantity:<input type="number" v-model.number="variant.inventory_quantity" placeholder="0" min="0" /></label>
                <label>SKU:<input v-model="variant.sku" placeholder="SKU..." /></label>
                <!-- <label>Variant Image URL:<input v-model="variant.image" placeholder="Paste image link..." /></label> -->
                <div v-if="variant.image" style="margin-left:12px;display:flex;align-items:center;">
                  <img :src="variant.image" alt="Preview" style="width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid #eee;" />
                </div>
                <button type="button" class="remove-btn" @click="removeVariant(vIdx)">Remove</button>
              </div>
            </div>
            <button type="button" class="add-btn" @click="addVariant" :disabled="form.variants.length >= 3">Add Variant</button>
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
                <!-- <label>Variant IDs (comma separated):<input v-model="image.variant_idsStr" /> -->
                <button type="button" class="remove-btn" @click="removeImage(iIdx)">Remove Image</button>
                <div v-if="image.src" style="margin-left:12px;display:flex;align-items:center;">
                  <img :src="image.src" alt="Preview" style="width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid #eee;" />
                </div>
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
let filterTitleDebounceTimeout = null
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
const filterTitle = ref('') // Thêm biến filterTitle
const orders = ref([])
const syncMessage = ref('')
const productMessage = ref('') // Thông báo cho thao tác sản phẩm
const filterPage = ref(1)
const totalProducts = ref(0)
const totalPages = ref(1)
const templateList = ref([])
const selectedTemplateId = ref('')

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

function normalizeProductImages(product) {
  if ((!product.images || !Array.isArray(product.images) || product.images.length === 0) && product.image) {
    product.images = [{ src: product.image }];
  }
  return product;
}

const fetchProducts = async () => {
  let url = 'https://hoangnd.shopprint.click/api/product.json'
  const params = []
  params.push(`limit=${filterLimit.value}`)
  params.push(`page=${filterPage.value}`)
  if (filterStoreId.value) params.push(`store_id=${encodeURIComponent(filterStoreId.value)}`)
  if (filterIDs.value) params.push(`ids=${encodeURIComponent(filterIDs.value)}`)
  if (filterTitle.value) params.push(`title=${encodeURIComponent(filterTitle.value)}`)
  if (params.length) url += '?' + params.join('&')
  const res = await fetch(url)
  const data = await res.json()
  products.value = (data.products || data).map(normalizeProductImages)
  totalProducts.value = data.total || (Array.isArray(data.products) ? data.products.length : 0)
  totalPages.value = Math.max(1, Math.ceil(totalProducts.value / filterLimit.value))
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
  filterPage.value = 1
  fetchProducts()
}, { immediate: true })

// Debounce filterTitle
watch(filterTitle, () => {
  filterPage.value = 1
  if (filterTitleDebounceTimeout) clearTimeout(filterTitleDebounceTimeout)
  filterTitleDebounceTimeout = setTimeout(() => {
    fetchProducts()
  }, 300)
})

watch(showCreate, async (val) => {
  if (val && !editingProduct.value) {
    // Chỉ load khi tạo mới
    try {
      const res = await fetch('https://hoangnd.shopprint.click/api/template.json')
      const data = await res.json()
      if (Array.isArray(data.template)) {
        templateList.value = data.template
      } else if (Array.isArray(data)) {
        templateList.value = data
      } else {
        templateList.value = []
      }
    } catch (e) {
      templateList.value = []
    }
    selectedTemplateId.value = ''
  }
})

watch(editingProduct, (val) => {
  if (val) {
    // Map image_id sang image URL cho variant
    const imagesArr = Array.isArray(val.images) ? val.images : [];
    const variantsArr = Array.isArray(val.variants) ? val.variants : [];
    form.value = {
      ...val,
      variants: variantsArr.map(variant => ({
        ...variant,
        image: variant.image_id
          ? (imagesArr.find(img => img.id === variant.image_id)?.src || '')
          : (variant.image || '')
      })),
      options: Array.isArray(val.options)
        ? val.options.map(o => ({
            ...o,
            // valuesStr: Array.isArray(o.values) ? o.values.join(', ') : (o.valuesStr || '')
            valuesStr: Array.isArray(o.values) ? [...new Set(o.values)].join(', ') : (o.valuesStr || '')
          }))
        : [],
      images: imagesArr
    }
  } else {
    form.value = defaultForm()
  }
})


watch(selectedTemplateId, (val) => {
  if (val) {
    const template = templateList.value.find(t => t.id === val)
    if (template) {
      applyTemplate(template)
    }
  }
})


// watch(filterStoreId, fetchOrders, { immediate: true })

onMounted(() => {
  fetchStoreIds()
  fetchProducts()
})


function editProduct(product) {
  editingProduct.value = product
  form.value = {
    ...product,
    variants: Array.isArray(product.variants) ? product.variants : [],
    options: Array.isArray(product.options) ? product.options : [],
    images: Array.isArray(product.images) ? product.images : []
  }
  showCreate.value = true
}
function closeModal() {
  editingProduct.value = null
  showCreate.value = false
  form.value = defaultForm()
  fetchProducts()
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
    fulfillment_service: 'manual', // Luôn set mặc định
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
  // Lọc option trùng name, chỉ giữ lại option đầu tiên
  const seenOptionNames = new Set();
  const options = [];
  for (const opt of form.value.options) {
    const name = opt.name?.trim();
    if (name && !seenOptionNames.has(name)) {
      options.push({
        name,
        values: Array.isArray(opt.values)
          ? opt.values
          : (opt.valuesStr || '').split(',').map(v => v.trim()).filter(Boolean)
      });
      seenOptionNames.add(name);
    }
  }

  // Convert images variant_idsStr to array of int, và đảm bảo có id
  const images = form.value.images.map((img, idx) => ({
    ...img,
    id: img.id || img._local_id || (img.src ? idx + 1 : undefined),
    variant_ids: (img.variant_idsStr || '').split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
  }));

  // Map variant.image (URL) sang variant.image_id dựa trên images
  const variants = form.value.variants.map(variant => {
    let image_id = null;
    if (variant.image) {
      const found = images.find(img => img.src === variant.image);
      if (found && found.id) image_id = found.id;
    }
    return {
      ...variant,
      price: variant.price !== '' && variant.price !== null && !isNaN(Number(variant.price)) ? parseInt(variant.price) : 0,
      compare_at_price: variant.compare_at_price === '' || variant.compare_at_price === null || isNaN(Number(variant.compare_at_price)) ? null : parseInt(variant.compare_at_price),
      option2: variant.option2 === '' ? null : variant.option2,
      option3: variant.option3 === '' ? null : variant.option3,
      sku: variant.sku === '' ? null : variant.sku,
      fulfillment_service: !variant.fulfillment_service || variant.fulfillment_service === '' ? 'manual' : variant.fulfillment_service,
      image_id: image_id
    }
  });

  // Tạo payload
  const payload = {
    ...form.value,
    images,
    variants,
    options
  };
  return payload;
}
async function saveProduct() {
  const payload = prepareFormData()
  let success = false
  try {
    let res
    if (editingProduct.value) {
      res = await fetch(`https://hoangnd.shopprint.click/api/product/${editingProduct.value.id}?store_id=${encodeURIComponent(form.value.store_id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } else {
      res = await fetch(`https://hoangnd.shopprint.click/api/product.json?store_id=${encodeURIComponent(form.value.store_id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    }
    if (res && res.ok) {
      productMessage.value = editingProduct.value ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!'
      success = true
    } else {
      productMessage.value = editingProduct.value ? 'Cập nhật sản phẩm thất bại!' : 'Thêm sản phẩm thất bại!'
    }
  } catch {
    productMessage.value = editingProduct.value ? 'Cập nhật sản phẩm thất bại!' : 'Thêm sản phẩm thất bại!'
  }
  closeModal()
  fetchProducts()
  setTimeout(() => productMessage.value = '', 2000)
}
async function deleteProduct(id) {
  // Use the current filterStoreId as store_id for deletion
  let success = false
  try {
    const res = await fetch(`https://hoangnd.shopprint.click/api/product/${id}?store_id=${encodeURIComponent(filterStoreId.value)}`, { method: 'DELETE' })
    if (res && res.ok) {
      productMessage.value = 'Xóa sản phẩm thành công!'
      success = true
    } else {
      productMessage.value = 'Xóa sản phẩm thất bại!'
    }
  } catch {
    productMessage.value = 'Xóa sản phẩm thất bại!'
  }
  fetchProducts()
  setTimeout(() => productMessage.value = '', 2000)
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
  if (filterPage.value < totalPages.value) {
    filterPage.value++
    fetchProducts()
  }
}
function prevPage() {
  if (filterPage.value > 1) {
    filterPage.value--
    fetchProducts()
  }
}

function applyTemplate(template) {
  // Chuyển đổi dữ liệu template sang đúng định dạng form frontend
  form.value = {
    title: template.title || '',
    body_html: template.body_html || '',
    vendor: template.vendor || '',
    product_type: template.product_type || '',
    handle: template.handle || '',
    status: template.status || 'active',
    tags: template.tags || '',
    store_id: template.store_id || '',
    variants: (template.variants || []).map(v => ({
      title: v.title || '',
      price: v.price || '',
      compare_at_price: v.compare_at_price || null,
      option1: v.option1 || '',
      option2: v.option2 || null,
      option3: v.option3 || null,
      sku: v.sku || '',
      barcode: v.barcode || '',
      weight: v.weight || 0,
      weight_unit: v.weight_unit || 'kg',
      inventory_quantity: v.inventory_quantity || 0,
      inventory_management: v.inventory_management || null,
      fulfillment_service: v.fulfillment_service || 'manual',
      requires_shipping: v.requires_shipping !== undefined ? v.requires_shipping : true,
      taxable: v.taxable !== undefined ? v.taxable : true
    })),
    options: (template.options || []).map(o => ({
      name: o.name || '',
      // valuesStr: Array.isArray(o.values) ? o.values.join(', ') : ''
      valuesStr: Array.isArray(o.values) ? [...new Set(o.values)].join(', ') : ''
    })),
    images: (template.images || []).map(img => ({
      src: img.src || '',
      position: img.position || 0,
      variant_idsStr: ''
    }))
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
  /* animation chỉ chạy khi mount, không bị trigger lại */
  animation: modalFadeIn 0.25s;
  will-change: opacity;
}
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-content {
  background: #fff;
  padding: 36px 32px 32px 32px;
  border-radius: 18px;
  min-width: 910px;
  width: 1270px;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px #3182ce33, 0 2px 8px #0002;
  /* animation chỉ chạy khi mount, không bị trigger lại */
  animation: modalContentIn 0.3s;
  will-change: transform, opacity;
}
@keyframes modalContentIn {
  from { transform: translateY(40px) scale(0.98); opacity: 0; }
  to { transform: none; opacity: 1; }
}
.section {
  border: 1.5px solid #cbd5e1;
  border-radius: 14px;
  margin-bottom: 28px;
  padding: 22px 24px 16px 24px;
  background: #f8fafc;
  box-shadow: 0 1px 8px #3182ce11;
  transition: box-shadow 0.2s;
}
.section legend {
  font-weight: bold;
  padding: 0 12px;
  color: #3182ce;
  font-size: 1.15rem;
  letter-spacing: 0.5px;
  background: #e3e8ee;
  border-radius: 8px;
  margin-bottom: 8px;
}
.form-row {
  display: flex;
  gap: 22px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
  box-shadow: 0 1px 4px #3182ce08;
  padding-bottom: 2px;
}
.form-row label {
  display: flex;
  flex-direction: column;
  font-size: 16px;
  min-width: 140px;
  flex: 1;
  color: #374151;
  font-weight: 500;
  margin-bottom: 0;
}
input, textarea, select {
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 1rem;
  margin-top: 4px;
  background: #f8fafc;
  /* Tắt hiệu ứng transition */
  /* transition: border 0.2s, box-shadow 0.2s; */
  box-shadow: 0 1px 4px #3182ce08;
}

input:focus, textarea:focus, select:focus {
  border: 2px solid #3182ce;
  outline: none;
  box-shadow: 0 2px 8px #3182ce22;
}

.variant-box, .option-box, .image-box {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: #f1f5f9;
  box-shadow: 0 1px 6px #3182ce11;
  /* Tắt hiệu ứng transition */
  /* transition: box-shadow 0.2s; */
}
/* Tắt hiệu ứng hover */
/*
.variant-box:hover, .option-box:hover, .image-box:hover {
  box-shadow: 0 2px 12px #3182ce22;
}
*/
.form-actions {
  display: flex;
  gap: 22px;
  justify-content: flex-end;
  margin-top: 28px;
}
.form-actions button {
  font-size: 1.08rem;
  font-weight: 700;
  padding: 10px 32px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(90deg, #3182ce 60%, #63b3ed 100%);
  color: #fff;
  box-shadow: 0 2px 8px #3182ce22;
  /* Tắt hiệu ứng transition */
  /* transition: background 0.2s, box-shadow 0.2s, transform 0.1s; */
  cursor: pointer;
}
/* Tắt hiệu ứng hover */
/*
.form-actions button:hover {
  background: linear-gradient(90deg, #2563eb 60%, #4299e1 100%);
  box-shadow: 0 4px 16px #3182ce33;
  transform: translateY(-2px) scale(1.04);
}
*/
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
.template-select-row {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
.template-label {
  font-size: 1rem;
  font-weight: 600;
  color: #3182ce;
  display: flex;
  align-items: center;
  gap: 8px;
}
.template-icon {
  font-size: 1.2em;
  margin-right: 4px;
}
.template-select {
  margin-left: 10px;
  padding: 7px 18px;
  border-radius: 8px;
  border: 1.5px solid #90cdf4;
  background: #f0f9ff;
  font-size: 1rem;
  font-weight: 500;
  /* Tắt hiệu ứng transition */
  /* transition: border 0.2s, box-shadow 0.2s; */
  box-shadow: 0 1px 4px #3182ce11;
}
/* Tắt hiệu ứng focus */
/*
.template-select:focus {
  border: 2px solid #3182ce;
  outline: none;
  box-shadow: 0 2px 8px #3182ce22;
}
*/
.store-label {
  font-size: 1rem;
  font-weight: 600;
  color: #38a169;
  display: flex;
  align-items: center;
  gap: 8px;
}
.store-icon {
  font-size: 1.2em;
  margin-right: 4px;
}
.store-select {
  margin-left: 10px;
  padding: 7px 18px;
  border-radius: 8px;
  border: 1.5px solid #68d391;
  background: #f8fff4;
  font-size: 1rem;
  font-weight: 500;
  /* Tắt hiệu ứng transition */
  /* transition: border 0.2s, box-shadow 0.2s; */
  box-shadow: 0 1px 4px #38a16911;
}

.store-select:focus {
  border: 2px solid #38a169;
  outline: none;
  box-shadow: 0 2px 8px #38a16922;
}

.template-store-row {
  display: flex;
  gap: 32px;
  margin-bottom: 18px;
  align-items: flex-end;
}
.template-store-row > label {
  flex: 1 1 0;
  min-width: 180px;
}
.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #cbd5e1 !important;
  color: #888 !important;
  box-shadow: none !important;
}
.product-message {
  color: #3182ce;
  font-weight: 600;
  margin-left: 16px;
  font-size: 1rem;
  display: inline-block;
}
@media (max-width: 700px) {
  .container {
    padding: 10px 2vw;
  }
  /* Không responsive modal-content/template-store-row */
}
</style> 