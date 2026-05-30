const CSS = `
* { box-sizing: border-box; }
body { background: #f7f5f1; color: #1f2328; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.home-shell { min-height: 100vh; background: linear-gradient(180deg, #faf8f4 0%, #f3efe8 100%); }
.home-main { width: min(1180px, calc(100% - 48px)); margin: 0 auto; padding: 46px 0 72px; }
.home-kicker { color: #8f4f17; font-size: 12px; letter-spacing: .16em; font-weight: 800; }
.home-title { margin: 10px 0 14px; font-size: clamp(36px, 5.2vw, 64px); line-height: 1.05; letter-spacing: 0; max-width: 880px; color: #191511; }
.home-copy { margin: 0; color: #5d544b; font-size: 17px; line-height: 1.9; max-width: 780px; }
.home-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 34px; }
.home-card { display: flex; flex-direction: column; min-height: 242px; padding: 22px; border: 1px solid #ded3c5; border-radius: 8px; background: rgba(255,255,255,.86); color: inherit; text-decoration: none; box-shadow: 0 18px 42px rgba(53, 38, 22, .07); transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease; }
.home-card:hover { border-color: #a86a2a; box-shadow: 0 22px 48px rgba(53, 38, 22, .11); transform: translateY(-2px); }
.home-card small { color: #8f4f17; font-weight: 800; letter-spacing: .12em; }
.home-card h2 { margin: 18px 0 10px; font-size: 27px; line-height: 1.18; color: #201812; }
.home-card p { margin: 0; color: #645b52; line-height: 1.8; }
.home-card span { margin-top: auto; display: inline-flex; align-items: center; color: #723b09; font-weight: 800; }
.home-note { margin-top: 18px; color: #85796f; font-size: 14px; line-height: 1.7; }
@media (max-width: 980px) {
  .home-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .home-main { padding-top: 32px; }
  .home-grid { grid-template-columns: 1fr; }
  .home-card { min-height: 220px; }
}
`

export default function HomePage() {
  return (
    <>
      <style>{CSS}</style>
      <main className="home-shell">
        <section className="home-main">
          <div className="home-kicker">SOON 編輯工作台</div>
          <h1 className="home-title">由頻道基因出發，將論點推成劇本。</h1>
          <p className="home-copy">
            這裡不再掃爆款、不再追離群爆款。現在只保留三件事：先定義頻道把尺，將論點放入題目庫，再推上生產線生成 Fern 六段式劇本。
          </p>

          <div className="home-grid">
            <a className="home-card" href="/channel">
              <small>第一步</small>
              <h2>頻道基因</h2>
              <p>設定頻道定位、觀點、語氣和系列，生成並確認專屬這條頻道的評分準則。</p>
              <span>進入頻道基因</span>
            </a>

            <a className="home-card" href="/topics">
              <small>第二步</small>
              <h2>題目庫</h2>
              <p>儲存已經想好的論點和手上資料，按系列整理，準備好就推上生產線。</p>
              <span>進入題目庫</span>
            </a>

            <a className="home-card" href="/workbench">
              <small>第三步</small>
              <h2>論點生產線</h2>
              <p>輸入你的論點和手上材料，AI 負責研究、標來源、拆成可編輯的六段式劇本。</p>
              <span>進入論點生產線</span>
            </a>
          </div>
        </section>
      </main>
    </>
  )
}
