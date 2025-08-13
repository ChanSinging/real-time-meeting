class WebSocketClient {
	constructor(url) {
		this.url = url;
		this.socket = null;
		this.messageCallbacks = [];  // 消息监听回调数组
    this.errorCallbacks = [];  
	}

	/** 初始化连接 */
  connect() {
    if (this.socket) {
      console.warn('WebSocket 已连接，无需重复初始化');
      return;
    }
    this.socket = new WebSocket(this.url);
    // 连接成功
    this.socket.onopen = () => {
      console.log('WebSocket 连接已建立');
    };
    // 接收消息
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);  // 假设服务器返回 JSON
        this.messageCallbacks.forEach(callback => callback(data));
      } catch (error) {
        console.error('消息解析失败:', error);
      }
    };
    // 错误处理
    this.socket.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      this.errorCallbacks.forEach(callback => callback(error));
    };
    // 连接关闭
    this.socket.onclose = () => {
      console.log('WebSocket 连接已关闭');
      this.socket = null;
    };
  }

	/** 发送消息 */
  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket 未连接');
    }
    this.socket.send(JSON.stringify(data));
  }

	/** 监听消息 */
  onMessage(callback) {
    this.messageCallbacks.push(callback);
  }

  /** 监听错误 */
  onError(callback) {
    this.errorCallbacks.push(callback);
  }

  /** 关闭连接 */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default WebSocketClient;
