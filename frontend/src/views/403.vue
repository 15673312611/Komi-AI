<!--
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { resolveLandingRoute } from '@/router/landing'

// Not '/': that redirects to the landing route, which for a user who was just
// denied is often another denial. Resolved once — the component is created
// fresh per visit, and permissions do not change mid-render.
const landingRoute = resolveLandingRoute()
</script>

<template>
  <DashboardLayout>
    <div class="unauthorized">
      <h1>访问受限 (403)</h1>
      <p>抱歉，您当前的角色账号没有权限访问该页面或功能。</p>
      <router-link :to="landingRoute" class="back-link">
        返回您的主页
      </router-link>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.unauthorized {
  padding: var(--space-xl);
  text-align: center;
}

.back-link {
  display: inline-block;
  margin-top: var(--space-lg);
  color: var(--primary-color);
  text-decoration: none;
}
</style> 