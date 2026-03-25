import SoundEffects from '@/utils/soundEffects';

const soundEffect = {
  mounted(el, binding) {
    const type = binding.arg || 'hover';
    
    if (type === 'hover') {
      el.addEventListener('mouseenter', () => {
        SoundEffects.playHover();
      });
    } else if (type === 'focus') {
      el.addEventListener('focus', () => {
        SoundEffects.playFocus();
      });
    } else if (type === 'click') {
      el.addEventListener('click', () => {
        SoundEffects.playClick();
      });
    } else if (type === 'success') {
      el.addEventListener('click', () => {
        SoundEffects.playSuccess();
      });
    } else if (type === 'error') {
      el.addEventListener('click', () => {
        SoundEffects.playError();
      });
    } else if (type === 'delete') {
      el.addEventListener('click', () => {
        SoundEffects.playDelete();
      });
    } else if (type === 'notification') {
      el.addEventListener('mouseenter', () => {
        SoundEffects.playNotification();
      });
    } else if (type === 'edit') {
      el.addEventListener('click', () => {
        SoundEffects.playEdit();
      });
    } else if (type === 'open') {
      el.addEventListener('click', () => {
        SoundEffects.playOpen();
      });
    } else if (type === 'close') {
      el.addEventListener('click', () => {
        SoundEffects.playClose();
      });
    } else if (type === 'load') {
      el.addEventListener('click', () => {
        SoundEffects.playLoad();
      });
    } else if (type === 'save') {
      el.addEventListener('click', () => {
        SoundEffects.playSave();
      });
    }
  },
  
  unmounted(el, binding) {
    const type = binding.arg || 'hover';
    
    if (type === 'hover' || type === 'notification') {
      el.removeEventListener('mouseenter', SoundEffects.playHover);
    } else {
      el.removeEventListener('click', SoundEffects.playClick);
    }
  }
};

export default soundEffect;
