import config from 'src/config';
import VERTC from '@volcengine/rtc';
import LogTracker from '../log/LogTracker';

class RtcClient {
  constructor(props) {
    this.config = props.config;
    this.engineUp = VERTC.createEngine(props.config.appId);
    this.engineDown = VERTC.createEngine(props.config.appId);
    this.tracker = new LogTracker('ws://localhost:8080');
  }

  async checkNetworkQuailty() {
    const { tokens, roomId } = this.config;
    const [ upToken, downToken ] = tokens;
    
    const uplinkClient = this.engineUp;
    const downlinkClient = this.engineDown;
    
    const initUrl = window.location.href;
    this.tracker.track('init', { path: initUrl });

    try {
      await uplinkClient.startAudioCapture();
      await uplinkClient.startVideoCapture();
    } catch (e) {
      this.tracker.track('error', { error: e });
    }
    // uplinkClient 进房，设置为自动发布，开启音视频采集
    uplinkClient.joinRoom(upToken.token, roomId, { userId: upToken.userId }, {
      isAutoPublish: true,
      isAutoSubscribeAudio: false,
      isAutoSubscribeVideo: false
    });

    // downlinkClient 进房，设置为自动订阅
    downlinkClient.joinRoom(downToken.token, roomId, { userId: downToken.userId }, {
      isAutoPublish: false,
      isAutoSubscribeAudio: true,
      isAutoSubscribeVideo: true
    });

    // 查看上行网络质量数据
    uplinkClient.on('onNetworkQuality', (uplinkNetworkQuality) => {
      // ws日志上报
      this.wss.send({ type: 'ping', content: 'Hello Server!' });
      console.log('uplinkClient_onNetworkQuality: ', uplinkNetworkQuality);
    });
    // 查看下行网络质量数据
    downlinkClient.on('onNetworkQuality', (_, downlinkNetworkQuality) => {
      this.wss.send({ type: 'ping', content: 'Hello Server!' });
      console.log('downlinkClient_onNetworkQuality: ', downlinkNetworkQuality);
    });
  }
}

export const checkNetworkQuailty = async () => {
  const rtcClient = new RtcClient({
    config: config
  });
  await rtcClient.checkNetworkQuailty();
}