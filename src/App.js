import React, { useEffect, useState } from 'react';
import { Collapse, DatePicker, Input, message, Radio } from 'antd'
import { Typography } from '@mui/material';
import dayjs from 'dayjs'
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import './App.css';

const testT = 'bce-v3/ALTAK-6zsSZn5jbbt9EFkzBK5y3/7c36466da019b94d8b49e2421196759f879db75f;ZjkyZmQ2YmQxZTQ3NDcyNjk0ZTg1ZjYyYjlkZjNjODB8AAAAABMCAACEfuFxGWqkAiTGm7PW93BUVb7itJ2Hy1dmrmfitY9y3nIadX234mgr+OV7HnRZny5ncO5mzeRVT7JAQTdHnYip3EYbxnM0+vB4dKAV5z/tFmXUXz0zVS620eWGUEDpRBXQTXgtL1euS6NPaZD3S+Pq7kcH/pm75mgXbp1e9d6kVneJqU9oTRO/phI9Utafs+u3abF1ueyNXZqFwORFaaDKBLc0AdV6aTh1Gbs1DmmBBCzMnhBwS4ALs97Z189zBg2X9JCZ3wFrXJKPUCXeubKzgIGArwgdU7jQMMwwjEm3QCjtb+fFy/Tx06lJ1S8BGKt+rdUP4CQzvrVU736bUMAM93xC09Zha7Z1k3f9Q/sRiBs/0W6qp3Qv99obK+OiD3naIO51e+DyuDS2Skr96VseFJvvO+pq+I3oX5yc0vuENEB2FNEQfeuUzdKdkjgx77Q='

function App() {
  const [readable, setReadable] = useState('false')
  const [date, setDate] = useState();
  const [gender, setGender] = useState('')
  const [activeKey, setActiveKey] = useState('1')
  const [input, setInput] = useState(''); // 用户输入（生日或姓名）
  const [think, setThink] = useState('');
  const [fortune, setFortune] = useState(''); // 算命结果
  const [loading, setLoading] = useState(false); // 加载状态

  const CyberToken = localStorage.getItem('CyberToken') ?? testT

  const streamDeepSeek = async (callback) => {
    setThink('')
    setFortune('')
    setLoading(true)
    try {
      const response = await fetch('https://qianfan.baidubce.com/v2/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CyberToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-r1',
          prompt: `我的名字是${input}，性别是${gender}，出生日期是${dayjs(date).format('YYYY-MM-DD hh:mm:ss')}，给出基础命局、性格与运势、发展建议，严格按照八字和命理，${readable === 'true' ? '必须回答的通俗易懂' : '请以中文输出一段神秘而有趣的描述'}。`,
          messages: [{ role: 'user', content: `我的名字是${input}，性别是${gender}，出生日期是${date}，给出基础命局、性格与运势、发展建议，严格按照八字和命理，${readable === 'true' ? '必须回答的通俗易懂' : '请以中文输出一段神秘而有趣的描述'}。` }],
          stream: true,
        })
      });

      if (response.status !== 200) {
        message.error('我丢')
      }

      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader?.read() ?? {};
        if (done) {
          setLoading(false)
          break
        };
        const chunk = decoder.decode(value);
        try {
          const jsonStr = String(chunk).replace('data: ', '');
          const parsed = JSON.parse(jsonStr);

          callback(parsed.choices?.[0]?.delta?.reasoning_content, parsed.choices?.[0]?.delta?.content);  // 实时传递响应片段 
        } catch (e) {
          console.error('Chunk 解析失败:', e);
        }
      }
    } catch (error) {
      console.debug(error)
      message.error(error)
      if (error?.name !== 'AbortError') {
        console.error(' 流式请求异常:', error);
        setLoading(false)
      }
    }
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() && date && gender.trim()) {
      let fullResponse = '';
      let fullThink = ''

      await streamDeepSeek((think, text) => {
        if (think) {
          fullThink += think
          setThink(fullThink);
        }

        if (text) {
          fullResponse += text;
          setFortune(fullResponse); // 增量更新状态 
        }

      }, false);

    }
  };

  return (
    <div className="App">
      <h1>Cyber算命大师</h1>
      <p>让Cyber大师为你揭示命运！</p>

      <form onSubmit={handleSubmit}>
        <div className='form-content'>
          <Input
            style={{ width: 260, height: 35 }}
            size='small'
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            placeholder="请输入性别"
            disabled={loading}
          />
          <Input
            style={{ width: 260, height: 35 }}
            size='small'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入姓名"
            disabled={loading}
          />
          <DatePicker
            disabled={loading}
            value={date}
            style={{ width: 260, height: 35 }}
            size='small'
            showTime
            placeholder='请输入生辰'
            onChange={(value, dateString) => {
              setDate(value)
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          <Radio.Group disabled={loading} value={readable} block options={[{
            label: <span style={{ display: 'inline-block', width: '100%', userSelect: 'none' }} onClick={() => {
              setReadable((pre) => pre === 'true' ? 'false' : 'true')
            }}>通俗易懂模式</span>, value: 'true'
          }]} defaultValue="Pear" optionType="button" onChange={(val) => console.debug(val)} />
          <button type="submit" disabled={loading}>
            {loading ? '正在算命...' : '开始算命'}
          </button>
        </div>
      </form>

      {(think || fortune) && (
        <div className="fortune-result">
          <h2>你的命运 <span style={{ fontSize: 16 }}>(仅供参考)</span></h2>
          <Collapse
            activeKey={activeKey}
            onChange={setActiveKey}
            bordered={false}
            items={[{ key: '1', label: <p className='think-title'>赛博掐指中：</p>, children: <p className='think-text'>{think}</p> }]}
          />
          <div className='result-content'>
            <ReactMarkdown remarkPlugins={[remarkGfm, rehypeHighlight]}>
              {fortune}
            </ReactMarkdown>
            {/* <Typography className="response-box" variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              {fortune}
            </Typography> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
