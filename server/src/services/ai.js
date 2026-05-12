const https = require('https');
const { deepseekApiKey, deepseekBaseUrl } = require('../config');

function postStream(apiUrl, body) {
  return new Promise((resolve, reject) => {
    let hostname, path;
    try {
      const u = new URL(apiUrl);
      hostname = u.hostname;
      path = u.pathname + u.search;
    } catch (e) {
      reject(new Error(`Invalid URL: ${apiUrl}`));
      return;
    }

    const req = https.request({
      hostname,
      path,
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        let errData = '';
        res.on('data', (chunk) => { errData += chunk; });
        res.on('end', () => reject(new Error(`DeepSeek ${res.statusCode}: ${errData}`)));
        return;
      }
      resolve(res);
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function* streamChat(messages) {
  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages,
    stream: true,
    temperature: 0.7,
  });

  const apiUrl = `${deepseekBaseUrl}/v1/chat/completions`;
  const stream = await postStream(apiUrl, body);
  const decoder = new TextDecoder();
  let buffer = '';

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {}
      }
    }
  }
}

module.exports = { streamChat };
