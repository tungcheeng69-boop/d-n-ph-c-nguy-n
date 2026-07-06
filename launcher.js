const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Cấu hình tham số môi trường
const PORT = process.env.PORT || 3000;
process.env.PORT = PORT;
process.env.NODE_ENV = 'production';
process.env.HOSTNAME = '127.0.0.1'; // Giới hạn chỉ chạy loopback tránh cảnh báo tường lửa Windows

const rootDir = __dirname;
const nodeExe = path.join(rootDir, 'bin', 'node.exe');
const serverJs = path.join(rootDir, 'server.js');

if (!fs.existsSync(serverJs)) {
  console.error("Lỗi: Không tìm thấy file server.js trong thư mục local!");
  console.error("Vui lòng đảm bảo cấu trúc thư mục chính xác.");
  readlineHelper();
  return;
}

// Kiểm tra node.exe portable
const nodePath = fs.existsSync(nodeExe) ? nodeExe : 'node';

console.log("=========================================================");
console.log("          K H Ở I   Đ Ộ N G   T E C H P R O J E C T      ");
console.log("=========================================================");
console.log(`  Ứng dụng đang được khởi chạy tại: http://localhost:${PORT}`);
console.log("  Vui lòng GIỮ cửa sổ này luôn mở khi sử dụng phần mềm.");
console.log("  Để dừng ứng dụng: Nhấn phím Ctrl + C trong cửa sổ này.");
console.log("=========================================================");

const serverProcess = spawn(nodePath, [serverJs], {
  cwd: rootDir,
  env: process.env,
  stdio: 'inherit'
});

// Tự động mở trình duyệt sau 1.5 giây
setTimeout(() => {
  console.log(`\n> Đang tự động mở trình duyệt tại http://localhost:${PORT}...`);
  exec(`start http://localhost:${PORT}`);
}, 1500);

// Đăng ký dọn dẹp tiến trình khi đóng
const cleanExit = () => {
  console.log("\nĐang dừng máy chủ Next.js và thoát...");
  serverProcess.kill('SIGINT');
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', () => {
  serverProcess.kill();
});

function readlineHelper() {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Nhấn Enter để thoát...', () => {
    rl.close();
    process.exit(1);
  });
}
