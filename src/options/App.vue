<script setup lang="ts">
import { ref } from 'vue';
import SettingsTab from './components/SettingsTab.vue';
import RulesTab from './components/RulesTab.vue';
import SyncTab from './components/SyncTab.vue';

const activeTab = ref('settings');
</script>

<template>
  <div class="options-container">
    <div class="sidebar">
      <div class="logo">
        <h2>WebRTC Matrix</h2>
      </div>
      <nav>
        <div class="nav-item" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
          General Settings
        </div>
        <div class="nav-item" :class="{ active: activeTab === 'rules' }" @click="activeTab = 'rules'">
          Rule Management
        </div>
        <div class="nav-item" :class="{ active: activeTab === 'sync' }" @click="activeTab = 'sync'">
          Cloud Sync
        </div>
      </nav>
    </div>
    
    <div class="content">
      <SettingsTab v-if="activeTab === 'settings'" />
      <RulesTab v-if="activeTab === 'rules'" />
      <SyncTab v-if="activeTab === 'sync'" />
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  background-color: #121212;
  color: #e0e0e0;
}

.options-container {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.sidebar {
  width: 250px;
  background: #1f1f1f;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 20px;
  border-bottom: 1px solid #333;
}
.logo h2 {
  margin: 0;
  font-size: 18px;
  color: #1890ff;
}

nav {
  padding-top: 20px;
}

.nav-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
  color: #aaa;
}

.nav-item:hover {
  background: #2a2a2a;
  color: #fff;
}

.nav-item.active {
  background: #2a2a2a;
  color: #1890ff;
  border-left: 3px solid #1890ff;
}

.content {
  flex: 1;
  padding: 40px;
  max-width: 800px;
}
</style>
