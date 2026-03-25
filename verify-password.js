const bcrypt = require('bcryptjs');
const password = 'teacher123456';
const hash = '$2a$10$JRxHUOTNFle1qQ5.qR30XuDdD4.pMTB5J4YHPe28Ua29BdqgpjWr.';

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.log('错误:', err);
    process.exit(1);
  }
  console.log('密码验证结果:', result ? '✅ 正确' : '❌ 错误');
  process.exit(0);
});
