import { useEffect, useState } from 'react';

export default function HomePage() {
  const [jwtToken, setJwtToken] = useState(null);
  const [chatLoaded, setChatLoaded] = useState(false);

  // 页面初次加载时，检查 localStorage 是否已有 JWT
  useEffect(() => {
    const storedToken = window.localStorage.getItem('coze_jwt');
    if (storedToken) {
      setJwtToken(storedToken);
    }
  }, []);

  // 处理回调时，URL 里可能带了 ?token=xxx
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      // 将 token 存入 localStorage
      window.localStorage.setItem('coze_jwt', tokenFromUrl);
      // 从 URL 中删除 token 参数，避免刷新后重复
      urlParams.delete('token');
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, '', newUrl);

      setJwtToken(tokenFromUrl);
    }
  }, []);

  // 如果拿到了 JWT，但还没加载过 Chat SDK，则加载
  useEffect(() => {
    if (jwtToken && !chatLoaded) {
      loadCozeChat(jwtToken);
      setChatLoaded(true);
    }
  }, [jwtToken, chatLoaded]);

  // 加载 Coze Chat SDK
  async function loadCozeChat(token) {
    // 1. 动态引入 Chat SDK 脚本（海外版）
    const script = document.createElement('script');
    script.src = 'https://cdn.coze.com/obj/flow-platform/chat-app-sdk/1.2.0/libs/oversea/index.js';
    // 如果有更新版本，请替换成官方最新的海外版脚本地址
    script.onload = () => {
      // 2. 初始化
      const chatClient = new window.CozeWebSDK.WebChatClient({
        config: {
          bot_id: 'YOUR_BOT_ID', // 请在 Coze 后台查看你的 Bot ID
        },
        auth: {
          type: 'jwt',
          token,
          // 如果需要自动刷新，可以在这里实现 onRefreshToken
          onRefreshToken: () => token
        },
        componentProps: {
          title: 'Coze OAuth JWT Demo (海外版)'
        }
      });
      // 重置会话，防止加载历史缓存
      chatClient.resetConversation();
    };
    document.body.appendChild(script);
  }

  // 引导用户跳转到 Coze OAuth 授权
  function handleLogin() {
    // 注意替换成你的实际回调 URL
    const redirectUri = encodeURIComponent('https://my-ai-bot-eight.vercel.app/api/coze-callback');
    // 根据海外版文档，将下面地址替换成实际的授权端点
    const authorizeUrl = `https://api.coze.com/oauth/authorize?client_id=1154724725632&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
    window.location.href = authorizeUrl;
  }

  // 退出登录：清空 JWT
  function handleLogout() {
    window.localStorage.removeItem('coze_jwt');
    setJwtToken(null);
    window.location.reload();
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <h1>Coze OAuth JWT 会话隔离示例 (海外版)</h1>

      {!jwtToken ? (
        <button onClick={handleLogin}>登录 / 授权</button>
      ) : (
        <button onClick={handleLogout}>退出登录</button>
      )}

      <div style={{ marginTop: 20 }}>
        {!jwtToken
          ? '尚未登录，无法加载 Coze Chat。请先点击上方按钮进行授权。'
          : '已登录，可在右下角使用 Coze Chat 浮窗。'}
      </div>
    </div>
  );
}
