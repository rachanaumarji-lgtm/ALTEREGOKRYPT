import './_group.css';

const currentPaths = [
  {
    title: 'Move forward with im too lazy to go to gym',
    outcome: 'If you move forward with im too lazy to go to gym, pay attention to how your energy and routine respond over a short trial. This can help you notice a pattern, but it is not a health assessment.',
    upside: 'May move you toward your goal.',
    tradeoff: 'This is the higher-stakes part of this route; verify the details you can before committing. Acting sooner can create momentum, but it leaves less time to check what you may be giving up.',
    firstStep: 'Try the smallest safe version of “Move forward with im too lazy to go to gym” once and note how your energy feels afterward.',
  },
  {
    title: 'Keep things as they are and test im too lazy to go to gym in a smaller way',
    outcome: 'If you keep things as they are and test im too lazy to go to gym in a smaller way, pay attention to how your energy and routine respond over a short trial. This can help you notice a pattern, but it is not a health assessment.',
    upside: 'May move you toward your goal.',
    tradeoff: 'There is some uncertainty here; keep a way to adjust if the first result is not what you expected. A smaller trial can reduce uncertainty, but waiting too long may delay the change you want.',
    firstStep: 'Try the smallest safe version of “Keep things as they are and test im too lazy to go to gym in a smaller way” once and note how your energy feels afterward.',
  },
];

const metrics = [
  { label: 'Time demand', note: 'Lower is lighter', values: ['Medium', 'Low'] },
  { label: 'Energy demand', note: 'Lower is lighter', values: ['Medium', 'Medium'] },
  { label: 'Downside risk', note: 'Lower is safer', values: ['High', 'Medium'] },
  { label: 'Fit with your goals', note: 'Higher is closer', values: ['Medium', 'Medium'] },
];

export function CurrentScenario() {
  return (
    <main className="scenario-extract">
      <div className="eyebrow"><span className="eyebrow-mark">03</span> THE WHAT-IF GATE</div>
      <h1>Two roads. No crystal ball.</h1>
      <p className="intro">Describe a real choice and the limits that matter. Your twin compares the paths against details you have allowed.</p>
      <form className="scenario-form pixel-panel">
        <div className="editor-heading"><span className="card-kicker">SET THE SCENE</span><span className="scenario-glyph">◆ ◆</span></div>
        <label className="field"><span>WHAT ARE YOU THINKING ABOUT?</span><textarea defaultValue="im too lazy to go to gym" rows={3} /></label>
        <div className="choice-fields">
          <label className="field"><span>OPTION A <em>OPTIONAL</em></span><input placeholder="e.g. take the new role" /></label>
          <label className="field"><span>OPTION B <em>OPTIONAL</em></span><input placeholder="e.g. stay where I am" /></label>
        </div>
        <label className="field"><span>WHAT LIMITS OR TRADE-OFFS MATTER? <em>OPTIONAL</em></span><textarea placeholder="Time, money, energy, other people, timing — anything you want this to respect." rows={2} /></label>
        <div className="scenario-submit"><span>Local comparison · no AI service call</span><button className="button button-accent" type="button">COMPARE THE PATHS <span>→</span></button></div>
      </form>
      <section className="scenario-result">
        <div className="result-heading">
          <div><div className="eyebrow"><span className="eyebrow-mark">PATHS</span> A POSSIBLE WALK-THROUGH</div><h2>im too lazy to go to gym</h2></div>
          <div className="confidence"><span>CONTEXT SIGNAL</span><b>Medium</b><small>not a success chance</small></div>
        </div>
        <p className="analysis-summary">This is a wellbeing decision: “Move forward with im too lazy to go to gym” compared with “Keep things as they are and test im too lazy to go to gym in a smaller way.”</p>
        <section className="tradeoff-graph pixel-panel" aria-label="Qualitative path comparison">
          <div className="tradeoff-heading"><div><span className="card-kicker">THE CHOICE MAP</span><h3>How the paths compare</h3><p>Relative levels inferred from your wording and allowed context—not probabilities or measured forecasts.</p></div><span className="tradeoff-scale">LOW · MEDIUM · HIGH</span></div>
          <div className="tradeoff-legend"><span><i className="legend-a" /> PATH A</span><span><i className="legend-b" /> PATH B</span></div>
          <div className="tradeoff-rows">{metrics.map((metric) => <div className="tradeoff-row" key={metric.label}>
            <div className="tradeoff-label"><b>{metric.label}</b><small>{metric.note}</small></div>
            {metric.values.map((value, index) => <div className="tradeoff-bar-row" key={index}>
              <span className={`tradeoff-path-label tradeoff-path-${index}`}>P{index === 0 ? 'A' : 'B'}</span>
              <div className="tradeoff-track"><span className={`tradeoff-fill tradeoff-path-${index}`} style={{ width: value === 'High' ? '100%' : value === 'Medium' ? '66%' : '33%' }} /></div>
              <span className="tradeoff-level">{value}</span>
            </div>)}
          </div>)}</div>
        </section>
        <div className="paths-grid">{currentPaths.map((path, index) => <article className={`path-card path-detail-card path-card-${index}`} key={path.title}>
          <div className="path-index">PATH {index === 0 ? 'A' : 'B'} <span>{index === 0 ? '◆' : '◇'}</span></div><h3>{path.title}</h3>
          <div className="path-detail"><span>WHAT MAY HAPPEN</span><p>{path.outcome}</p></div>
          <div className="path-detail"><span>UPSIDE</span><p>{path.upside}</p></div>
          <div className="path-detail"><span>TRADE-OFF</span><p>{path.tradeoff}</p></div>
          <div className="path-first-step"><span>FIRST SMALL STEP</span><p>{path.firstStep}</p></div>
        </article>)}</div>
      </section>
    </main>
  );
}