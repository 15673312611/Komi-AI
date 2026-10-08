<!--
Copyright 2024-2026 Komi AI

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
defineProps<{ filtered: boolean }>()
const emit = defineEmits<{ (e: 'clear'): void; (e: 'create'): void }>()
</script>

<template>
  <div class="empty-state">
    <div class="glyph">∅</div>
    <template v-if="filtered">
      <div class="title">未找到匹配的工单</div>
      <div class="hint">请尝试清空筛选条件或调整搜索关键词。</div>
      <button class="action" @click="emit('clear')">清空筛选条件</button>
    </template>
    <template v-else>
      <div class="title">暂无工单数据</div>
      <div class="hint">
        当对话 AI 判定问题需要升级调查时会自动流转至此，您也可以手动创建工单。
      </div>
      <button class="action" @click="emit('create')">+ 新建工单</button>
    </template>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 66px 20px;
  text-align: center;
}
.glyph {
  width: 46px;
  height: 46px;
  margin: 0 auto 16px;
  border-radius: 14px;
  border: 1.5px dashed var(--o16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  color: var(--faint);
  font-size: 18px;
}
.title {
  font-family: var(--font-display);
  font-weight: var(--font-weight-semibold);
  font-size: 17px;
  margin-bottom: 6px;
  color: var(--text);
}
.hint {
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 18px;
}
.action {
  padding: 8px 16px;
  background: var(--o05);
  border: 1px solid var(--o12);
  color: var(--text);
  border-radius: 9px;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}
.action:hover {
  background: var(--o08);
}
</style>
