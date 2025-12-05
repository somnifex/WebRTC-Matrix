<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { StorageManager, Rule } from '../../utils/storage';

const rules = ref<Rule[]>([]);
const searchTerm = ref('');
const newDomain = ref('');
const newAction = ref<'allow' | 'block'>('block');

onMounted(async () => {
  rules.value = await StorageManager.getRules();
});

const filteredRules = computed(() => {
  if (!searchTerm.value) return rules.value;
  return rules.value.filter(r => r.domain.includes(searchTerm.value));
});

const addRule = async () => {
  if (!newDomain.value) return;
  
  // Check duplicate
  const exists = rules.value.find(r => r.domain === newDomain.value);
  if (exists) {
    exists.action = newAction.value;
    exists.timestamp = Date.now();
  } else {
    rules.value.push({
      id: crypto.randomUUID(),
      domain: newDomain.value,
      action: newAction.value,
      timestamp: Date.now()
    });
  }
  
  await StorageManager.setRules(rules.value);
  newDomain.value = '';
};

const removeRule = async (id: string) => {
  rules.value = rules.value.filter(r => r.id !== id);
  await StorageManager.setRules(rules.value);
};

</script>

<template>
  <div class="rules-tab">
    <div class="action-bar">
      <input v-model="searchTerm" placeholder="Search domains..." class="search-input">
      
      <div class="add-box">
        <input v-model="newDomain" placeholder="example.com or *.example.com" @keyup.enter="addRule">
        <select v-model="newAction">
          <option value="allow">Allow</option>
          <option value="block">Block</option>
        </select>
        <button @click="addRule">Add Rule</button>
      </div>
    </div>

    <div class="rules-list">
      <div class="rule-header">
        <span>Domain</span>
        <span>Action</span>
        <span></span>
      </div>
      
      <div v-for="rule in filteredRules" :key="rule.id" class="rule-item">
        <span class="domain">{{ rule.domain }}</span>
        <span class="action" :class="rule.action">{{ rule.action.toUpperCase() }}</span>
        <button class="delete-btn" @click="removeRule(rule.id)">×</button>
      </div>
      
      <div v-if="filteredRules.length === 0" class="empty">
        No rules found.
      </div>
    </div>
  </div>
</template>

<style scoped>
.action-bar {
  margin-bottom: 20px;
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
}

.search-input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  background: #333;
  border: 1px solid #555;
  color: #fff;
}

.add-box {
  display: flex;
  gap: 10px;
}

.add-box input {
  flex: 1;
  padding: 8px;
  background: #333;
  border: 1px solid #555;
  color: #fff;
}

.add-box select {
  padding: 8px;
  background: #333;
  border: 1px solid #555;
  color: #fff;
}

button {
  padding: 8px 16px;
  background: #1890ff;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #40a9ff;
}

.rules-list {
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
}

.rule-header, .rule-item {
  display: grid;
  grid-template-columns: 1fr 100px 50px;
  padding: 12px 15px;
  align-items: center;
  border-bottom: 1px solid #333;
}

.rule-header {
  background: #333;
  font-weight: bold;
  color: #aaa;
}

.action {
  font-weight: bold;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  text-align: center;
}

.action.block {
  background: #5a1d1d;
  color: #ff4d4f;
}

.action.allow {
  background: #1d3a1d;
  color: #52c41a;
}

.delete-btn {
  background: transparent;
  color: #aaa;
  font-size: 20px;
  padding: 0;
  width: 30px;
  height: 30px;
}

.delete-btn:hover {
  color: #ff4d4f;
  background: transparent;
}

.empty {
  padding: 20px;
  text-align: center;
  color: #666;
}
</style>
