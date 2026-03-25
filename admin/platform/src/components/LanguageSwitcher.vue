<template>
  <el-dropdown trigger="click" @command="handleLanguageChange" v-sound:click>
    <span class="language-switcher">
      <el-icon><Translate /></el-icon>
      <span>{{ currentLanguage }}</span>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh" v-sound:hover>中文</el-dropdown-item>
        <el-dropdown-item command="en" v-sound:hover>English</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Translate } from '@element-plus/icons-vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import enUs from 'element-plus/es/locale/lang/en';

const { locale } = useI18n();

const currentLanguage = computed(() => {
  return locale.value === 'zh' ? '中文' : 'English';
});

function handleLanguageChange(lang) {
  locale.value = lang;
  localStorage.setItem('locale', lang);
  
  const elementLocales = {
    zh: zhCn,
    en: enUs
  };
  
  const app = document.querySelector('#app').__vue_app__;
  if (app) {
    app.config.globalProperties.$ELEMENT.locale = elementLocales[lang];
  }
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 0 8px;
  
  &:hover {
    color: var(--el-color-primary);
  }
}
</style>