'use client'

import { useState } from 'react'

export default function Home() {
    const [input, setInput] = useState('')

  return (
        <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #F5F2EC 0%, #EDE8DF 100%)',
                padding: '40px 24px',
                fontFamily: '"EB Garamond", Georgia, serif',
                color: '#1a1a18'
        }}>
                <div style={{
                  maxWidth: '1100px',
                  margin: '0 auto',
                  display: 'grid',
                  gap: '28px'
        }}>
                  {/* Header */}
                          <header style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    paddingBottom: '20px',
                    borderBottom: '1px solid rgba(26,26,24,0.10)'
        }}>
                                      <div>
                                                  <div style={{
                        fontSize: '11px',
                        letterSpacing: '0.18em',
                        color: '#8b7c69',
                        marginBottom: '6px',
                        textTransform: 'uppercase'
        }}>
                                                                SOON YOUTUBE
                                                  </div>div>
                                                  <h1 style={{
                        fontSize: '42px',
                        fontWeight: 500,
                        lineHeight: 1.05,
                        margin: 0
        }}>
                                                                YouTube 題材庫
                                                  </h1>h1>
                                      </div>div>
                                    <div style={{ fontSize: '13px', color: '#9b8c7e' }}>
                                                10 題材庫
                                    </div>div>
                          </header>header>
                
                  {/* Input Card */}
                        <div style={{
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(26,26,24,0.09)',
                    borderRadius: '24px',
                    padding: '28px 32px',
                    backdropFilter: 'blur(8px)'
        }}>
                                  <div style={{ marginBottom: '20px' }}>
                                              <div style={{
                        fontSize: '11px',
                        letterSpacing: '0.14em',
                        color: '#8b7c69',
                        textTransform: 'uppercase',
                        marginBottom: '8px'
        }}>
                                                            輸入
                                              </div>div>
                                              <p style={{
                        fontSize: '18px',
                        lineHeight: 1.6,
                        margin: '0 0 16px',
                        color: '#2a2a26'
        }}>
                                                            用關鍵字、頻道 URL 或影片 URL，先由 YouTube 爆款 pattern 
                                                            倒推出 5 張值得拍嘅題材卡。唔一步先做 research 同 angle 
                                                            planning，唔係直接寫死 script。
                                              </p>p>
                                  </div>div>
                                  
                                  <div style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'stretch'
        }}>
                                              <input
                                                              value={input}
                                                              onChange={(e) => setInput(e.target.value)}
                                                              placeholder="例如：香港餐飲 YouTube、旅遊攻略、創業故事"
                                                              style={{
                                                                                flex: 1,
                                                                                fontSize: '18px',
                                                                                fontFamily: 'inherit',
                                                                                padding: '14px 20px',
                                                                                borderRadius: '14px',
                                                                                border: '1px solid rgba(26,26,24,0.15)',
                                                                                background: 'rgba(255,255,255,0.9)',
                                                                                color: '#1a1a18',
                                                                                outline: 'none'
                                                              }}
                                                            />
                                              <button
                                                              style={{
                                                                                fontSize: '16px',
                                                                                fontFamily: 'inherit',
                                                                                padding: '14px 28px',
                                                                                borderRadius: '14px',
                                                                                border: 'none',
                                                                                background: '#1a1a18',
                                                                                color: '#F5F2EC',
                                                                                cursor: 'pointer',
                                                                                whiteSpace: 'nowrap',
                                                                                letterSpacing: '0.02em'
                                                              }}
                                                            >
                                                            生成題材
                                              </button>button>
                                  </div>div>
                                  
                                  <div style={{
                      fontSize: '13px',
                      color: '#9b8c7e',
                      marginTop: '12px',
                      lineHeight: 1.6
        }}>
                                              <strong>關鍵字</strong>strong>：廣東話 YouTube 內容主題<br/>
                                              <strong>頻道 URL</strong>strong>：分析佢哋嘅爆款 pattern<br/>
                                              <strong>影片 URL</strong>strong>：搵類似內容嘅創作方向
                                  </div>div>
                        </div>div>
                
                  {/* Placeholder results */}
                        <div style={{
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(26,26,24,0.09)',
                    borderRadius: '24px',
                    padding: '28px 32px',
                    backdropFilter: 'blur(8px)',
                    textAlign: 'center',
                    color: '#9b8c7e'
        }}>
                                  輸入關鍵字或 URL 開始生成題材卡
                        </div>div>
                </div>div>
        </div>div>
      )
}</div>
