<template>
  <div class="container">
    <h1>Landing Page - API Test</h1>
    <nav>
      <NuxtLink to="/products">Products</NuxtLink> |
      <NuxtLink to="/orders">Orders</NuxtLink>
    </nav>
    <p>Chọn một mục để kiểm tra API backend.</p>
  </div>
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 40px auto;
  padding: 32px;
  border-radius: 12px;
  background: #f8f9fa;
  box-shadow: 0 2px 12px #0001;
  text-align: center;
}
nav {
  margin: 24px 0;
}
nav a {
  color: #0070f3;
  text-decoration: none;
  font-weight: bold;
  margin: 0 12px;
}
nav a:hover {
  text-decoration: underline;
}
</style> 