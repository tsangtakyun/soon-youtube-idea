const CSS = `
* { box-sizing: border-box; }
body { background: #fbfaf7; color: #241f1a; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.home-shell { min-height: 100vh; background: #fbfaf7; }
.home-main { width: min(1080px, calc(100% - 32px)); margin: 0 auto; padding: 56px 0 80px; }
.home-kicker { color: #9a6a32; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; font-weight: 800; }
.home-title { margin: 10px 0 12px; font-size: clamp(34px, 6vw, 68px); line-height: 1.02; letter-spacing: 0; max-width: 850px; }
.home-copy { margin: 0; color: #6f655b; font-size: 17px; line-height: 1.8; max-width: 720px; }
.home-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 36px; }
.home-card { display: flex; flex-direction: column; min-height: 260px; padding: 24px; border: 1px solid #e6dacd; border-radius: 8px; background: #fff; color: inherit; text-decoration: none; box-shadow: 0 18px 44px rgba(49, 35, 18, .06); }
.home-card:hover { border-color: #d6b891; transform: translateY(-1px); }
.home-card small { color: #9a6a32; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.home-card h2 { margin: 18px 0 10px; font-size: 28px; line-height: 1.15; }
.home-card p { margin: 0; color: #746a5f; line-height: 1.75; }
.home-card span { margin-top: auto; display: inline-flex; align-items: center; color: #7c4a14; font-weight: 800; }
.home-note { margin-top: 18px; color: #85796f; font-size: 14px; line-height: 1.7; }
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
          <div className="home-kicker">SOON Editorial Workbench</div>
          <h1 className="home-title">由頻道基因出發，將論點推成劇本。</h1>
          <p className="home-copy">
            這裡不再掃爆款、不再追 outlier。現在只保留兩件事：先定義頻道把尺，再用這把尺把你的論點研究、拆解、生成 Fern 6-part 劇本。
          </p>

          <div className="home-grid">
            <a className="home-card" href="/channel">
              <small>Module 1</small>
              <h2>頻道基因</h2>
              <p>設定頻道定位、觀點、語氣和系列，生成並確認專屬這條頻道的評分準則。</p>
              <span>進入頻道基因</span>
            </a>

            <a className="home-card" href="/workbench">
              <small>Module 2</small>
              <h2>論點生產線</h2>
              <p>輸入你的 thesis 和手上材料，AI 負責研究、標來源、拆成可編輯的 6-part 劇本。</p>
              <span>進入論點生產線</span>
            </a>
          </div>

          <p className="home-note">題目庫仍保留於既有 library，下一步會改造成新的題目管理入口。</p>
        </section>
      </main>
    </>
  )
}
