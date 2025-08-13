// 待开发，目标：使用webwork发送ops日志
function workerFunction() {
  // Worker 内部逻辑
  onmessage = function(event) {
    const { command, data } = event.data;

    if (command === 'calculate') {
      // 模拟耗时计算
      const sum = data.numbers.reduce((a, b) => a + b, 0);
      postMessage({ status: 'success', result: sum });
    } else {
      postMessage({ status: 'error', message: '未知命令' });
    }
  };

  // Worker 内部错误处理
  // eslint-disable-next-line no-restricted-globals
  onerror = function(error) {
    postMessage({ status: 'error', message: error.message });
  };
}

const workerCode = workerFunction.toString();
const workerBlob = new Blob(
  [`(${workerCode})()`], // 自执行函数
  { type: 'application/javascript' }
);

const workerUrl = URL.createObjectURL(workerBlob);
export default workerUrl;