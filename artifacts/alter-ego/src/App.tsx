import './alter-ego.css';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';

type Profile = {
  name?: string;
  about: string;
  hobbies: string;
  routine: string;
  skills: string;
  personality: string;
  freeHoursPerDay: number;
  workStyle: string;
  goals: string[];
};
type UserTask = { id: string; title: string; details: string; dueAt?: string; estimatedHours?: number; done: boolean };
type Confidence = 'High' | 'Medium' | 'Low';
type Scenario = {
  id: string; question: string; constraints: string; alternatives: string[];
  recommendedPath: string; confidenceLevel: Confidence; explanation: string;
  assumptions: string[]; createdAt: string;
};
type Category = 'profile' | 'interests' | 'routine' | 'skills' | 'personality' | 'goals' | 'tasks' | 'feedback';
type Memory = { id: string; category: Category; label: string; value: string; enabled: boolean };
type Feedback = { id: string; scenarioId: string; actualOutcome: string; correction: string; createdAt: string };
type AppData = {
  profile: Profile | null; tasks: UserTask[]; scenarios: Scenario[]; memories: Memory[];
  permissions: Record<Category, boolean>; feedback: Feedback[];
};
const STORE_KEY = 'alter-ego-village-v1';
const categories: { key: Category; label: string; hint: string }[] = [
  { key: 'profile', label: 'About you', hint: 'Personal notes you chose to share' },
  { key: 'interests', label: 'Interests', hint: 'Hobbies and things you enjoy' },
  { key: 'routine', label: 'Routine', hint: 'Your usual rhythms and energy' },
  { key: 'skills', label: 'Skills', hint: 'Things you know or are learning' },
  { key: 'personality', label: 'Personality', hint: 'How you like to approach things' },
  { key: 'goals', label: 'Goals', hint: 'What you are working toward' },
  { key: 'tasks', label: 'Quest details', hint: 'Your own task log' },
  { key: 'feedback', label: 'Corrections', hint: 'What you taught your twin' },
];
const emptyPermissions = (): Record<Category, boolean> => ({
  profile: true, interests: true, routine: true, skills: true, personality: true, goals: true, tasks: true, feedback: true,
});
const emptyData = (): AppData => ({
  profile: null, tasks: [], scenarios: [], memories: [], permissions: emptyPermissions(), feedback: [],
});
function readData(): AppData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return { ...emptyData(), ...parsed, permissions: { ...emptyPermissions(), ...parsed.permissions } };
  } catch { return emptyData(); }
}
function id() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function memoriesFor(profile: Profile, prior: Memory[]): Memory[] {
  const values: [Category, string, string][] = [
    ['profile', 'About you', profile.about], ['profile', 'Display name', profile.name ?? ''],
    ['interests', 'Hobbies & interests', profile.hobbies],
    ['routine', 'Routine', profile.routine], ['routine', 'Free hours per day', `${profile.freeHoursPerDay} hours`],
    ['skills', 'Skills', profile.skills],
    ['personality', 'Personality', profile.personality], ['personality', 'Preferred work style', profile.workStyle],
    ['goals', 'Current goals', profile.goals.join(', ')],
  ];
  return [
    ...values.filter(([, , value]) => value.trim()).map(([category, label, value]) => {
      const old = prior.find((memory) => memory.category === category && memory.label === label);
      return { id: old?.id ?? id(), category, label, value, enabled: old?.enabled ?? true };
    }),
    ...prior.filter((memory) => memory.category === 'feedback'),
  ];
}
function splitList(value: string) { return value.split(/[,;\n]/).map((part) => part.trim()).filter(Boolean); }
const blankProfile: Profile = { name: '', about: '', hobbies: '', routine: '', skills: '', personality: '', freeHoursPerDay: 2, workStyle: '', goals: [] };

function PixelVillager({ small = false }: { small?: boolean }) {
  return <div aria-hidden="true" className={`villager ${small ? 'villager-small' : ''}`}>
    <i className="hat" /><i className="head" /><i className="eye eye-left" /><i className="eye eye-right" />
    <i className="nose" /><i className="coat" /><i className="arm" /><i className="boots" />
  </div>;
}
function BrandMark() {
  return <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>;
}
function Shell({ children, data }: { children: ReactNode; data: AppData }) {
  const [path] = useLocation();
  const links = [
    ['/', 'Village HQ', '01'], ['/quests', 'Quest log', '02'], ['/scenarios', 'What if…', '03'],
    ['/twin', 'Your twin', '04'], ['/evolution', 'Evolution', '05'], ['/privacy', 'Privacy', '06'],
  ];
  return <div className="app-shell">
    <aside className="side-rail">
      <Link href="/" className="brand-lockup"><BrandMark /><span><strong>ALTER EGO</strong><small>YOUR OWN SIDEKICK</small></span></Link>
      <div className="rail-label">FIELD GUIDE <span>— 06</span></div>
      <nav aria-label="Main navigation" className="rail-nav">
        {links.map(([href, label, n]) => <Link key={href} href={href} className={`nav-link ${path === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
          <span className="nav-number">{n}</span><span>{label}</span>{path === href && <span className="nav-caret">›</span>}
        </Link>)}
      </nav>
      <div className="rail-bottom">
        <div className="rail-villager"><PixelVillager small /><span className="pixel-speech">Ready when<br />you are.</span></div>
        <p>NO CLOUD. NO CROWD.<br />JUST YOUR OWN WORLD.</p>
        <span className="local-chip"><i /> SAVED IN THIS BROWSER</span>
      </div>
    </aside>
    <main className="main-column">
      <header className="topbar"><div className="mobile-brand"><BrandMark /><b>ALTER EGO</b></div><div className="topbar-location"><span className="tiny-square" /> YOUR VILLAGE <span className="slash">/</span> <strong>{links.find(([href]) => href === path)?.[1]?.toUpperCase() ?? 'FIELD GUIDE'}</strong></div>
        <div className="topbar-user"><span className="save-dot" /> LOCAL SAVE <span className="tiny-divider" /> {data.profile?.name || 'NEW ADVENTURER'}</div>
      </header>
      <div className="page-content">{children}</div>
      <footer className="site-foot"><span>ALTER EGO <b>·</b> A SMALL WORLD, ALL YOURS</span><span>Stored only on this device <Link href="/privacy">Privacy settings →</Link></span></footer>
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(([href, label, n]) => <Link key={href} href={href} className={path === href ? 'selected' : ''}><span>{n}</span>{label}</Link>)}</nav>
  </div>;
}
function SectionHead({ eyebrow, title, description, index }: { eyebrow: string; title: string; description?: string; index: string }) {
  return <div className="section-head enter-up"><div><div className="eyebrow"><span className="eyebrow-mark">{index}</span>{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div><div className="head-stamp">FIELD<br />NOTE <b>{index}</b></div></div>;
}
function Dialogue({ children, label = 'THE VILLAGER SAYS' }: { children: ReactNode; label?: string }) {
  return <div className="dialogue"><div className="dialogue-avatar"><PixelVillager small /></div><div className="dialogue-copy"><div className="dialogue-label">{label}</div><p>{children}</p></div><span className="dialogue-corner">✦</span></div>;
}
function PixelLandscape() {
  return <div className="landscape" aria-hidden="true">
    <div className="land-sun" /><div className="cloud cloud-one" /><div className="cloud cloud-two" />
    <div className="mountain mountain-back" /><div className="mountain mountain-front" />
    <div className="tree tree-a"><i /><b /></div><div className="tree tree-b"><i /><b /></div>
    <div className="path-block" /><div className="house"><i className="roof" /><i className="wall" /><i className="window" /><i className="door" /></div>
    <div className="grass grass-a" /><div className="grass grass-b" /><div className="land-label">A PLACE TO THINK CLEARLY</div>
  </div>;
}
function ProfileForm({ initial, onSave, buttonText = 'SAVE & CONTINUE', onCancel }: { initial: Profile; onSave: (profile: Profile) => void; buttonText?: string; onCancel?: () => void }) {
  const [profile, setProfile] = useState<Profile>({ ...initial });
  const patch = (key: keyof Profile, value: string | number | string[]) => setProfile((current) => ({ ...current, [key]: value }));
  const input = (label: string, key: keyof Profile, placeholder: string, help?: string) => <label className="field">
    <span>{label}</span><textarea value={profile[key] as string} onChange={(event) => patch(key, event.target.value)} placeholder={placeholder} rows={key === 'about' || key === 'routine' ? 3 : 2} data-testid={`input-profile-${key}`} />{help && <small>{help}</small>}
  </label>;
  return <form className="profile-form" onSubmit={(event) => { event.preventDefault(); onSave({ ...profile, goals: Array.isArray(profile.goals) ? profile.goals : splitList(String(profile.goals)) }); }}>
    <div className="form-intro"><span className="form-step">01 / 09</span><span>THERE ARE NO WRONG ANSWERS. SKIP WHAT YOU'D RATHER KEEP TO YOURSELF.</span></div>
    <div className="profile-grid">
      <label className="field"><span>WHAT SHOULD WE CALL YOU? <em>OPTIONAL</em></span><input value={profile.name ?? ''} onChange={(e) => patch('name', e.target.value)} placeholder="A name, nickname, or nothing at all" data-testid="input-profile-name" /></label>
      <label className="field"><span>FREE HOURS ON A TYPICAL DAY</span><div className="range-row"><input type="range" min="0" max="12" step="0.5" value={profile.freeHoursPerDay} onChange={(e) => patch('freeHoursPerDay', Number(e.target.value))} data-testid="input-free-hours" /><b>{profile.freeHoursPerDay} <small>HRS</small></b></div><small>Rough is good. This helps keep suggestions realistic.</small></label>
      {input('A LITTLE ABOUT YOU', 'about', 'What matters to you lately? What should your twin know?')}
      {input('HOBBIES & INTERESTS', 'hobbies', 'What do you enjoy, make, follow, or keep coming back to?')}
      {input('YOUR USUAL RHYTHM', 'routine', 'When do you tend to have energy? What does a regular day look like?')}
      {input('SKILLS & STRENGTHS', 'skills', 'What comes naturally? What are you learning?')}
      {input('HOW YOU LIKE TO WORK', 'personality', 'What helps you start? What drains you?')}
      <label className="field"><span>PREFERRED WORK STYLE</span><select value={profile.workStyle} onChange={(e) => patch('workStyle', e.target.value)} data-testid="select-work-style"><option value="">Choose what feels right</option><option>Short focused bursts</option><option>Long, quiet stretches</option><option>A little structure and a plan</option><option>Flexible, follow the energy</option><option>With another person nearby</option><option>It depends on the day</option></select></label>
      <label className="field field-wide"><span>WHAT ARE YOU WORKING TOWARD?</span><textarea value={profile.goals.join(', ')} onChange={(e) => patch('goals', splitList(e.target.value))} placeholder="A personal goal, a change you're considering, or just a direction. Separate with commas." rows={2} data-testid="input-profile-goals" /><small>Separate a few goals with commas. You can change these whenever you like.</small></label>
    </div>
    <div className="form-footer"><span><i className="lock-mark" /> Saved in this browser only.</span><div>{onCancel && <button type="button" className="button button-quiet" onClick={onCancel}>CANCEL</button>}<button type="submit" className="button button-primary" data-testid="button-save-profile">{buttonText}<span>→</span></button></div></div>
  </form>;
}
function Onboarding({ onSave }: { onSave: (profile: Profile) => void }) {
  return <div className="onboarding world-bg"><div className="onboard-head"><Link href="/" className="brand-lockup"><BrandMark /><span><strong>ALTER EGO</strong><small>YOUR OWN SIDEKICK</small></span></Link><span className="local-chip"><i /> DEVICE-ONLY SAVE</span></div>
    <div className="onboard-hero"><div><div className="eyebrow"><span className="eyebrow-mark">00</span> FIRST, A LITTLE INTRODUCTION</div><h1>Every good world<br />starts with <em>you.</em></h1><p>This isn't a quiz and there's no character class to pick. Give your twin a few details about the life you're actually living. They'll help make the what-ifs feel like yours.</p></div><div className="onboard-villager"><PixelVillager /><span className="speech-card">A fresh save file.<br />I like the look of it.</span><div className="pixel-ground" /></div></div>
    <div className="onboard-form"><Dialogue label="A NOTE FROM THE VILLAGER">Share only what feels useful. Your answers stay in this browser, and you can change or erase them whenever you want.</Dialogue><ProfileForm initial={blankProfile} buttonText="SAVE PROFILE & ENTER THE VILLAGE" onSave={onSave} /></div>
  </div>;
}
function HomePage({ data, navigate }: { data: AppData; navigate: (url: string) => void }) {
  const openTasks = data.tasks.filter((task) => !task.done);
  const finished = data.tasks.filter((task) => task.done).length;
  const name = data.profile?.name?.trim();
  return <div className="home-page enter-up"><div className="home-title"><div><div className="eyebrow"><span className="eyebrow-mark">HQ</span> YOUR VILLAGE / DAY {Math.max(1, data.scenarios.length + data.tasks.length + 1).toString().padStart(2, '0')}</div><h1>{name ? `Good to have you, ${name}.` : 'Your village, your pace.'}</h1><p>A small place to sort through the real stuff.</p></div><div className="rank-badge"><span>VILLAGE RANK</span><b>{data.scenarios.length + data.feedback.length > 3 ? 'FIELD HAND' : 'NEWCOMER'}</b><i>{'◆'.repeat(Math.min(5, Math.max(1, data.feedback.length + 1)))}<span>{'◇'.repeat(Math.max(0, 5 - data.feedback.length - 1))}</span></i></div></div>
    <PixelLandscape />
    <div className="home-grid"><section className="welcome-card pixel-panel"><div className="welcome-top"><span className="card-kicker">VILLAGER ON DUTY</span><span className="status-tag"><i /> HERE</span></div><div className="welcome-center"><PixelVillager /><div><h2>Ready when you are.</h2><p>Your twin works from what you've shared—not from guesses about everyone else.</p></div></div><Dialogue label="FIELD NOTE">Got a decision rattling around? We can walk through two possible paths. No fortune-telling, just a useful second look.</Dialogue><button className="button button-accent" onClick={() => navigate('/scenarios')} data-testid="button-open-scenario">THINK THROUGH A WHAT-IF <span>→</span></button></section>
      <section className="quest-summary pixel-panel"><div className="section-line"><span className="card-kicker">YOUR QUEST BOARD</span><Link href="/quests">OPEN LOG →</Link></div><div className="quest-count"><b>{openTasks.length.toString().padStart(2, '0')}</b><span>OPEN<br />QUESTS</span><div className="mini-divider" /><b>{finished.toString().padStart(2, '0')}</b><span>DONE</span></div>{openTasks.length ? <div className="mini-task-list">{openTasks.slice(0, 2).map((task) => <div key={task.id}><span className="empty-box" />{task.title}</div>)}</div> : <p className="empty-quiet">Your board is clear. Add a quest when something needs a spot.</p>}<button className="button button-outline" onClick={() => navigate('/quests')}>+ ADD YOUR FIRST QUEST</button></section></div>
    <div className="home-bottom"><div><span className="card-kicker">RECENTLY IN THE VILLAGE</span>{data.scenarios.length ? <p className="recent-line"><span className="tiny-square" /> Latest what-if: <b>{data.scenarios[data.scenarios.length - 1].question}</b><Link href="/scenarios">REVISIT →</Link></p> : <p className="empty-quiet">No scenarios yet. Your first one starts with a question.</p>}</div><div className="memory-meter"><span className="card-kicker">YOUR TWIN REMEMBERS</span><b>{data.memories.filter((item) => item.enabled && data.permissions[item.category]).length} <small>details in use</small></b><Link href="/twin">EDIT WHAT IT KNOWS →</Link></div></div>
  </div>;
}
function QuestPage({ data, update }: { data: AppData; update: (next: AppData) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState(''); const [details, setDetails] = useState(''); const [dueAt, setDueAt] = useState(''); const [hours, setHours] = useState('');
  const begin = (task?: UserTask) => { setEditId(task?.id ?? 'new'); setTitle(task?.title ?? ''); setDetails(task?.details ?? ''); setDueAt(task?.dueAt ?? ''); setHours(task?.estimatedHours?.toString() ?? ''); };
  const cancel = () => setEditId(null);
  const save = (event: FormEvent) => {
    event.preventDefault(); if (!title.trim()) return;
    const task: UserTask = { id: editId === 'new' ? id() : editId!, title: title.trim(), details: details.trim(), dueAt: dueAt || undefined, estimatedHours: hours ? Number(hours) : undefined, done: data.tasks.find((item) => item.id === editId)?.done ?? false };
    update({ ...data, tasks: editId === 'new' ? [...data.tasks, task] : data.tasks.map((item) => item.id === task.id ? task : item) }); cancel();
  };
  const toggle = (task: UserTask) => update({ ...data, tasks: data.tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item) });
  const remove = (task: UserTask) => { if (window.confirm(`Delete “${task.title}” from your quest log?`)) update({ ...data, tasks: data.tasks.filter((item) => item.id !== task.id) }); };
  return <div><SectionHead index="02" eyebrow="YOUR QUEST LOG" title="Nothing gets added for you." description="This is your list, not a to-do generator. Put down only what you want to keep track of." />
    <Dialogue>Some days a quest is a big thing. Some days it's just “buy the good oranges.” Both deserve a place if you say so.</Dialogue>
    <div className="toolbar"><div><span className="count-pill">{data.tasks.filter((task) => !task.done).length.toString().padStart(2, '0')}</span><span className="toolbar-label">OPEN QUESTS <i>/</i> {data.tasks.filter((task) => task.done).length.toString().padStart(2, '0')} COMPLETE</span></div><button className="button button-primary" onClick={() => begin()} data-testid="button-add-quest">+ ADD A QUEST</button></div>
    {editId && <form className="editor-card pixel-panel" onSubmit={save}><div className="editor-heading"><span className="card-kicker">{editId === 'new' ? 'NEW QUEST' : 'EDIT QUEST'}</span><button type="button" className="close-text" onClick={cancel}>CLOSE ×</button></div><div className="editor-grid"><label className="field"><span>QUEST NAME</span><input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What would you like to get done?" data-testid="input-quest-title" /></label><label className="field"><span>WHEN? <em>OPTIONAL</em></span><input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} data-testid="input-quest-due" /></label><label className="field field-wide"><span>NOTES <em>OPTIONAL</em></span><textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything you'll want to remember about it?" rows={2} data-testid="input-quest-details" /></label><label className="field"><span>ESTIMATED HOURS <em>OPTIONAL</em></span><input type="number" min="0.25" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 1.5" data-testid="input-quest-hours" /></label></div><div className="editor-actions"><button className="button button-quiet" type="button" onClick={cancel}>CANCEL</button><button className="button button-primary" type="submit" data-testid="button-save-quest">SAVE QUEST <span>→</span></button></div></form>}
    {data.tasks.length ? <div className="quest-list">{data.tasks.map((task) => <article className={`quest-row pixel-panel ${task.done ? 'quest-done' : ''}`} key={task.id} data-testid={`quest-${task.id}`}><button className={`quest-check ${task.done ? 'checked' : ''}`} onClick={() => toggle(task)} aria-label={task.done ? `Mark ${task.title} open` : `Mark ${task.title} complete`} data-testid={`button-toggle-${task.id}`}>{task.done ? '✓' : ''}</button><div className="quest-main"><div className="quest-title">{task.title}</div>{task.details && <p>{task.details}</p>}<div className="quest-meta">{task.dueAt && <span>DUE {task.dueAt}</span>}{task.estimatedHours && <span>ABOUT {task.estimatedHours} HRS</span>}<span>{task.done ? 'COMPLETE' : 'IN PROGRESS'}</span></div></div><div className="quest-controls"><button onClick={() => begin(task)} aria-label={`Edit ${task.title}`} data-testid={`button-edit-${task.id}`}>EDIT</button><button onClick={() => remove(task)} aria-label={`Delete ${task.title}`} data-testid={`button-delete-${task.id}`}>DELETE</button></div></article>)}</div> : <div className="empty-state pixel-panel"><div className="empty-illustration"><span className="empty-sun" /><span className="empty-path" /><span className="empty-flag" /></div><span className="card-kicker">AN OPEN PATCH OF GRASS</span><h2>Your quest board is quiet.</h2><p>No tasks are created unless you add them. Start with one thing you don't want to forget.</p><button className="button button-accent" onClick={() => begin()}>+ WRITE YOUR FIRST QUEST</button></div>}
  </div>;
}
function makeScenario(question: string, constraints: string, data: AppData, existing?: Scenario): Scenario {
  const enabled = data.memories.filter((memory) => memory.enabled && data.permissions[memory.category]);
  const read = (category: Category) => enabled.filter((memory) => memory.category === category).map((memory) => memory.value).join(' · ');
  const style = read('personality') || 'a flexible approach';
  const routine = read('routine');
  const goals = read('goals');
  const openTasks = data.permissions.tasks ? data.tasks.filter((task) => !task.done) : [];
  const correction = read('feedback');
  const grounded = [routine && `Your routine note: ${routine}`, goals && `Your current direction: ${goals}`, openTasks.length && `You have ${openTasks.length} open quest${openTasks.length === 1 ? '' : 's'} to account for`, correction && `A past correction: ${correction}`].filter(Boolean) as string[];
  const first = `${question.trim()} — take a small first step, then check how it fits your energy and existing commitments.`;
  const second = `Give yourself a little more room before deciding: gather one useful detail, or try a low-stakes version first.`;
  const recommendedPath = correction
    ? `Try the smaller, reversible version first. Your earlier correction says ${correction.toLowerCase()} — so leave room for that reality instead of assuming a perfect run.`
    : openTasks.length
      ? `Protect a modest block for this, but look at your ${openTasks.length} open quest${openTasks.length === 1 ? '' : 's'} before promising more time. A small trial keeps the choice reversible.`
      : `Start with a short, low-stakes trial. That gives you real information without asking you to commit before you know how it feels.`;
  const confidenceLevel: Confidence = enabled.length >= 4 && (routine || goals) ? 'Medium' : 'Low';
  const explanation = `This is a grounded possibility, not a prediction. Your stated style is “${style}.” ${constraints.trim() ? `You also named: ${constraints.trim()}.` : 'You have not added any constraints yet.'} ${grounded.length ? `The path also takes into account ${grounded.join('; ')}.` : 'There are only a few personal details available, so keep the suggestion light.'}`;
  return { id: existing?.id ?? id(), question: question.trim(), constraints: constraints.trim(), alternatives: [first, second], recommendedPath, confidenceLevel, explanation, assumptions: ['You can change course after a small trial.', constraints.trim() ? `Your stated constraint is: ${constraints.trim()}.` : 'No additional constraints were provided.'], createdAt: new Date().toISOString() };
}
function ScenarioPage({ data, update }: { data: AppData; update: (next: AppData) => void }) {
  const [question, setQuestion] = useState(''); const [constraints, setConstraints] = useState(''); const [selected, setSelected] = useState<string | null>(null);
  const [feedbackScenario, setFeedbackScenario] = useState<string | null>(null); const [actual, setActual] = useState(''); const [correction, setCorrection] = useState('');
  const current = data.scenarios.find((scenario) => scenario.id === selected) ?? data.scenarios[data.scenarios.length - 1];
  const run = (event: FormEvent) => { event.preventDefault(); if (!question.trim()) return; const scenario = makeScenario(question, constraints, data); update({ ...data, scenarios: [...data.scenarios, scenario] }); setSelected(scenario.id); setQuestion(''); setConstraints(''); };
  const rerun = (scenario: Scenario) => { const refreshed = makeScenario(scenario.question, scenario.constraints, data, scenario); update({ ...data, scenarios: data.scenarios.map((item) => item.id === scenario.id ? refreshed : item) }); setSelected(scenario.id); };
  const saveFeedback = (event: FormEvent) => {
    event.preventDefault(); if (!actual.trim() && !correction.trim()) return;
    const feedback: Feedback = { id: id(), scenarioId: feedbackScenario!, actualOutcome: actual.trim(), correction: correction.trim(), createdAt: new Date().toISOString() };
    const value = correction.trim() || actual.trim();
    const prior = data.memories.find((memory) => memory.category === 'feedback');
    const memory: Memory = { id: prior?.id ?? id(), category: 'feedback', label: 'What experience taught me', value, enabled: true };
    update({ ...data, feedback: [...data.feedback, feedback], memories: prior ? data.memories.map((item) => item.id === prior.id ? memory : item) : [...data.memories, memory] });
    setFeedbackScenario(null); setActual(''); setCorrection('');
  };
  return <div><SectionHead index="03" eyebrow="THE WHAT-IF GATE" title="Two roads. No crystal ball." description="Write down a choice you're weighing. Your twin will sketch two possible paths from your own context, then show its working." />
    <Dialogue>These are possibilities, not promises. The more you tell me about the trade-offs, the more grounded the walk-through can be.</Dialogue>
    <form className="scenario-form pixel-panel" onSubmit={run}><div className="editor-heading"><span className="card-kicker">SET THE SCENE</span><span className="scenario-glyph">◆ ◆</span></div><label className="field"><span>WHAT ARE YOU THINKING ABOUT?</span><textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would you like to change, choose, try, or say yes to?" rows={3} required data-testid="input-scenario-question" /></label><label className="field"><span>WHAT LIMITS OR TRADE-OFFS MATTER? <em>OPTIONAL</em></span><textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Time, money, energy, other people, timing — anything you want this to respect." rows={2} data-testid="input-scenario-constraints" /></label><div className="scenario-submit"><span><i className="lock-mark" /> Built from details you've allowed your twin to use.</span><button className="button button-accent" type="submit" data-testid="button-run-scenario">WALK THROUGH IT <span>→</span></button></div></form>
    {current && <section className="scenario-result enter-up"><div className="result-heading"><div><div className="eyebrow"><span className="eyebrow-mark">PATHS</span> A POSSIBLE WALK-THROUGH</div><h2>{current.question}</h2></div><div className={`confidence confidence-${current.confidenceLevel.toLowerCase()}`}><span>CONFIDENCE</span><b>{current.confidenceLevel}</b><small>qualitative, not a score</small></div></div>
      <div className="paths-grid"><article className="path-card"><div className="path-index">PATH 01 <span>◆</span></div><p>{current.alternatives[0]}</p></article><article className="path-card"><div className="path-index">PATH 02 <span>◇</span></div><p>{current.alternatives[1]}</p></article></div>
      <div className="recommendation pixel-panel"><div className="recommend-icon">→</div><div><div className="card-kicker">THE VILLAGER'S RECOMMENDED PATH</div><p>{current.recommendedPath}</p></div></div>
      <details className="working-details"><summary>SHOW THE WORKING <span>+</span></summary><div className="working-body"><h3>Why this fits your context</h3><p>{current.explanation}</p><h3>Assumptions to keep in mind</h3><ul>{current.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul><p className="not-prediction">A possible outcome—not a guaranteed prediction. You know your situation best.</p></div></details>
      <div className="result-actions"><button className="button button-outline" onClick={() => rerun(current)} data-testid="button-rerun-scenario">↻ RERUN WITH WHAT YOUR TWIN KNOWS NOW</button><button className="button button-quiet" onClick={() => { setFeedbackScenario(current.id); document.getElementById('feedback-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>TELL YOUR TWIN HOW IT WENT</button></div>
      {feedbackScenario === current.id && <form className="feedback-form pixel-panel" id="feedback-form" onSubmit={saveFeedback}><div className="editor-heading"><span className="card-kicker">A NOTE FOR NEXT TIME</span><button className="close-text" type="button" onClick={() => setFeedbackScenario(null)}>CLOSE ×</button></div><p>What happened in real life? What did the walk-through miss? Your correction becomes an editable memory and can shape the next rerun.</p><label className="field"><span>WHAT ACTUALLY HAPPENED? <em>OPTIONAL</em></span><textarea value={actual} onChange={(e) => setActual(e.target.value)} rows={2} placeholder="A few words about how it played out." data-testid="input-feedback-outcome" /></label><label className="field"><span>WHAT SHOULD YOUR TWIN REMEMBER? <em>OPTIONAL</em></span><textarea value={correction} onChange={(e) => setCorrection(e.target.value)} rows={2} placeholder="For example: I need more recovery time than I expect." data-testid="input-feedback-correction" /></label><button className="button button-primary" type="submit">SAVE CORRECTION <span>→</span></button></form>}
    </section>}
    {data.scenarios.length > 1 && <div className="scenario-history"><span className="card-kicker">YOUR EARLIER WHAT-IFS</span>{[...data.scenarios].reverse().slice(1).map((scenario) => <button key={scenario.id} className={`history-item ${selected === scenario.id ? 'current' : ''}`} onClick={() => setSelected(scenario.id)}><span>{new Date(scenario.createdAt).toLocaleDateString()}</span><b>{scenario.question}</b><span>OPEN →</span></button>)}</div>}
  </div>;
}
function TwinPage({ data, update }: { data: AppData; update: (next: AppData) => void }) {
  const [editing, setEditing] = useState(false);
  if (!data.profile) return null;
  const profile = data.profile;
  const save = (next: Profile) => { update({ ...data, profile: next, memories: memoriesFor(next, data.memories) }); setEditing(false); };
  return <div><SectionHead index="04" eyebrow="YOUR TWIN" title="The villager learns from you." description="A living field guide to the details you've chosen to share. Change anything; nothing here is set in stone." />
    <Dialogue>I'm not a blank slate, but I'm not an expert on you either. The useful bits are the things you choose to tell me.</Dialogue>
    {editing ? <div className="editor-card pixel-panel"><div className="editor-heading"><span className="card-kicker">EDIT YOUR PROFILE</span></div><ProfileForm initial={profile} buttonText="SAVE PROFILE" onSave={save} onCancel={() => setEditing(false)} /></div> : <><div className="twin-banner pixel-panel"><div className="twin-portrait"><PixelVillager /></div><div><span className="card-kicker">THE PERSON BEHIND THE PROFILE</span><h2>{profile.name || 'A villager without a name'}</h2><p>{profile.about || 'You have not added a personal note yet.'}</p></div><button className="button button-outline" onClick={() => setEditing(true)} data-testid="button-edit-profile">EDIT ANSWERS</button></div><div className="profile-facts">{[
      ['HOBBIES & INTERESTS', profile.hobbies], ['USUAL RHYTHM', profile.routine], ['SKILLS & STRENGTHS', profile.skills],
      ['PERSONALITY', profile.personality], ['PREFERRED WORK STYLE', profile.workStyle], ['CURRENT GOALS', profile.goals.join(' · ')],
      ['FREE HOURS ON A TYPICAL DAY', `${profile.freeHoursPerDay} hours`],
    ].map(([label, value]) => <div className="fact-card" key={label}><span>{label}</span><p>{value || 'Nothing shared yet.'}</p></div>)}</div></>}
    <div className="twin-bottom"><div><span className="card-kicker">MEMORY CABINET</span><p>{data.memories.length} remembered details <span>·</span> {data.memories.filter((memory) => memory.enabled && data.permissions[memory.category]).length} currently in use</p></div><Link href="/privacy" className="button button-outline">MANAGE MEMORIES →</Link></div>
  </div>;
}
function EvolutionPage({ data, update }: { data: AppData; update: (next: AppData) => void }) {
  const memory = data.memories.find((item) => item.category === 'feedback');
  const [nextValue, setNextValue] = useState(memory?.value ?? '');
  const [saved, setSaved] = useState(false);
  const [rerunId, setRerunId] = useState('');
  const save = (event: FormEvent) => { event.preventDefault(); const updated: Memory = { id: memory?.id ?? id(), category: 'feedback', label: 'What experience taught me', value: nextValue.trim(), enabled: true }; update({ ...data, memories: [...data.memories.filter((item) => item.category !== 'feedback'), ...(nextValue.trim() ? [updated] : [])] }); setSaved(true); };
  const rerun = (scenario: Scenario) => { const refreshed = makeScenario(scenario.question, scenario.constraints, data, scenario); update({ ...data, scenarios: data.scenarios.map((item) => item.id === scenario.id ? refreshed : item) }); setRerunId(scenario.id); };
  return <div><SectionHead index="05" eyebrow="EVOLUTION / FIELD NOTES" title="Real life is the best patch note." description="When a what-if meets the real world, tell your twin what it got wrong. A useful correction can change what it recommends next time." />
    <Dialogue>I'm allowed to be wrong. The important bit is whether I remember what you tell me afterward.</Dialogue>
    <div className="evolution-layout"><section className="evolution-card pixel-panel"><div className="card-kicker">YOUR CURRENT CORRECTION</div><h2>What should your twin keep in mind?</h2><p>This one memory can be revised or removed at any time. It only shapes scenarios while the Corrections permission is on.</p><form onSubmit={save}><label className="field"><span>REMEMBER THIS ABOUT MY EXPERIENCE</span><textarea value={nextValue} onChange={(e) => { setNextValue(e.target.value); setSaved(false); }} rows={4} placeholder="For instance: I tend to underestimate the recovery time after a busy week." data-testid="input-evolution-memory" /><small>Feedback from a scenario is also saved here automatically. Edit it in your own words.</small></label><button className="button button-primary" type="submit">SAVE MEMORY CHANGE <span>→</span></button>{saved && <span className="save-confirm" role="status">Saved in your browser. Your next rerun can use this.</span>}</form></section>
      <aside className="evolution-side"><div className="old-new"><span className="card-kicker">MEMORY, MADE VISIBLE</span><div className="memory-change"><small>BEFORE / THIS WAS ON THE MAP</small><p>{memory?.value || 'No correction saved yet.'}</p></div><div className="change-arrow">↓</div><div className="memory-change memory-new"><small>NOW / YOUR TWIN WILL USE</small><p>{nextValue || 'No correction saved yet.'}</p></div></div><div className="feedback-log"><span className="card-kicker">REAL-WORLD NOTES</span>{data.feedback.length ? [...data.feedback].reverse().map((item) => <article key={item.id}><small>{new Date(item.createdAt).toLocaleDateString()}</small><b>{data.scenarios.find((scenario) => scenario.id === item.scenarioId)?.question ?? 'Earlier what-if'}</b><p>{item.actualOutcome || item.correction}</p></article>) : <p className="empty-quiet">No real-world notes yet. Add one from a scenario walk-through.</p>}</div></aside></div>
    <section className="rerun-panel"><div><span className="card-kicker">PUT THE NEW MEMORY TO WORK</span><h2>Revisit an old what-if.</h2><p>Rerun a saved scenario with your current profile and enabled memories.</p></div>{data.scenarios.length ? <div className="rerun-list">{data.scenarios.slice().reverse().map((scenario) => <div className="rerun-item" key={scenario.id}><span>{scenario.question}</span><button className="button button-outline" onClick={() => rerun(scenario)} data-testid={`button-evolution-rerun-${scenario.id}`}>{rerunId === scenario.id ? 'UPDATED ✓' : 'RERUN →'}</button></div>)}</div> : <div className="quiet-box">You haven't saved a what-if yet. Write one in <Link href="/scenarios">the scenario gate →</Link></div>}</section>
  </div>;
}
function PrivacyPage({ data, update, reset }: { data: AppData; update: (next: AppData) => void; reset: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null); const [draft, setDraft] = useState(''); const [confirm, setConfirm] = useState(false);
  const togglePermission = (category: Category, enabled: boolean) => update({ ...data, permissions: { ...data.permissions, [category]: enabled } });
  const removeMemory = (memory: Memory) => { if (window.confirm(`Delete the remembered detail “${memory.label}”?`)) update({ ...data, memories: data.memories.filter((item) => item.id !== memory.id) }); };
  const saveMemory = (memory: Memory) => { update({ ...data, memories: data.memories.map((item) => item.id === memory.id ? { ...item, value: draft } : item) }); setEditingId(null); };
  return <div><SectionHead index="06" eyebrow="PRIVACY & CONTROL" title="Your world stays on this device." description="Alter Ego doesn't use a network, account, or server. Everything below lives in this browser's local storage." />
    <Dialogue>You're the gatekeeper. Turn a category off to keep it out of scenario suggestions, edit a memory to correct it, or clear the whole save file.</Dialogue>
    <div className="privacy-notice pixel-panel"><div className="notice-lock">LOCAL<br />ONLY</div><div><span className="card-kicker">BROWSER-LOCAL STORAGE</span><p>Your profile, quest log, scenarios, feedback, and memories are saved on this device in this browser. Clearing browser data can remove them. Nothing is sent to a server.</p><Link href="/twin">Review your profile →</Link></div></div>
    <section className="permission-section"><div className="privacy-heading"><div><span className="card-kicker">CATEGORY PERMISSIONS</span><h2>What may your twin use?</h2></div><span className="permission-count">{Object.values(data.permissions).filter(Boolean).length} / {categories.length} ON</span></div>{categories.map((category) => <label key={category.key} className="permission-row"><div><b>{category.label}</b><small>{category.hint}</small></div><input type="checkbox" checked={data.permissions[category.key]} onChange={(e) => togglePermission(category.key, e.target.checked)} data-testid={`toggle-permission-${category.key}`} /><span className="toggle-track" aria-hidden="true"><i /></span></label>)}</section>
    <section className="memory-section"><div className="privacy-heading"><div><span className="card-kicker">MEMORY CABINET</span><h2>Look at what's remembered.</h2></div><span className="permission-count">{data.memories.length} DETAILS</span></div>{data.memories.length ? <div className="memory-list">{data.memories.map((memory) => <article key={memory.id} className={`memory-row ${!memory.enabled || !data.permissions[memory.category] ? 'memory-paused' : ''}`}><div className="memory-indicator">{memory.enabled && data.permissions[memory.category] ? 'IN USE' : 'PAUSED'}</div><div className="memory-content"><span>{memory.label} <small>· {categories.find((category) => category.key === memory.category)?.label}</small></span>{editingId === memory.id ? <div className="memory-edit"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} data-testid={`input-memory-${memory.id}`} /><button onClick={() => saveMemory(memory)}>SAVE</button><button onClick={() => setEditingId(null)}>CANCEL</button></div> : <p>{memory.value}</p>}</div><div className="memory-actions">{editingId !== memory.id && <><button onClick={() => { setEditingId(memory.id); setDraft(memory.value); }} data-testid={`button-edit-memory-${memory.id}`}>EDIT</button><button onClick={() => removeMemory(memory)} data-testid={`button-delete-memory-${memory.id}`}>DELETE</button><button onClick={() => update({ ...data, memories: data.memories.map((item) => item.id === memory.id ? { ...item, enabled: !item.enabled } : item) })}>{memory.enabled ? 'PAUSE' : 'USE'}</button></>}</div></article>)}</div> : <div className="quiet-box">No stored memories yet. Memories come from the profile details you share and corrections you choose to keep.</div>}</section>
    <section className="reset-zone"><div><span className="card-kicker">START OVER</span><h2>Clear your local save.</h2><p>This removes your profile, quests, scenarios, feedback, memories, and permissions from this browser. This cannot be undone.</p></div>{confirm ? <div className="confirm-reset"><b>Clear everything from this browser?</b><button className="button button-danger" onClick={reset} data-testid="button-confirm-reset">YES, CLEAR THE SAVE</button><button className="button button-quiet" onClick={() => setConfirm(false)}>KEEP MY SAVE</button></div> : <button className="button button-danger-outline" onClick={() => setConfirm(true)} data-testid="button-reset-data">CLEAR ALL LOCAL DATA</button>}</section>
  </div>;
}
function NotFoundPage() { return <div className="not-found"><span className="eyebrow">LOST ON THE PATH</span><h1>That trail ends here.</h1><Link href="/" className="button button-primary">BACK TO THE VILLAGE →</Link></div>; }
function App() {
  const [data, setData] = useState<AppData>(readData);
  const [, setLocation] = useLocation();
  const update = (next: AppData) => { setData(next); try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* storage may be unavailable */ } };
  const saveProfile = (profile: Profile) => { update({ ...data, profile, memories: memoriesFor(profile, data.memories) }); setLocation('/'); };
  const reset = () => { const clean = emptyData(); update(clean); setLocation('/'); };
  if (!data.profile) return <Onboarding onSave={saveProfile} />;
  return <Shell data={data}><Switch>
    <Route path="/"><HomePage data={data} navigate={setLocation} /></Route>
    <Route path="/quests"><QuestPage data={data} update={update} /></Route>
    <Route path="/scenarios"><ScenarioPage data={data} update={update} /></Route>
    <Route path="/twin"><TwinPage data={data} update={update} /></Route>
    <Route path="/evolution"><EvolutionPage data={data} update={update} /></Route>
    <Route path="/privacy"><PrivacyPage data={data} update={update} reset={reset} /></Route>
    <Route component={NotFoundPage} />
  </Switch></Shell>;
}
export default App;