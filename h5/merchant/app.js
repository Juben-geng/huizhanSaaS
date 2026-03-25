const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
  setup() {
    const currentPage = ref('dashboard');
    const merchantInfo = ref(null);
    const isLoggedIn = ref(false);
    const loading = ref(true);
    const showLoginModal = ref(false);
    const socket = ref(null);
    const unreadCount = ref(0);

    const pages = {
      dashboard,
      booth,
      visitors,
      materials,
      chat,
      settings
    };

    onMounted(async () => {
      await checkLogin();
      if (isLoggedIn.value) {
        initSocket();
      }
      loading.value = false;
    });

    async function checkLogin() {
      const token = Storage.get('token');
      const merchant = Storage.get('merchantInfo');

      if (token && merchant) {
        try {
          const result = await request.get('/merchant/detail', {
            merchantId: merchant.merchantId
          });
          merchantInfo.value = result;
          isLoggedIn.value = true;
        } catch (error) {
          logout();
        }
      } else {
        showLoginModal.value = true;
      }
    }

    function initSocket() {
      const socketUrl = API_BASE_URL.replace('http', 'ws');
      socket.value = io(socketUrl, {
        auth: {
          token: Storage.get('token')
        }
      });

      socket.value.on('connect', () => {
        console.log('Socket connected');
      });

      socket.value.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socket.value.on('new-message', (data) => {
        unreadCount.value++;
        if (data.receiverId === merchantInfo.value.merchantId) {
          updateMessageList(data.message);
        }
      });

      socket.value.on('visitor-alert', (data) => {
        showNotification('新访客', `${data.nickName} 扫描了您的展位`);
      });

      socket.value.on('quota-alert', (data) => {
        showNotification('额度预警', data.message);
      });
    }

    function navigateTo(page) {
      currentPage.value = page;
    }

    function logout() {
      Storage.remove('token');
      Storage.remove('merchantInfo');
      merchantInfo.value = null;
      isLoggedIn.value = false;
      showLoginModal.value = true;

      if (socket.value) {
        socket.value.disconnect();
        socket.value = null;
      }
    }

    function showNotification(title, message) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body: message });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, { body: message });
            }
          });
        }
      }
    }

    function updateMessageList(message) {
      if (currentPage.value === 'chat') {
        const chatPage = document.querySelector('#chat-page');
        if (chatPage && chatPage.__vue__) {
          chatPage.__vue__.addMessage(message);
        }
      }
    }

    return {
      currentPage,
      merchantInfo,
      isLoggedIn,
      loading,
      showLoginModal,
      unreadCount,
      pages,
      navigateTo,
      logout
    };
  }
});

app.component('app-header', AppHeader);
app.component('app-footer', AppFooter);
app.mount('#app');
