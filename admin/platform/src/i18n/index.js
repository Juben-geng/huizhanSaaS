import { createI18n } from 'vue-i18n';
import zh from './locales/zh';
import en from './locales/en';

const messages = {
  zh,
  en
};

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh',
  fallbackLocale: 'zh',
  messages
});

export default i18n;