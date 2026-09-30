import './alter-ego.css';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';
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
type PathLevel = 'Low' | 'Medium' | 'High';
type ScenarioPath = {
  title: string;
  action: string;
  likelyOutcome: string;
  upside: string;
  tradeoff: string;
  firstStep: string;
  metrics: {
    time: PathLevel;
    energy: PathLevel;
    risk: PathLevel;
    fit: PathLevel;
  };
};
type Scenario = {
  id: string; question: string; constraints: string; alternatives: string[];
  recommendedPath: string; recommendationReason?: string; confidenceLevel: Confidence; explanation: string;
  assumptions: string[]; createdAt: string; paths?: ScenarioPath[]; analysisSummary?: string;
  choiceOne?: string; choiceTwo?: string;
};
type Category = 'profile' | 'interests' | 'routine' | 'skills' | 'personality' | 'goals' | 'tasks' | 'feedback';
type Memory = { id: string; category: Category; label: string; value: string; enabled: boolean };
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };
type Feedback = { id: string; scenarioId: string; actualOutcome: string; correction: string; createdAt: string };
type AppData = {
  profile: Profile | null; tasks: UserTask[]; scenarios: Scenario[]; memories: Memory[]; chat: ChatMessage[];
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
  profile: null, tasks: [], scenarios: [], memories: [], chat: [], permissions: emptyPermissions(), feedback: [],
});
function readData(): AppData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const chat = Array.isArray(parsed.chat)
      ? parsed.chat.filter((message): message is ChatMessage =>
          typeof message === 'object' && message !== null &&
          typeof message.id === 'string' &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string' &&
          typeof message.createdAt === 'string',
        ).slice(-80)
      : [];
    return { ...emptyData(), ...parsed, chat, permissions: { ...emptyPermissions(), ...parsed.permissions } };
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
function splitGoals(value: string) { return value.split(/\n+/).map((part) => part.trim()).filter(Boolean); }
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
    ['/twin', 'Your twin', '04'], ['/chat', 'AI chat', '05'], ['/evolution', 'Evolution', '06'], ['/privacy', 'Privacy', '07'],
  ];
  return <div className="app-shell">
    <aside className="side-rail">
      <Link href="/" className="brand-lockup"><BrandMark /><span><strong>ALTER EGO</strong><small>YOUR OWN SIDEKICK</small></span></Link>
      <div className="rail-label">FIELD GUIDE <span>— 07</span></div>
      <nav aria-label="Main navigation" className="rail-nav">
        {links.map(([href, label, n]) => <Link key={href} href={href} className={`nav-link ${path === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
          <span className="nav-number">{n}</span><span>{label}</span>{path === href && <span className="nav-caret">›</span>}
        </Link>)}
      </nav>
      <div className="rail-bottom">
        <div className="rail-villager"><PixelVillager small /><span className="pixel-speech">Ready when<br />you are.</span></div>
        <p>LOCAL SAVE. GEMINI BY REQUEST.<br />JUST YOUR OWN WORLD.</p>
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
  const [goalsText, setGoalsText] = useState(initial.goals.join('\n'));
  const patch = (key: keyof Profile, value: string | number | string[]) => setProfile((current) => ({ ...current, [key]: value }));
  const input = (label: string, key: keyof Profile, placeholder: string, help?: string) => <label className="field">
    <span>{label}</span><textarea value={profile[key] as string} onChange={(event) => patch(key, event.target.value)} placeholder={placeholder} rows={key === 'about' || key === 'routine' ? 3 : 2} data-testid={`input-profile-${key}`} />{help && <small>{help}</small>}
  </label>;
  return <form className="profile-form" onSubmit={(event) => { event.preventDefault(); onSave({ ...profile, goals: splitGoals(goalsText) }); }}>
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
      <label className="field field-wide"><span>WHAT ARE YOU WORKING TOWARD?</span><textarea value={goalsText} onChange={(e) => setGoalsText(e.target.value)} placeholder="A personal goal, a change you're considering, or just a direction." rows={2} data-testid="input-profile-goals" /><small>Put each goal on a new line. Spaces and punctuation are kept as you type.</small></label>
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
    <div className="home-grid"><section className="welcome-card pixel-panel"><div className="welcome-top"><span className="card-kicker">VILLAGER ON DUTY</span><span className="status-tag"><i /> HERE</span></div><div className="welcome-center"><PixelVillager /><div><h2>Ready when you are.</h2><p>Your twin works from what you've shared—not from guesses about everyone else.</p></div></div><Dialogue label="FIELD NOTE">Got a decision rattling around? We can walk through two possible paths. No fortune-telling, just a useful second look.</Dialogue><div className="welcome-actions"><button className="button button-accent" onClick={() => navigate('/scenarios')} data-testid="button-open-scenario">THINK THROUGH A WHAT-IF <span>→</span></button><button className="button button-outline" onClick={() => navigate('/chat')}>ASK A QUESTION</button></div></section>
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
const stopWords = new Set('about after again against also and are because before being between both but can could day did does doing down each for from get got had has have her here him his how into its just like make more most much not now off once only our out over own really same should some such than that the their them then there these they thing this through too under until very want was way were what when where which while with would you your'.split(' '));
function words(value: string) {
  return [...new Set((value.toLowerCase().match(/[a-z0-9']+/g) ?? []).filter((word) => word.length > 2 && !stopWords.has(word)))];
}
function levelFromScore(value: number): PathLevel {
  return value >= 3 ? 'High' : value <= 1 ? 'Low' : 'Medium';
}
function levelScore(value: PathLevel) {
  return value === 'High' ? 3 : value === 'Low' ? 1 : 2;
}
function cleanChoice(value: string) {
  return value.trim().replace(/^(?:i|we|you)\s+(?:want to|need to|plan to|could|might|should|will|am going to)\s+/i, '').replace(/^(?:i|we|you)\s+/i, '').replace(/[?.!]+$/g, '').trim();
}
function readChoices(question: string, choiceOne: string, choiceTwo: string) {
  if (choiceOne.trim() && choiceTwo.trim()) {
    return { one: cleanChoice(choiceOne), two: cleanChoice(choiceTwo), explicit: true };
  }
  const cleaned = question.trim()
    .replace(/^(?:what if|what happens if|should i|should we|would it be better if|would i be better off if|i am deciding whether)\s+/i, '')
    .replace(/[?.!]+$/g, '');
  const contrast = cleaned.match(/^(.+?)\s+(?:rather than|instead of)\s+(.+)$/i);
  if (contrast) return { one: cleanChoice(contrast[1]), two: cleanChoice(contrast[2]), explicit: true };
  const pair = cleaned.split(/\s+(?:or|vs\.?|versus)\s+/i);
  if (pair.length === 2) return { one: cleanChoice(pair[0]), two: cleanChoice(pair[1]), explicit: true };
  const between = cleaned.match(/^between\s+(.+?)\s+and\s+(.+)$/i);
  if (between) return { one: cleanChoice(between[1]), two: cleanChoice(between[2]), explicit: true };
  const area = classifyDecision(question);
  if (area === 'wellbeing' && /\b(gym|workout|work out|exercise|fitness|running|run)\b/i.test(question)) {
    return {
      one: 'Go to the gym for one short, pre-planned session',
      two: 'Skip the gym commute and try a short workout or walk at home',
      explicit: false,
    };
  }
  if (area === 'wellbeing') {
    return {
      one: 'Make one small change to your routine this week',
      two: 'Keep your routine steady and try a lower-effort alternative first',
      explicit: false,
    };
  }
  if (area === 'work') {
    return {
      one: 'Move ahead with the work change you are considering',
      two: 'Keep your current setup while you check the new option first',
      explicit: false,
    };
  }
  if (area === 'money') {
    return {
      one: 'Go ahead after checking the full cost',
      two: 'Wait and compare the cost with a lower-commitment alternative',
      explicit: false,
    };
  }
  if (area === 'relationships') {
    return {
      one: 'Bring it up in a direct, low-pressure conversation',
      two: 'Take time to clarify what you need before starting the conversation',
      explicit: false,
    };
  }
  if (area === 'learning') {
    return {
      one: 'Start with a short learning session this week',
      two: 'Try a free lesson or sample before making a bigger commitment',
      explicit: false,
    };
  }
  if (area === 'location') {
    return {
      one: 'Plan a short visit to test the change in real life',
      two: 'Stay put for now while you check the costs and logistics',
      explicit: false,
    };
  }
  return {
    one: 'Take a direct first step to address the situation',
    two: 'Keep things steady and test a smaller, reversible alternative first',
    explicit: false,
  };
}
function classifyDecision(value: string) {
  if (/\b(money|cost|budget|buy|purchase|debt|rent|salary|expensive|income|price|bill|loan|savings|finance)\b/i.test(value)) return 'money';
  if (/\b(jobs?|career|quit|resign|manager|business|client|shift|employer|workplace|promotion)\b|\bwork\s+(?:offer|schedule|hours|contract|role)\b/i.test(value)) return 'work';
  if (/\b(friend|partner|relationship|date|family|mum|mom|dad|parent|tell them|talk to)\b/i.test(value)) return 'relationships';
  if (/\b(study|learn|course|college|school|practice|exam|class|skill)\b/i.test(value)) return 'learning';
  if (/\b(health|sleep|rest|exercise|gym|food|energy|tired|stress|wellbeing|lazy|unmotivated|procrastinat)\b/i.test(value)) return 'wellbeing';
  if (/\b(travel|trip|city|country|commute|relocate|visit)\b|\bmove\s+(?:to|from|house|city|country|abroad)\b/i.test(value)) return 'location';
  return 'daily life';
}
function estimatePathMetrics(action: string, context: string, preferenceContext: string, hasProfile: boolean, hasCommitments: boolean): ScenarioPath['metrics'] {
  const text = `${action} ${context}`;
  const demandWords = (text.match(/\b(every day|daily|full.time|long hours|extra hours|at once|all night|multiple|full time|commute|travel|move)\b/gi) ?? []).length;
  const workWords = (text.match(/\b(study|work|practice|build|start|learn|prepare|change|apply|plan|care|support)\b/gi) ?? []).length;
  const riskWords = (text.match(/\b(quit|leave|move|break up|debt|borrow|resign|drop out|sell|spend|confront|cut off|sign|commit)\b/gi) ?? []).length;
  const userTokens = new Set(words(preferenceContext));
  const actionTokens = words(action);
  const fitCount = actionTokens.filter((word) => userTokens.has(word)).length;
  const fit: PathLevel = !hasProfile ? 'Low' : fitCount >= 2 ? 'High' : 'Medium';
  let timeScore = demandWords >= 2 ? 3 : demandWords === 1 || workWords >= 2 ? 2 : 1;
  if (hasCommitments && workWords > 0) timeScore = Math.min(3, timeScore + 1);
  const energyScore = /\b(exhaust|drain|overwhelm|stress|burnout|late night|all night|long hours)\b/i.test(text)
    ? 3
    : workWords > 0 || /\b(new|move|change|travel)\b/i.test(action) ? 2 : 1;
  const riskScore = riskWords >= 2 || /\b(quit|debt|resign|drop out|break up|move countries)\b/i.test(text)
    ? 3
    : riskWords > 0 || /\b(switch|change|spend|confront|commit)\b/i.test(action) ? 2 : 1;
  return {
    time: levelFromScore(timeScore),
    energy: levelFromScore(energyScore),
    risk: levelFromScore(riskScore),
    fit,
  };
}
function outcomeForPath(action: string, area: string, constraints: string, matchingGoal: string, hours: string) {
  const anchor = matchingGoal ? ` It connects to your stated goal, “${matchingGoal}.”` : '';
  const timeNote = hours ? ` Your profile says you typically have ${hours} free per day.` : '';
  const limitNote = constraints ? ` The key limit you named is: ${constraints}.` : '';
  const actionName = action.charAt(0).toLowerCase() + action.slice(1);
  if (area === 'money') return `If you ${actionName}, the first likely change is to your available money or ongoing costs. Check the full cost and what buffer remains before treating the upside as certain.${anchor}${limitNote}`;
  if (area === 'work') return `If you ${actionName}, your schedule, workload, or income may shift first. The outcome depends on the terms and support available, so verify those before making an irreversible move.${anchor}${timeNote}${limitNote}`;
  if (area === 'relationships') return `If you ${actionName}, the immediate outcome depends on how the other person responds. A clear, low-pressure conversation can reveal more before you make a bigger decision.${anchor}${limitNote}`;
  if (area === 'learning') return `If you ${actionName}, the most immediate effect is likely to be on your study time and energy. It may build momentum, but only if it fits around the commitments you already have.${anchor}${timeNote}${limitNote}`;
  if (area === 'wellbeing') return `If you ${actionName}, pay attention to how your energy and routine respond over a short trial. This can help you notice a pattern, but it is not a health assessment.${anchor}${timeNote}${limitNote}`;
  if (area === 'location') return `If you ${actionName}, the first practical effects are likely to involve travel, time, or day-to-day logistics. Check the cost and routine change before committing.${anchor}${timeNote}${limitNote}`;
  return `If you ${actionName}, the first likely effect is a change in your time, routine, or current commitments. Try to notice which of those actually shifts instead of assuming the outcome in advance.${anchor}${timeNote}${limitNote}`;
}
function firstStepForPath(action: string, area: string) {
  if (area === 'money') return `Write down the full one-time and recurring cost of “${action}” and compare it with what you need to keep aside.`;
  if (area === 'work') return `Check one concrete detail about “${action}”—hours, pay, responsibilities, or who can support you—before deciding.`;
  if (area === 'relationships') return `Choose one calm moment to say what you need from “${action}” and ask how the other person sees it.`;
  if (area === 'learning') return `Try one short, focused session for “${action},” then check how much time and energy it really used.`;
  if (area === 'wellbeing') return `Try the smallest safe version of “${action}” once and note how your energy feels afterward.`;
  if (area === 'location') return `Check one practical detail for “${action}”—cost, timing, travel, or where you would stay.`;
  return `Do one reversible first step toward “${action}” and decide what evidence would make you continue or pause.`;
}
function makeScenario(question: string, constraints: string, data: AppData, existing?: Scenario, choiceOne = '', choiceTwo = ''): Scenario {
  const enabled = data.memories.filter((memory) => memory.enabled && data.permissions[memory.category]);
  const read = (category: Category) => enabled.filter((memory) => memory.category === category).map((memory) => memory.value).join(' · ');
  const goals = read('goals');
  const interests = read('interests');
  const skills = read('skills');
  const personal = read('profile');
  const routine = read('routine');
  const workStyle = read('personality');
  const feedback = read('feedback');
  const hours = enabled.find((memory) => memory.label === 'Free hours per day')?.value ?? '';
  const openTasks = data.permissions.tasks ? data.tasks.filter((task) => !task.done) : [];
  const availableContext = [personal, goals, interests, skills, routine, workStyle, feedback].filter(Boolean).join(' · ');
  const preferenceContext = [personal, goals, interests, skills, routine, workStyle, feedback].filter(Boolean).join(' ');
  const choices = readChoices(question, choiceOne, choiceTwo);
  const area = classifyDecision(`${question} ${choices.one} ${choices.two} ${constraints}`);
  const matchingGoal = goals.split(/[·\n]/).map((goal) => goal.trim()).filter(Boolean)
    .sort((a, b) => words(b).filter((word) => words(`${question} ${choices.one} ${choices.two}`).includes(word)).length - words(a).filter((word) => words(`${question} ${choices.one} ${choices.two}`).includes(word)).length)[0] ?? '';
  const situationContext = `${question} ${constraints} ${availableContext} ${openTasks.map((task) => `${task.title} ${task.details}`).join(' ')}`;
  const workloadContext = `${constraints} ${routine} ${openTasks.map((task) => `${task.title} ${task.details}`).join(' ')}`;
  const taskNote = openTasks.length
    ? ` You also have ${openTasks.length} unfinished personal quest${openTasks.length === 1 ? '' : 's'} in your own log.`
    : '';
  const actions = [choices.one, choices.two];
  const paths: ScenarioPath[] = actions.map((action, index) => {
    const metrics = estimatePathMetrics(action, workloadContext, preferenceContext, Boolean(availableContext), openTasks.length > 0);
    const riskTradeoff = metrics.risk === 'High'
      ? 'This is the higher-stakes part of this route; verify the details you can before committing.'
      : metrics.risk === 'Medium'
        ? 'There is some uncertainty here; keep a way to adjust if the first result is not what you expected.'
        : 'This route looks more reversible from the details provided, but it still depends on what happens next.';
    const delayTradeoff = index === 0
      ? 'Acting sooner can create momentum, but it leaves less time to check what you may be giving up.'
      : 'A smaller trial can reduce uncertainty, but waiting too long may delay the change you want.';
    return {
      title: `PATH ${index === 0 ? 'A' : 'B'} · ${action}`,
      action,
      likelyOutcome: `${outcomeForPath(action, area, constraints, matchingGoal, hours)}${taskNote}`,
      upside: matchingGoal ? `May move you toward “${matchingGoal}.”` : area === 'daily life' ? 'Could give you useful first-hand information about this choice.' : `Could give you a clearer read on the ${area} trade-off.`,
      tradeoff: `${riskTradeoff} ${delayTradeoff}`,
      firstStep: firstStepForPath(action, area),
      metrics,
    };
  });
  const points = paths.map((path) =>
    levelScore(path.metrics.fit) * 2 +
    (4 - levelScore(path.metrics.risk)) +
    (4 - levelScore(path.metrics.time)) +
    (4 - levelScore(path.metrics.energy))
  );
  const recommendedIndex = points[0] === points[1]
    ? (levelScore(paths[0].metrics.risk) + levelScore(paths[0].metrics.time) + levelScore(paths[0].metrics.energy) <=
      levelScore(paths[1].metrics.risk) + levelScore(paths[1].metrics.time) + levelScore(paths[1].metrics.energy) ? 0 : 1)
    : (points[0] > points[1] ? 0 : 1);
  const recommendedPath = paths[recommendedIndex].title;
  const relevantFacts = [
    routine && `your routine (${routine})`,
    personal && `your note (${personal})`,
    workStyle && `how you like to work (${workStyle})`,
    goals && `your stated goal${goals.includes('·') ? 's' : ''} (${goals})`,
    skills && `your skills (${skills})`,
    feedback && `your past correction (${feedback})`,
    openTasks.length > 0 && `${openTasks.length} unfinished quest${openTasks.length === 1 ? '' : 's'}`,
  ].filter(Boolean) as string[];
  const explanation = `The comparison uses the two options in your wording, then weighs their relative time, energy, risk and overlap with details you have allowed. ${relevantFacts.length ? `Relevant details: ${relevantFacts.join('; ')}.` : 'You have not allowed profile details for this comparison, so the paths are based on the situation and constraints you typed.'} The recommended path scores better on that qualitative trade-off, not on a calculated chance of success.`;
  const recommendedMetrics = paths[recommendedIndex].metrics;
  const otherMetrics = paths[1 - recommendedIndex].metrics;
  const recommendationReason = levelScore(recommendedMetrics.risk) < levelScore(otherMetrics.risk)
    ? 'I’d start here because it looks like the lower-risk option from the details available.'
    : levelScore(recommendedMetrics.time) + levelScore(recommendedMetrics.energy) < levelScore(otherMetrics.time) + levelScore(otherMetrics.energy)
      ? 'I’d start here because it looks more manageable on time and energy.'
      : levelScore(recommendedMetrics.fit) > levelScore(otherMetrics.fit)
        ? 'I’d lean this way because it appears closer to the goals and preferences you have shared.'
        : 'I’d lean this way based on the overall balance of the two paths. This is a qualitative suggestion, not a prediction.';
  const evidenceCount = enabled.length + (constraints.trim() ? 1 : 0) + (choices.explicit ? 1 : 0);
  const confidenceLevel: Confidence = evidenceCount >= 5 ? 'Medium' : 'Low';
  const analysisSummary = `This is a ${area} decision: “${choices.one}” compared with “${choices.two}.” The chart shows relative demands and fit; it does not predict a percentage chance of either outcome.`;
  return {
    id: existing?.id ?? id(),
    question: question.trim(),
    constraints: constraints.trim(),
    alternatives: paths.map((path) => `${path.title}: ${path.likelyOutcome}`),
    paths,
    analysisSummary,
    choiceOne: choices.explicit ? choices.one : '',
    choiceTwo: choices.explicit ? choices.two : '',
    recommendedPath,
    recommendationReason,
    confidenceLevel,
    explanation,
    assumptions: [
      'The route descriptions use only the details available here; missing outside factors could change the outcome.',
      constraints.trim() ? `The comparison treats this as an important constraint: ${constraints.trim()}.` : 'No extra limits or trade-offs were added, so time and risk are rough qualitative reads.',
      'These are possible paths, not guaranteed predictions.',
    ],
    createdAt: new Date().toISOString(),
  };
}
async function analyzeScenario(question: string, data: AppData, existing?: Scenario): Promise<Scenario> {
  const context = data.memories
    .filter((memory) => memory.enabled && data.permissions[memory.category])
    .map(({ category, label, value }) => ({ category, label, value }));
  const openTasks = data.permissions.tasks
    ? data.tasks.filter((task) => !task.done).map(({ title, details }) => ({ title, details }))
    : [];
  const response = await fetch('/api/scenarios/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      constraints: existing?.constraints ?? '',
      context,
      openTasks,
    }),
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
      ? result.error
      : 'Scenario analysis is temporarily unavailable. Please try again.';
    throw new Error(message);
  }
  if (
    typeof result !== 'object' ||
    result === null ||
    !('paths' in result) ||
    !Array.isArray(result.paths) ||
    result.paths.length !== 2
  ) {
    throw new Error('Gemini returned an incomplete analysis. Please try again.');
  }
  const analysis = result as Scenario;
  const paths = analysis.paths as ScenarioPath[];
  return {
    ...analysis,
    paths,
    id: existing?.id ?? id(),
    question: question.trim(),
    constraints: existing?.constraints ?? '',
    alternatives: paths.map((path) => `${path.action}: ${path.likelyOutcome}`),
    choiceOne: existing?.choiceOne ?? '',
    choiceTwo: existing?.choiceTwo ?? '',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}
function TradeoffGraph({ paths }: { paths: ScenarioPath[] }) {
  const metrics: { key: keyof ScenarioPath['metrics']; label: string; note: string }[] = [
    { key: 'time', label: 'Time demand', note: 'Lower is lighter' },
    { key: 'energy', label: 'Energy demand', note: 'Lower is lighter' },
    { key: 'risk', label: 'Downside risk', note: 'Lower is safer' },
    { key: 'fit', label: 'Fit with your goals', note: 'Higher is closer' },
  ];
  return <section className="tradeoff-graph pixel-panel" aria-label="Qualitative path comparison">
    <div className="tradeoff-heading"><div><span className="card-kicker">THE CHOICE MAP</span><h3>How the paths compare</h3><p>Relative levels inferred from your wording and allowed context—not probabilities or measured forecasts.</p></div><span className="tradeoff-scale">LOW · MEDIUM · HIGH</span></div>
    <div className="tradeoff-legend"><span><i className="legend-a" /> PATH A</span><span><i className="legend-b" /> PATH B</span></div>
    <div className="tradeoff-rows">{metrics.map((metric) => <div className="tradeoff-row" key={metric.key}>
      <div className="tradeoff-label"><b>{metric.label}</b><small>{metric.note}</small></div>
      {paths.map((path, index) => {
        const level = path.metrics[metric.key];
        const value = levelScore(level);
        return <div className="tradeoff-bar-row" key={`${metric.key}-${index}`}>
          <span className={`tradeoff-path-label tradeoff-path-${index}`}>P{index === 0 ? 'A' : 'B'}</span>
          <div className="tradeoff-track" role="meter" aria-label={`${path.title}: ${metric.label}`} aria-valuemin={1} aria-valuemax={3} aria-valuenow={value} aria-valuetext={level}>
            <span className={`tradeoff-fill tradeoff-path-${index} tradeoff-level-${level.toLowerCase()}`} style={{ width: `${value * 33.333}%` }} />
          </div>
          <span className="tradeoff-level">{level}</span>
        </div>;
      })}
    </div>)}</div>
  </section>;
}
function ScenarioPage({ data, update }: { data: AppData; update: (next: AppData) => void }) {
  const [question, setQuestion] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [feedbackScenario, setFeedbackScenario] = useState<string | null>(null); const [actual, setActual] = useState(''); const [correction, setCorrection] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/scenarios/status')
      .then((response) => response.ok ? response.json() : null)
      .then((result: unknown) => {
        if (active && typeof result === 'object' && result !== null && 'configured' in result) {
          setGeminiConfigured(result.configured === true);
        }
      })
      .catch(() => { if (active) setGeminiConfigured(false); });
    return () => { active = false; };
  }, []);
  const current = data.scenarios.find((scenario) => scenario.id === selected) ?? data.scenarios[data.scenarios.length - 1];
  const run = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim() || isAnalyzing) return;
    setIsAnalyzing(true); setAnalysisError('');
    try {
      const scenario = await analyzeScenario(question, data);
      update({ ...data, scenarios: [...data.scenarios, scenario] });
      setSelected(scenario.id); setQuestion('');
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Scenario analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  const rerun = async (scenario: Scenario) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true); setAnalysisError('');
    try {
      const refreshed = await analyzeScenario(scenario.question, data, scenario);
      update({ ...data, scenarios: data.scenarios.map((item) => item.id === scenario.id ? refreshed : item) }); setSelected(scenario.id);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Scenario analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  const saveFeedback = (event: FormEvent) => {
    event.preventDefault(); if (!actual.trim() && !correction.trim()) return;
    const feedback: Feedback = { id: id(), scenarioId: feedbackScenario!, actualOutcome: actual.trim(), correction: correction.trim(), createdAt: new Date().toISOString() };
    const value = correction.trim() || actual.trim();
    const prior = data.memories.find((memory) => memory.category === 'feedback');
    const memory: Memory = { id: prior?.id ?? id(), category: 'feedback', label: 'What experience taught me', value, enabled: true };
    update({ ...data, feedback: [...data.feedback, feedback], memories: prior ? data.memories.map((item) => item.id === prior.id ? memory : item) : [...data.memories, memory] });
    setFeedbackScenario(null); setActual(''); setCorrection('');
  };
  return <div>
    <SectionHead index="03" eyebrow="YOUR WHAT-IF GATE" title="Explore two real paths." description="Gemini will analyze your exact question and compare two distinct, practical options using only the context you have allowed." />
    <Dialogue>Tell me the situation as it is. I’ll make the options specific to your question and show where important unknowns remain.</Dialogue>
    <div className={`gemini-status ${geminiConfigured ? 'is-ready' : ''}`} role="status">
      <span className="gemini-status-mark" aria-hidden="true">{geminiConfigured === null ? '…' : geminiConfigured ? '✓' : '!'}</span>
      <div><b>GEMINI SCENARIO ANALYSIS</b><p>{geminiConfigured === null ? 'Checking secure key setup…' : geminiConfigured ? 'API key is stored securely on the server.' : 'Add GEMINI_API_KEY using Replit’s secure Secrets form to enable analysis.'}</p></div>
    </div>
    <form className="scenario-form pixel-panel" onSubmit={run}>
      <label className="field"><span>WHAT IF?</span><textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Include the choice, what matters to you, and any limits or worries…" rows={4} maxLength={2000} required data-testid="input-scenario-question" /><small>{question.length} / 2000 characters. Only details enabled in Privacy settings are sent with this question for analysis.</small></label>
      {analysisError && <p className="analysis-error" role="alert">{analysisError}</p>}
      <div className="scenario-submit"><button className="button button-accent" type="submit" disabled={isAnalyzing} data-testid="button-run-scenario">{isAnalyzing ? 'ANALYZING YOUR WHAT-IF…' : <>SHOW ME TWO PATHS <span>→</span></>}</button><span>Question + enabled context go to Gemini for this analysis.</span></div>
    </form>
    {current && <section className="scenario-result enter-up"><div className="result-heading"><div><div className="eyebrow"><span className="eyebrow-mark">PATHS</span> A POSSIBLE WALK-THROUGH</div><h2>{current.question}</h2></div><div className={`confidence confidence-${current.confidenceLevel.toLowerCase()}`}><span>CONTEXT SIGNAL</span><b>{current.confidenceLevel}</b><small>not a success chance</small></div></div>
      {current.analysisSummary && <p className="analysis-summary">{current.analysisSummary}</p>}
      {current.paths?.length === 2 ? <div className="paths-grid">{current.paths.map((path, index) => <article className={`path-card path-detail-card path-card-${index}`} key={`${current.id}-${index}`}>
        <div className="path-index">PATH {index === 0 ? 'A' : 'B'} <span>{index === 0 ? '◆' : '◇'}</span></div>
        <h3>{path.action}</h3>
        <div className="path-detail"><span>WHAT MAY HAPPEN</span><p>{path.likelyOutcome}</p></div>
        <div className="path-detail"><span>UPSIDE</span><p>{path.upside}</p></div>
        <div className="path-detail"><span>TRADE-OFF</span><p>{path.tradeoff}</p></div>
        <div className="path-first-step"><span>FIRST SMALL STEP</span><p>{path.firstStep}</p></div>
      </article>)}</div> : <div className="paths-grid">{current.alternatives.map((alternative, index) => <article className="path-card" key={`${current.id}-${index}`}><div className="path-index">PATH {index === 0 ? 'A' : 'B'} <span>{index === 0 ? '◆' : '◇'}</span></div><p>{alternative}</p></article>)}</div>}
      {current.paths?.length === 2 && <TradeoffGraph paths={current.paths} />}
      <div className="recommendation pixel-panel"><div className="recommend-icon">→</div><div><div className="card-kicker">YOUR TWIN'S PREFERRED PATH</div><p>{current.recommendedPath}</p>{current.recommendationReason && <span className="recommendation-reason">{current.recommendationReason}</span>}</div></div>
      <details className="working-details"><summary>SHOW THE WORKING <span>+</span></summary><div className="working-body"><h3>Why this fits your context</h3><p>{current.explanation}</p><h3>Assumptions to keep in mind</h3><ul>{current.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul><p className="not-prediction">A possible outcome—not a guaranteed prediction. You know your situation best.</p></div></details>
      <div className="result-actions"><button className="button button-outline" onClick={() => void rerun(current)} disabled={isAnalyzing} data-testid="button-rerun-scenario">{isAnalyzing ? 'UPDATING…' : '↻ RERUN WITH WHAT YOUR TWIN KNOWS NOW'}</button><button className="button button-quiet" onClick={() => { setFeedbackScenario(current.id); document.getElementById('feedback-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>TELL YOUR TWIN HOW IT WENT</button></div>
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
  const [rerunning, setRerunning] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const save = (event: FormEvent) => { event.preventDefault(); const updated: Memory = { id: memory?.id ?? id(), category: 'feedback', label: 'What experience taught me', value: nextValue.trim(), enabled: true }; update({ ...data, memories: [...data.memories.filter((item) => item.category !== 'feedback'), ...(nextValue.trim() ? [updated] : [])] }); setSaved(true); };
  const rerun = async (scenario: Scenario) => {
    if (rerunning) return;
    setRerunning(true); setAnalysisError('');
    try {
      const refreshed = await analyzeScenario(scenario.question, data, scenario);
      update({ ...data, scenarios: data.scenarios.map((item) => item.id === scenario.id ? refreshed : item) });
      setRerunId(scenario.id);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Scenario analysis failed. Please try again.');
    } finally {
      setRerunning(false);
    }
  };
  return <div><SectionHead index="06" eyebrow="EVOLUTION / FIELD NOTES" title="Real life is the best patch note." description="When a what-if meets the real world, tell your twin what it got wrong. A useful correction can change what it recommends next time." />
    <Dialogue>I'm allowed to be wrong. The important bit is whether I remember what you tell me afterward.</Dialogue>
    <div className="evolution-layout"><section className="evolution-card pixel-panel"><div className="card-kicker">YOUR CURRENT CORRECTION</div><h2>What should your twin keep in mind?</h2><p>This one memory can be revised or removed at any time. It only shapes scenarios while the Corrections permission is on.</p><form onSubmit={save}><label className="field"><span>REMEMBER THIS ABOUT MY EXPERIENCE</span><textarea value={nextValue} onChange={(e) => { setNextValue(e.target.value); setSaved(false); }} rows={4} placeholder="For instance: I tend to underestimate the recovery time after a busy week." data-testid="input-evolution-memory" /><small>Feedback from a scenario is also saved here automatically. Edit it in your own words.</small></label><button className="button button-primary" type="submit">SAVE MEMORY CHANGE <span>→</span></button>{saved && <span className="save-confirm" role="status">Saved in your browser. Your next rerun can use this.</span>}</form></section>
      <aside className="evolution-side"><div className="old-new"><span className="card-kicker">MEMORY, MADE VISIBLE</span><div className="memory-change"><small>BEFORE / THIS WAS ON THE MAP</small><p>{memory?.value || 'No correction saved yet.'}</p></div><div className="change-arrow">↓</div><div className="memory-change memory-new"><small>NOW / YOUR TWIN WILL USE</small><p>{nextValue || 'No correction saved yet.'}</p></div></div><div className="feedback-log"><span className="card-kicker">REAL-WORLD NOTES</span>{data.feedback.length ? [...data.feedback].reverse().map((item) => <article key={item.id}><small>{new Date(item.createdAt).toLocaleDateString()}</small><b>{data.scenarios.find((scenario) => scenario.id === item.scenarioId)?.question ?? 'Earlier what-if'}</b><p>{item.actualOutcome || item.correction}</p></article>) : <p className="empty-quiet">No real-world notes yet. Add one from a scenario walk-through.</p>}</div></aside></div>
    <section className="rerun-panel"><div><span className="card-kicker">PUT THE NEW MEMORY TO WORK</span><h2>Revisit an old what-if.</h2><p>Rerun a saved scenario with your current profile and enabled memories.</p></div>{analysisError && <p className="analysis-error" role="alert">{analysisError}</p>}{data.scenarios.length ? <div className="rerun-list">{data.scenarios.slice().reverse().map((scenario) => <div className="rerun-item" key={scenario.id}><span>{scenario.question}</span><button className="button button-outline" onClick={() => void rerun(scenario)} disabled={rerunning} data-testid={`button-evolution-rerun-${scenario.id}`}>{rerunning ? 'ANALYZING…' : rerunId === scenario.id ? 'UPDATED ✓' : 'RERUN →'}</button></div>)}</div> : <div className="quiet-box">You haven't saved a what-if yet. Write one in <Link href="/scenarios">the scenario gate →</Link></div>}</section>
  </div>;
}
function ChatPage({ data, update }: { data: AppData; update: (next: AppData) => void }) {
  const [draft, setDraft] = useState('');
  const [includeMemories, setIncludeMemories] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [error, setError] = useState('');
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/ai/status')
      .then((response) => response.ok ? response.json() : null)
      .then((result: unknown) => {
        if (active && typeof result === 'object' && result !== null && 'configured' in result) {
          setGeminiConfigured(result.configured === true);
        }
      })
      .catch(() => { if (active) setGeminiConfigured(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [data.chat, pendingMessage, isSending]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const prompt = draft.trim();
    if (!prompt || isSending) return;
    setIsSending(true);
    setPendingMessage(prompt);
    setDraft('');
    setError('');

    const messages = [
      ...data.chat.slice(-18).map(({ role, content }) => ({ role, content })),
      { role: 'user' as const, content: prompt },
    ];
    const context = includeMemories
      ? data.memories
          .filter((memory) => memory.enabled && data.permissions[memory.category])
          .slice(0, 16)
          .map(({ category, label, value }) => ({ category, label, value: value.slice(0, 1_000) }))
      : [];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, context }),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'AI chat is temporarily unavailable. Please try again.';
        throw new Error(message);
      }
      if (typeof result !== 'object' || result === null || !('reply' in result) || typeof result.reply !== 'string' || !result.reply.trim()) {
        throw new Error('Gemini returned an empty reply. Please try again.');
      }

      const now = new Date().toISOString();
      const nextMessages: ChatMessage[] = [
        ...data.chat,
        { id: id(), role: 'user' as const, content: prompt, createdAt: now },
        { id: id(), role: 'assistant' as const, content: result.reply.trim(), createdAt: new Date().toISOString() },
      ].slice(-80);
      update({ ...data, chat: nextMessages });
      setPendingMessage('');
    } catch (sendError) {
      setDraft(prompt);
      setPendingMessage('');
      setError(sendError instanceof Error ? sendError.message : 'AI chat failed. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    if (!data.chat.length || isSending) return;
    if (window.confirm('Clear this chat from this browser?')) update({ ...data, chat: [] });
  };
  const enabledMemoryCount = data.memories.filter((memory) => memory.enabled && data.permissions[memory.category]).length;

  return <div className="chat-page">
    <SectionHead index="05" eyebrow="OPEN CHAT" title="Ask about anything." description="A general-purpose AI sidekick for questions, ideas, explanations, and plans. It only responds when you message it." />
    <div className={`gemini-status ${geminiConfigured ? 'is-ready' : ''}`} role="status">
      <span className="gemini-status-mark">{geminiConfigured ? '✓' : geminiConfigured === false ? '!' : '…'}</span>
      <div>
        <b>{geminiConfigured ? 'GEMINI READY' : geminiConfigured === false ? 'ADD YOUR GEMINI KEY' : 'CHECKING GEMINI'}</b>
        <p>{geminiConfigured
          ? 'Your key is stored as a Replit Secret and used by the app server only.'
          : geminiConfigured === false
            ? 'Add GEMINI_API_KEY through Replit’s secure Secrets form to enable chat.'
            : 'Checking whether a Gemini key is available.'}</p>
      </div>
    </div>
    <section className="chat-card pixel-panel" aria-label="AI conversation">
      <div className="chat-toolbar">
        <div><span className="card-kicker">YOUR CONVERSATION</span><small>Saved only in this browser</small></div>
        <button className="close-text" type="button" onClick={clearChat} disabled={!data.chat.length || isSending}>CLEAR CHAT ×</button>
      </div>
      <div className="chat-transcript" ref={transcriptRef} role="log" aria-live="polite" aria-relevant="additions text">
        {!data.chat.length && !pendingMessage && <div className="chat-empty">
          <PixelVillager small />
          <h2>What’s on your mind?</h2>
          <p>Ask for an explanation, brainstorm an idea, work through a problem, or get help making a plan.</p>
          <div className="chat-starters">
            {['Explain a tricky idea in plain language', 'Help me plan a manageable week', 'Brainstorm a few fresh ideas'].map((suggestion) =>
              <button key={suggestion} type="button" onClick={() => setDraft(suggestion)} disabled={isSending}>{suggestion} <span>→</span></button>,
            )}
          </div>
        </div>}
        {data.chat.map((message) => <article key={message.id} className={`chat-message chat-message-${message.role}`}>
          <span>{message.role === 'assistant' ? 'ALTER EGO' : 'YOU'}</span>
          <p>{message.content}</p>
        </article>)}
        {pendingMessage && <article className="chat-message chat-message-user"><span>YOU</span><p>{pendingMessage}</p></article>}
        {isSending && <div className="chat-thinking" role="status"><span className="thinking-pixels"><i /><i /><i /></span> THINKING…</div>}
      </div>
      {error && <p className="analysis-error" role="alert">{error}</p>}
      <form className="chat-composer" onSubmit={(event) => void send(event)}>
        <label className="chat-input-label" htmlFor="chat-message">YOUR MESSAGE</label>
        <textarea id="chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={6_000} rows={3} placeholder="Ask a question or describe what you want help with…" disabled={isSending} />
        <div className="chat-compose-bottom">
          <label className="chat-memory-option">
            <input type="checkbox" checked={includeMemories} onChange={(event) => setIncludeMemories(event.target.checked)} disabled={isSending || enabledMemoryCount === 0} />
            <span>Personalize with my enabled details <small>{enabledMemoryCount ? `${enabledMemoryCount} available · only sent when selected` : 'No enabled details to share'}</small></span>
          </label>
          <button className="button button-primary" type="submit" disabled={!draft.trim() || isSending} data-testid="button-send-chat">
            {isSending ? 'THINKING…' : 'SEND'} <span>→</span>
          </button>
        </div>
        <p className="chat-disclosure">Your message goes to Google Gemini through the app server. Recent chat turns are sent for context; saved profile details are sent only when you check the option above.</p>
      </form>
    </section>
  </div>;
}

function PrivacyPage({ data, update, reset }: { data: AppData; update: (next: AppData) => void; reset: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null); const [draft, setDraft] = useState(''); const [confirm, setConfirm] = useState(false);
  const togglePermission = (category: Category, enabled: boolean) => update({ ...data, permissions: { ...data.permissions, [category]: enabled } });
  const removeMemory = (memory: Memory) => { if (window.confirm(`Delete the remembered detail “${memory.label}”?`)) update({ ...data, memories: data.memories.filter((item) => item.id !== memory.id) }); };
  const saveMemory = (memory: Memory) => { update({ ...data, memories: data.memories.map((item) => item.id === memory.id ? { ...item, value: draft } : item) }); setEditingId(null); };
  return <div><SectionHead index="07" eyebrow="PRIVACY & CONTROL" title="Your save stays on this device." description="Your profile and history live in this browser. Gemini receives a request only when you choose to use an AI feature." />
    <Dialogue>You're the gatekeeper. Turn a category off to keep it out of scenario suggestions, edit a memory to correct it, or clear the whole save file.</Dialogue>
    <div className="privacy-notice pixel-panel"><div className="notice-lock">LOCAL<br />SAVE</div><div><span className="card-kicker">LOCAL DATA + GEMINI</span><p>Your profile, quest log, scenarios, chat history, feedback, and memories stay in this browser. When you use AI chat, recent chat turns are sent through the app server to Google Gemini; saved profile details are included only if you select that option. Scenario requests send the question and enabled memories. Your Gemini API key stays in Replit Secrets and is never sent to the browser. Clear the chat or your local save whenever you want.</p><Link href="/twin">Review your profile →</Link></div></div>
    <section className="permission-section"><div className="privacy-heading"><div><span className="card-kicker">CATEGORY PERMISSIONS</span><h2>What may your twin use?</h2></div><span className="permission-count">{Object.values(data.permissions).filter(Boolean).length} / {categories.length} ON</span></div>{categories.map((category) => <label key={category.key} className="permission-row"><div><b>{category.label}</b><small>{category.hint}</small></div><input type="checkbox" checked={data.permissions[category.key]} onChange={(e) => togglePermission(category.key, e.target.checked)} data-testid={`toggle-permission-${category.key}`} /><span className="toggle-track" aria-hidden="true"><i /></span></label>)}</section>
    <section className="memory-section"><div className="privacy-heading"><div><span className="card-kicker">MEMORY CABINET</span><h2>Look at what's remembered.</h2></div><span className="permission-count">{data.memories.length} DETAILS</span></div>{data.memories.length ? <div className="memory-list">{data.memories.map((memory) => <article key={memory.id} className={`memory-row ${!memory.enabled || !data.permissions[memory.category] ? 'memory-paused' : ''}`}><div className="memory-indicator">{memory.enabled && data.permissions[memory.category] ? 'IN USE' : 'PAUSED'}</div><div className="memory-content"><span>{memory.label} <small>· {categories.find((category) => category.key === memory.category)?.label}</small></span>{editingId === memory.id ? <div className="memory-edit"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} data-testid={`input-memory-${memory.id}`} /><button onClick={() => saveMemory(memory)}>SAVE</button><button onClick={() => setEditingId(null)}>CANCEL</button></div> : <p>{memory.value}</p>}</div><div className="memory-actions">{editingId !== memory.id && <><button onClick={() => { setEditingId(memory.id); setDraft(memory.value); }} data-testid={`button-edit-memory-${memory.id}`}>EDIT</button><button onClick={() => removeMemory(memory)} data-testid={`button-delete-memory-${memory.id}`}>DELETE</button><button onClick={() => update({ ...data, memories: data.memories.map((item) => item.id === memory.id ? { ...item, enabled: !item.enabled } : item) })}>{memory.enabled ? 'PAUSE' : 'USE'}</button></>}</div></article>)}</div> : <div className="quiet-box">No stored memories yet. Memories come from the profile details you share and corrections you choose to keep.</div>}</section>
    <section className="reset-zone"><div><span className="card-kicker">START OVER</span><h2>Clear your local save.</h2><p>This removes your profile, quests, scenarios, chat history, feedback, memories, and permissions from this browser. This cannot be undone.</p></div>{confirm ? <div className="confirm-reset"><b>Clear everything from this browser?</b><button className="button button-danger" onClick={reset} data-testid="button-confirm-reset">YES, CLEAR THE SAVE</button><button className="button button-quiet" onClick={() => setConfirm(false)}>KEEP MY SAVE</button></div> : <button className="button button-danger-outline" onClick={() => setConfirm(true)} data-testid="button-reset-data">CLEAR ALL LOCAL DATA</button>}</section>
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
    <Route path="/chat"><ChatPage data={data} update={update} /></Route>
    <Route path="/evolution"><EvolutionPage data={data} update={update} /></Route>
    <Route path="/privacy"><PrivacyPage data={data} update={update} reset={reset} /></Route>
    <Route component={NotFoundPage} />
  </Switch></Shell>;
}
export default App;