// pages/api/coze-callback.js
export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing code');
  }

  try {
    // 1. 根据海外版文档，确定 token 接口地址
    // 这里假设是 https://api.coze.com/oauth/token
    const tokenUrl = 'https://api.coze.com/oauth/token';

    // 2. 从环境变量读取 Client Secret
    const clientSecret = process.env.COZE_CLIENT_SECRET;
    const clientId = '1154724725632'; // 你的 OAuth App ID
    const redirectUri = 'https://my-coze-oauth-demo.vercel.app/api/coze-callback';

    // 3. POST 请求换取 access_token（JWT）
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      return res.status(500).send('Failed to exchange token: ' + errorText);
    }

    const tokenData = await tokenRes.json();
    // Coze 可能返回: { access_token: '...', token_type: 'Bearer', expires_in: 3600, ... }
    // 具体字段以实际返回为准
    const { access_token } = tokenData;
    if (!access_token) {
      return res.status(500).send('No access_token in response');
    }

    // 4. 携带 token 返回首页
    //   你也可以写入 Cookie，这里用 query param 简单示例
    return res.redirect(`/?token=${access_token}`);
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return res.status(500).send('Server error');
  }
}
