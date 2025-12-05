<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { StorageManager, AppState } from '../../utils/storage';
import { WebDAVClient, WebDAVConfig } from '../../utils/webdav';
import browser from 'webextension-polyfill';

const config = ref<WebDAVConfig>({
  url: '',
  username: '',
  password: ''
});

const statusMsg = ref('');
const statusType = ref<'info' | 'success' | 'error'>('info');
const lastSyncTime = ref<string>('Never');
const isSyncing = ref(false);

const CONFIG_FILENAME = 'webrtc-matrix-config.json';
const SYNC_KEY = 'webdav_config';

onMounted(async () => {
  // Load saved WebDAV config (credentials should ideally be in secure storage, 
  // but for MV3 simple storage.local or storage.sync is often used if not implementing full encrypted storage)
  // Note: chrome.storage.session is clearer after restart, but better for password.
  // We'll use local for URL/User and session for password? Or just local for now as "Remember me"
  
  const stored = await browser.storage.local.get(SYNC_KEY);
  if (stored[SYNC_KEY]) {
    config.value = stored[SYNC_KEY];
  }
  
  const meta = await browser.storage.local.get('lastSyncTime');
  if (meta.lastSyncTime) {
    lastSyncTime.value = new Date(meta.lastSyncTime).toLocaleString();
  }
});

const saveConfig = async () => {
  await browser.storage.local.set({ [SYNC_KEY]: config.value });
};

const getClient = () => new WebDAVClient(config.value);

const testConnection = async () => {
  if (!config.value.url) {
    showStatus('Please enter a WebDAV URL', 'error');
    return;
  }
  
  isSyncing.value = true;
  showStatus('Connecting...', 'info');
  
  try {
    const client = getClient();
    const success = await client.checkConnection();
    if (success) {
      showStatus('Connection Successful!', 'success');
      saveConfig();
    } else {
      showStatus('Connection Failed. Check URL/Auth.', 'error');
    }
  } catch (e) {
    showStatus('Connection Error: ' + e, 'error');
  } finally {
    isSyncing.value = false;
  }
};

const uploadConfig = async () => {
  isSyncing.value = true;
  showStatus('Uploading configuration...', 'info');
  
  try {
    const client = getClient();
    
    // Get full state
    const rules = await StorageManager.getRules();
    const settings = await StorageManager.getSettings();
    const meta = await StorageManager.getMeta();
    
    const state: AppState = {
      rules,
      settings,
      meta: { ...meta, lastModified: Date.now() }
    };
    
    const json = JSON.stringify(state, null, 2);
    const success = await client.uploadConfig(CONFIG_FILENAME, json);
    
    if (success) {
      showStatus('Upload Successful!', 'success');
      updateLastSync();
    } else {
      showStatus('Upload Failed.', 'error');
    }
  } catch (e) {
    showStatus('Upload Error: ' + e, 'error');
  } finally {
    isSyncing.value = false;
  }
};

const downloadConfig = async () => {
  isSyncing.value = true;
  showStatus('Downloading configuration...', 'info');
  
  try {
    const client = getClient();
    const content = await client.downloadConfig(CONFIG_FILENAME);
    
    if (!content) {
      showStatus('Remote configuration file not found.', 'error');
      return;
    }
    
    let remoteState: AppState;
    try {
      remoteState = JSON.parse(content);
    } catch (e) {
      showStatus('Invalid JSON in remote file.', 'error');
      return;
    }
    
    // Simple Merge Strategy: Overwrite if remote is valid
    // Or check timestamps?
    
    // If we want a smart merge (Last Write Wins)
    /*
    if (remoteState.meta.lastModified < currentMeta.lastModified) {
       const confirm = window.confirm("Local config is newer than remote. Overwrite local anyway?");
       if (!confirm) {
         showStatus("Cancelled. Local config is newer.", 'info');
         return;
       }
    }
    */
    
    // Applying Remote State
    await StorageManager.setRules(remoteState.rules);
    await StorageManager.setSettings(remoteState.settings);
    // Don't overwrite version if not needed, but update meta
    
    showStatus('Download & Sync Successful!', 'success');
    updateLastSync();
    
  } catch (e) {
    showStatus('Download Error: ' + e, 'error');
  } finally {
    isSyncing.value = false;
  }
};

const updateLastSync = async () => {
  const time = Date.now();
  lastSyncTime.value = new Date(time).toLocaleString();
  await browser.storage.local.set({ lastSyncTime: time });
};

const showStatus = (msg: string, type: 'info' | 'success' | 'error') => {
  statusMsg.value = msg;
  statusType.value = type;
};

</script>

<template>
  <div class="sync-tab">
    <div class="card">
      <h3>WebDAV Configuration</h3>
      <div class="form-group">
        <label>Server URL</label>
        <input v-model="config.url" type="text" placeholder="https://cloud.example.com/remote.php/webdav/">
      </div>
      <div class="form-group">
        <label>Username</label>
        <input v-model="config.username" type="text">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input v-model="config.password" type="password">
      </div>
      
      <div class="actions">
        <button @click="testConnection" :disabled="isSyncing">Test Connection</button>
      </div>
    </div>

    <div class="card">
      <h3>Sync Actions</h3>
      <p class="desc">Last Synced: {{ lastSyncTime }}</p>
      
      <div class="sync-buttons">
        <button class="primary" @click="uploadConfig" :disabled="isSyncing">
           ↑ Upload (Push)
        </button>
        <button class="primary" @click="downloadConfig" :disabled="isSyncing">
           ↓ Download (Pull)
        </button>
      </div>
    </div>
    
    <div v-if="statusMsg" class="status-bar" :class="statusType">
      {{ statusMsg }}
    </div>
  </div>
</template>

<style scoped>
.sync-tab {
  max-width: 600px;
}

.card {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #444;
}

h3 { margin-top: 0; color: #eee; }
.desc { color: #aaa; margin-bottom: 15px; }

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #ccc;
  font-size: 13px;
}

input {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  box-sizing: border-box;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.sync-buttons {
  display: flex;
  gap: 15px;
}

button {
  padding: 8px 16px;
  background: #444;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #555;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.primary {
  background: #1890ff;
  flex: 1;
}
button.primary:hover {
  background: #40a9ff;
}

.status-bar {
  padding: 12px;
  border-radius: 4px;
  margin-top: 20px;
  text-align: center;
  font-weight: bold;
}

.status-bar.info { background: #333; color: #eee; }
.status-bar.success { background: #1d3a1d; color: #52c41a; }
.status-bar.error { background: #5a1d1d; color: #ff4d4f; }
</style>
