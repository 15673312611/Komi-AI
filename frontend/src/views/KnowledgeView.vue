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
import { computed } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import KnowledgeExplorer from '@/components/knowledge/KnowledgeExplorer.vue'
import { userService } from '@/services/user'

const organizationId = computed(() => userService.getCurrentUser()?.organization_id ?? '')

const description =
  'AI 智能体学习的所有知识源文档与网页。审查和编辑提取的内容、手动录入自定义页面，并全生命周期管理知识库同步状态。'
</script>

<template>
  <DashboardLayout>
    <div class="knowledge-view">
      <KnowledgeExplorer
        v-if="organizationId"
        mode="org"
        variant="page"
        title="企业知识库管理"
        :description="description"
        :organization-id="organizationId"
        :show-plan-meters="true"
      />
    </div>
  </DashboardLayout>
</template>

<style scoped>
.knowledge-view {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}
</style>
