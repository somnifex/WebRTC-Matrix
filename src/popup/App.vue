<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import browser from 'webextension-polyfill';
import { StorageManager, Rule, Settings } from '../utils/storage';
import { matchRule } from '../utils/match';

const currentDomain = ref('');
const isBlocked = ref(false);
const isLoading = ref(true);
const error = ref('');
const settings = ref<Settings | null>(null);

// Get current tab domain
const getCurrentTab = async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0 && tabs[0].url) {
    const url = new URL(tabs[0].url);
    if (url.protocol.startsWith('http')) {
      return url.hostname;
    }
  }
  return null;
};

// Check status
const checkStatus = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    const domain = await getCurrentTab();
    if (!domain) {
      currentDomain.value = 'Unknown / Restricted';
      isLoading.value = false;
      return;
    }
    
    currentDomain.value = domain;
    
    settings.value = await StorageManager.getSettings();
    const rules = await StorageManager.getRules();
    
    const action = matchRule(domain, rules);
    
    if (action) {
      isBlocked.value = action === 'block';
    } else {
      isBlocked.value = settings.value.defaultRule === 'block';
    }
  } catch (e) {
    console.error('Failed to check status:', e);
    error.value = 'Failed to load status.';
  } finally {
    isLoading.value = false;
  }
};

// Toggle Rule
const toggleBlock = async () => {
  if (!currentDomain.value || currentDomain.value.includes(' ')) return;
  
  try {
    const newState = !isBlocked.value;
    isBlocked.value = newState;
    
    const rules = await StorageManager.getRules();
    const existingIndex = rules.findIndex(r => r.domain === currentDomain.value);
    
    const newAction = newState ? 'block' : 'allow';
    
    if (existingIndex >= 0) {
      rules[existingIndex].action = newAction;
      rules[existingIndex].timestamp = Date.now();
    } else {
      rules.push({
        id: crypto.randomUUID(),
        domain: currentDomain.value,
        action: newAction,
        timestamp: Date.now()
      });
    }
    
    await StorageManager.setRules(rules);
  } catch (e) {
    console.error('Failed to toggle rule:', e);
    error.value = 'Failed to save rule.';
    // Revert state on error?
    isBlocked.value = !isBlocked.value;
  }
};

const openOptions = () => {
  browser.runtime.openOptionsPage();
};

const reloadPage = () => {
  browser.tabs.reload();
};

onMounted(() => {
  checkStatus();
});

const statusColor = computed(() => isBlocked.value ? '#ff4d4f' : '#52c41a');
const statusText = computed(() => isBlocked.value ? 'BLOCKED' : 'ALLOWED');

</script>

<template>
  <div class="popup-container">
    <div class="header">
      <h2>WebRTC Matrix</h2>
    </div>

    <div class="main-content" v-if="!isLoading && currentDomain && !currentDomain.includes(' ')">
      <div class="domain-info">
        {{ currentDomain }}
      </div>

      <div class="toggle-section" @click="toggleBlock">
        <div class="power-btn" :style="{ backgroundColor: statusColor }">
          <span class="icon">⏻</span>
        </div>
        <div class="status-label" :style="{ color: statusColor }">
          {{ statusText }}
        </div>
      </div>
      
      <p class="hint">Click button to toggle rule for this domain</p>
    </div>
    
    <div v-else-if="!isLoading">
      <p>System page or invalid context.</p>
    </div>
    
    <div v-else>
      <p>Loading...</p>
    </div>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <div class="footer">
      <button @click="openOptions">Dashboard</button>
      <button @click="reloadPage" class="secondary">Refresh Page</button>
    </div>
  </div>
</template>

<style scoped>
.popup-container {
  width: 320px;
  background-color: #1f1f1f;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding-bottom: 10px;
}

.header h2 {
  margin: 0;
  padding: 15px;
  text-align: center;
  font-size: 18px;
  border-bottom: 1px solid #333;
}

.main-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.domain-info {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 20px;
  word-break: break-all;
  text-align: center;
}

.toggle-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.power-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  transition: transform 0.2s;
}

.power-btn:hover {
  transform: scale(1.05);
}

.status-label {
  margin-top: 15px;
  font-weight: bold;
  font-size: 16px;
}

.hint {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.footer {
  display: flex;
  justify-content: space-around;
  padding: 10px 20px;
  border-top: 1px solid #333;
}

button {
  background: #333;
  border: 1px solid #444;
  color: #eee;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

button:hover {
  background: #444;
}

button.secondary {
  color: #aaa;
}

.error-banner {
  background: #5a1d1d;
  color: #ff4d4f;
  padding: 8px;
  text-align: center;
  font-size: 12px;
  position: absolute;
  bottom: 50px;
  width: 100%;
}
</style>
