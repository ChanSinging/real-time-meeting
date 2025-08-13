class LogTracker {
  constructor(url) {
    this.cache = []; // 本地缓存
    this.wsConnected = false;
    this.maxRetries = 3;
		this.url = url;
    this.initWebSocket();
  }

  // 初始化 WebSocket
  initWebSocket() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
			console.log('客户端链接成功');
      this.wsConnected = true;
      this.flushCache(); // 连接成功后立即发送缓存
    };

		// 接收消息
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);  // 假设服务器返回 JSON
        this.messageCallbacks.forEach(callback => callback(data));
      } catch (error) {
        console.error('消息解析失败:', error);
      }
    };

		// 连接关闭
    this.ws.onclose = () => {
      console.log('WebSocket 连接已关闭');
      this.socket = null;
    };

    // 错误处理
    this.ws.onerror = () => {
      this.wsConnected = false;
    };
  }

  // 发送日志（核心方法）
  track(event, data) {
    const log = { event, data, timestamp: Date.now() };
    this.cache.push(log);
    
    // 超过阈值立即发送
    if (this.cache.length >= 10) {
      this.flush();
    } else {
      // 定时发送（5秒间隔）
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), 5000);
      }
    }
  }

  // 上报日志
  async flush() {
    if (this.cache.length === 0) return;

    const logsToSend = [...this.cache];
    this.cache = []; // 清空缓存
    clearTimeout(this.flushTimer);

    // 优先 WebSocket
    if (this.wsConnected) {
      try {
        this.ws.send(JSON.stringify({ type: 'error', logs: logsToSend }));
        return;
      } catch (e) {
        this.wsConnected = false;
      }
    }

    // WebSocket 失败时降级 HTTP
    await this.sendViaHTTP(logsToSend);
  }

  // HTTP 降级上报
  async sendViaHTTP(logs, retryCount = 0) {
    try {
			// url仅做测试，未部署
      const res = await fetch('https://logs.example.com/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logs),
      });
      if (!res.ok) throw new Error('HTTP上报失败');
    } catch (e) {
      if (retryCount < this.maxRetries) {
        setTimeout(() => this.sendViaHTTP(logs, retryCount + 1), 1000);
      } else {
        // 最终失败时写回缓存
        this.cache.unshift(...logs);
      }
    }
  }

  // 发送缓存中的历史日志
  flushCache() {
    if (this.cache.length > 0) {
      this.flush();
    }
  }
}

export default LogTracker;