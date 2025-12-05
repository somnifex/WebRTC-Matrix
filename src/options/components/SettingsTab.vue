<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { StorageManager, Settings, GlobalPolicy, RuleAction } from '../../utils/storage';
import { PrivacyBlocker } from '../../background/blocker'; // We can't import background code directly in some bundlers if it has node deps, but here it's shared code structure. Wait, `blocker.ts` imports `browser`.
// Note: importing from 'background' might be risky if it executes code. PrivacyBlocker.init() is side-effecty.
// Better to just update storage, and let background listen to storage changes. Background logic should NOT be imported here.

const settings = ref<Settings | null>(null);
const loading = ref(true);
const saveStatus = ref('');

onMounted(async () => {
  settings.value = await StorageManager.getSettings();
  loading.value = false;
});

const saveSettings = async () => {
  if (!settings.value) return;
  await StorageManager.setSettings(settings.value);
  saveStatus.value = 'Saved!';
  setTimeout(() => saveStatus.value = '', 2000);
};
</script>

<template>
  <div class="settings-tab" v-if="settings">
    <div class="card">
      <h3>Global Browser Policy (Level 2)</h3>
      <p class="desc">
        Configure the browser's native WebRTC IP handling policy. This acts as a fallback for domains not covered by specific rules.
      </p>
      <div class="form-group">
        <label>Policy:</label>
        <select v-model="settings.globalPolicy" @change="saveSettings">
          <option value="default">Default (Browser Default)</option>
          <option value="default_public_interface_only">Default Public Interface Only (Recommended)</option>
          <option value="disable_non_proxied_udp">Disable Non-Proxied UDP (Force Proxy)</option>
        </select>
      </div>
    </div>

    <div class="card">
      <h3>Default Rule Action (Level 1)</h3>
      <p class="desc">
        What should happen to domains that are NOT in your rule list?
      </p>
      <div class="form-group">
        <label>Default Action:</label>
        <select v-model="settings.defaultRule" @change="saveSettings">
          <option value="allow">Allow by default</option>
          <option value="block">Block by default</option>
        </select>
      </div>
    </div>

    <div class="card">
      <h3>Appearance</h3>
      <div class="form-group row">
        <input type="checkbox" id="badge" v-model="settings.showIconBadge" @change="saveSettings">
        <label for="badge">Show status badge on extension icon</label>
      </div>
    </div>

    <div class="status-msg" v-if="saveStatus">{{ saveStatus }}</div>
  </div>
  <div v-else>Loading...</div>
</template>

<style scoped>
.card {
  background: #2a2a2a;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #444;
}

h3 {
  margin-top: 0;
  color: #eee;
}

.desc {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 10px;
}

.form-group.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

select {
  padding: 8px;
  border-radius: 4px;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  width: 100%;
  max-width: 400px;
}

.status-msg {
  color: #52c41a;
  position: fixed;
  bottom: 20px;
  right: 20px;
}
</style>
