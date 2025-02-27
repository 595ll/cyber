import React, { useEffect, useState } from 'react';
import { Collapse, DatePicker, Input, message, Radio } from 'antd'
import { Typography } from '@mui/material';
import dayjs from 'dayjs'
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import './App.css';

const testT = 'bce-v3/ALTAK-es0zMYIJ8cO0V635yB5WQ/286f257968fac83d47c65ba0de9497bbf9d923a5;ZjkyZmQ2YmQxZTQ3NDcyNjk0ZTg1ZjYyYjlkZjNjODB8AAAAABMCAADpwbVapnExgeLetLcO7fdBWHIkuI4VLFJxYrOkebIqvPXOH6izPoClRSlmSm4yE10hqOkB6iO531XbpvMYzpphaVgFFWr3/UrzjHP4N/1yOHKM4z3V4NhSk76LmBHRJzmrcShRtfmPFijD5lmyji+2uVcXfejPKpsIONUqg4zrZQOczZej5dvY4cfxcRCGTfu9ln+C3YuIC3rKGmUtAcJCoXfjPC6MpSP1Xo4y4q0hdiQUyjzD+3g1sJoLYn5SIbay0vKfZudPdYRK4J9exJySyA6gaREZoZ9fBqKiJjgqUSDmLDkfY+RxOe8GbJ98CHcNogRDO66Jij1eai9Sl52YOiTKyZkBDU2mCatDRa2BEVHkL3IovwuxDPbfNfqco/6gD+97kLqxig2Qt7YiYjM2kAn6pAoZHwwWmlQEP3Pf4EpYkv+y5PpPJFXpoEWhpjc='

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
