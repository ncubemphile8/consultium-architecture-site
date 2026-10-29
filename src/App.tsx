import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type CameraPose = { position: [number, number, number]; target: [number, number, number] };
type SketchfabApi = {
  start: () => void;
  addEventListener: (event: string, callback: (...args: any[]) => void) => void;
  getCameraLookAt: (callback: (error: unknown, camera: CameraPose | null) => void) => void;
  setCameraLookAt: (position: [number, number, number], target: [number, number, number], duration?: number, callback?: (error: unknown) => void) => void;
  setCameraEasing: (easing: string) => void;
  setUserInteraction: (enabled: boolean, callback?: (error: unknown) => void) => void;
  recenterCamera: (callback?: (error: unknown) => void) => void;
};
declare global {
  interface Window {
    Sketchfab?: new (iframe: HTMLIFrameElement) => {
      init: (uid: string, options: {
        autostart: number;
        camera: number;
        success: (api: SketchfabApi) => void;
        error: (error: unknown) => void;
      }) => void;
    };
  }
}
type Room = { id: string; label: string; note: string; position: [number, number, number]; target: [number, number, number] };
const rooms: Room[] = [
  { id: 'living', label: 'Living space', note: 'A closer look at the villa’s open living area and its connection to the landscape.', position: [-4, 53, -28], target: [-19, 45, -47] },
  { id: 'kitchen', label: 'Kitchen', note: 'Move towards the kitchen zone and its material details.', position: [-39, 53, -53], target: [-54, 45, -71] },
  { id: 'terrace', label: 'Terrace', note: 'Explore the outdoor dining and terrace setting.', position: [-5, 52, -97], target: [-29, 43, -78] },
  { id: 'stairs', label: 'Staircase', note: 'Focus on the stair and the vertical connection between spaces.', position: [22, 58, -3], target: [10, 50, -15] },
];

function HouseExperience() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const apiRef = useRef<SketchfabApi | null>(null);
  const homePoseRef = useRef<CameraPose | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Room | null>(null);

  useEffect(() => {
    let cancelled = false;
    let script = document.querySelector<HTMLScriptElement>('script[data-consultium-sketchfab="true"]');
    const initialize = () => {
      if (cancelled || !iframeRef.current || !window.Sketchfab) {
        if (!cancelled && !window.Sketchfab) setLoadError(true);
        return;
      }
      const client = new window.Sketchfab(iframeRef.current);
      client.init('7aa1124e2f0a4013a16f61404deb8259', {
        autostart: 1,
        camera: 0,
        success: (api) => {
          if (cancelled) return;
          apiRef.current = api;
          api.setCameraEasing('easeInOutCubic');
          api.start();
          api.addEventListener('viewerready', () => {
            if (cancelled) return;
            api.getCameraLookAt((error, camera) => {
              if (!error && camera) homePoseRef.current = camera;
              setReady(true);
            });
          });
        },
        error: () => { if (!cancelled) setLoadError(true); },
      });
    };
    if (window.Sketchfab) initialize();
    else {
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
        script.async = true;
        script.dataset.consultiumSketchfab = 'true';
        script.onerror = () => { if (!cancelled) setLoadError(true); };
        document.head.appendChild(script);
      }
      script.addEventListener('load', initialize, { once: true });
    }
    return () => { cancelled = true; };
  }, []);

  const returnOutside = () => {
    const api = apiRef.current;
    const home = homePoseRef.current;
    setSelected(null);
    if (!api) return;
    if (home) api.setCameraLookAt(home.position, home.target, 2.2);
    else api.recenterCamera();
  };
  const explore = (room: Room) => {
    setSelected(room);
    apiRef.current?.setCameraLookAt(room.position, room.target, 2.8);
  };

  return <div className="house-stage">
    <div className="viewer-frame">
      <iframe
        ref={iframeRef}
        title="Interactive Modern Coastal Hillside Villa by Visthétique"
        allow="autoplay; fullscreen; xr-spatial-tracking; clipboard-write"
        allowFullScreen
        src="about:blank"
      />
      {!ready && !loadError && <div className="viewer-loading"><span className="loading-mark" />Loading the interactive villa…</div>}
      {loadError && <div className="viewer-error">The 3D viewer could not load. <a href="https://sketchfab.com/3d-models/modern-coastal-hillside-villa-7aa1124e2f0a4013a16f61404deb8259" target="_blank" rel="noreferrer">Open the villa on Sketchfab ↗</a></div>}
      <div className="stage-hint"><span className="hint-dot" /> Drag to orbit · use the room controls below</div>
      <div className="model-caption"><span>01 / MODERN COASTAL HILLSIDE VILLA</span><span>INTERACTIVE 3D</span></div>
    </div>
    <div className="room-controls" aria-label="Explore areas of the villa">
      <button className={!selected ? 'room-control active' : 'room-control'} onClick={returnOutside}><span>00</span> Exterior <i>↗</i></button>
      {rooms.map((room, index) => <button key={room.id} className={selected?.id === room.id ? 'room-control active' : 'room-control'} onClick={() => explore(room)}><span>{String(index + 1).padStart(2, '0')}</span>{room.label}<i>↗</i></button>)}
    </div>
    <AnimatePresence>
      {selected && <motion.div className="room-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
        <button className="room-close" onClick={() => setSelected(null)} aria-label="Close room details">×</button>
        <p className="eyebrow">EXPLORE THE DESIGN</p><h3>{selected.label}</h3><p>{selected.note}</p>
        <button className="text-link" onClick={() => { setSelected(null); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Plan a space like this ↗</button>
      </motion.div>}
    </AnimatePresence>
    <p className="model-credit">3D model: <a href="https://sketchfab.com/3d-models/modern-coastal-hillside-villa-7aa1124e2f0a4013a16f61404deb8259" target="_blank" rel="noreferrer">“Modern Coastal Hillside Villa”</a> by <a href="https://sketchfab.com/visthetique" target="_blank" rel="noreferrer">Visthétique</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</p>
  </div>;
}

const projects = [
  { number: '01', name: 'The Ridge House', type: 'Residential · Concept study', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85', size: 'large' },
  { number: '02', name: 'Courtyard Living', type: 'Residential · Spatial design', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85', size: 'small' },
  { number: '03', name: 'Lines of Living', type: 'Architecture · Plan study', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=85', size: 'small' },
];
const services = [
  ['01', 'Architecture & planning', 'From the first sketch to a considered, buildable design.'],
  ['02', 'Interior architecture', 'Material, light and movement shaped into a coherent whole.'],
  ['03', 'Project coordination', 'Clear decisions, thoughtful collaboration and practical delivery.'],
  ['04', 'Feasibility & consultation', 'Early-stage guidance to help your project move forward.'],
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [budget, setBudget] = useState('100,000–250,000');
  const [projectType, setProjectType] = useState('New home');
  const [submitted, setSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', details: '' });
  const submit = (event: React.FormEvent) => { event.preventDefault(); setSubmitted(true); };
  const mailBody = encodeURIComponent('Hello Consultium,\n\nI would like to discuss a project.\nProject type: ' + projectType + '\nIndicative budget: ' + budget + '\nName: ' + contactForm.name + '\nEmail: ' + contactForm.email + '\nProject details: ' + contactForm.details);
  return <main>
    <header className="topbar">
      <a href="#top" className="wordmark" aria-label="Consultium home"><span className="brand-main">CONSULTIUM</span><span className="brand-blocks" aria-hidden="true"><i></i><i></i><i></i><i></i></span><small>ARCHITECTS &amp; URBAN DESIGNERS</small></a>
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
        <a href="#work" onClick={() => setMenuOpen(false)}>Selected work</a><a href="#approach" onClick={() => setMenuOpen(false)}>Approach</a><a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
        <a className="nav-contact" href="#contact" onClick={() => setMenuOpen(false)}>Start a project <span>↗</span></a>
      </nav>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? 'CLOSE' : 'MENU'} <span>{menuOpen ? '−' : '+'}</span></button>
    </header>
    <section className="hero" id="top">
      <div className="hero-copy"><p className="eyebrow"><span className="tiny-line" /> ARCHITECTURE WITH INTENTION</p>
        <h1>Spaces that<br /><em>move you.</em></h1>
        <p className="hero-description">Thoughtful architecture for the way we live, work and connect. Designed with purpose. Made to last.</p>
        <div className="hero-actions"><a className="button button-dark" href="#work">Explore our work <span>↘</span></a><a className="quiet-link" href="#approach">Our approach <span>↗</span></a></div>
      </div>
      <div className="hero-visual">
        <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=90" alt="Contemporary architecture with warm natural materials" />
        <div className="hero-image-overlay"></div><div className="hero-image-note"><span>FIG. 01</span><span>FORM · LIGHT · LANDSCAPE</span></div>
        <div className="hero-index">01 <i /> 04</div>
      </div>
      <div className="hero-bottom"><span>INDEPENDENT ARCHITECTURE & DESIGN</span><span>DESIGNING FOR THE LONG VIEW ↓</span></div>
    </section>
    <section className="intro section-pad" id="approach">
      <div className="section-label"><span>01 / OUR APPROACH</span><span>LESS, BUT BETTER.</span></div>
      <div className="intro-grid"><h2>Good architecture<br />does more with <em>less.</em></h2><div className="intro-text"><p>We believe the best spaces feel inevitable — shaped by their setting, attentive to the people who use them, and refined until every decision has a reason.</p><p>Our process brings together practical thinking and creative exploration to make architecture that feels quietly distinctive.</p><a className="text-link" href="#services">What we bring to a project ↗</a></div></div>
      <div className="principles"><div><span>01</span><h3>Context first</h3><p>Every site has a story. We begin by listening to it.</p></div><div><span>02</span><h3>Human by design</h3><p>Spaces are made for people, not just photographs.</p></div><div><span>03</span><h3>Built to endure</h3><p>Honest materials and decisions that age gracefully.</p></div></div>
    </section>
    <section className="experience section-pad" id="experience">
      <div className="section-label light-label"><span>02 / SPATIAL EXPERIENCE</span><span>EXPLORE A CONCEPT</span></div>
      <div className="experience-heading"><div><p className="eyebrow">DESIGN, IN THREE DIMENSIONS</p><h2>Step inside<br /><em>the possibilities.</em></h2></div><p>Rotate the concept villa, explore the markers, and imagine what your own space could become.</p></div>
      <HouseExperience />
      <p className="model-disclaimer">Demonstration model · Final interactive rooms depend on the supplied 3D asset and its licence.</p>
    </section>
    <section className="work section-pad" id="work">
      <div className="section-label"><span>03 / SELECTED WORK</span><span>IDEAS MADE TANGIBLE</span></div>
      <div className="work-heading"><h2>Considered from<br /><em>every angle.</em></h2><p>A selection of concept studies illustrating our design language. Demonstration projects are shown until approved Consultium project materials are supplied.</p></div>
      <div className="project-grid">{projects.map(p => <a href="#contact" className={'project-card ' + p.size} key={p.number}><div className="project-image"><img src={p.image} alt={p.name + ' architectural concept'} loading="lazy" /><span className="project-arrow">↗</span><span className="project-number">{p.number}</span></div><div className="project-meta"><div><h3>{p.name}</h3><p>{p.type}</p></div><span>VIEW PROJECT ↗</span></div></a>)}</div>
      <div className="work-foot"><span>CONCEPT PROJECTS · NOT CLIENT ATTRIBUTIONS</span><a className="text-link" href="#contact">Discuss a project ↗</a></div>
    </section>
    <section className="manifesto">
      <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=85" alt="Minimal modern house opening to a garden" loading="lazy" />
      <div className="manifesto-shade"></div><div className="manifesto-copy"><p className="eyebrow">A THOUGHTFUL WAY FORWARD</p><h2>Make room for<br /><em>what matters.</em></h2><a className="button button-light" href="#contact">Let's talk about your project <span>↗</span></a></div><span className="manifesto-caption">SPACE TO THINK. ROOM TO LIVE.</span>
    </section>
    <section className="services section-pad" id="services">
      <div className="section-label"><span>04 / WHAT WE DO</span><span>FROM IDEA TO DETAIL</span></div>
      <div className="services-layout"><div><p className="eyebrow">OUR SERVICES</p><h2>Good thinking.<br /><em>Clear outcomes.</em></h2><p className="services-intro">Every project is different. We shape the right process around your site, brief, priorities and ambition.</p><a className="text-link" href="#contact">Tell us what you're planning ↗</a></div>
      <div className="service-list">{services.map(([num,title,desc]) => <div className="service-row" key={num}><span>{num}</span><div><h3>{title}</h3><p>{desc}</p></div><span className="service-plus">↗</span></div>)}</div></div>
    </section>
    <section className="planner section-pad">
      <div className="section-label light-label"><span>05 / PROJECT STARTER</span><span>A CLEAR FIRST STEP</span></div>
      <div className="planner-grid"><div><p className="eyebrow">PROJECT PLANNING ASSISTANT</p><h2>Start with<br /><em>the essentials.</em></h2><p>Share a few early details to shape a useful first conversation. This is a planning prompt, not a formal quote.</p></div>
      <form className="planner-form" onSubmit={submit}><label>What are you planning?<select value={projectType} onChange={e=>setProjectType(e.target.value)}><option>New home</option><option>Renovation or extension</option><option>Commercial space</option><option>Interior design</option><option>Feasibility consultation</option></select></label><label>Indicative project budget<select value={budget} onChange={e=>setBudget(e.target.value)}><option>Under 50,000</option><option>50,000–100,000</option><option>100,000–250,000</option><option>250,000–500,000</option><option>500,000+</option><option>Still exploring</option></select></label><div className="planner-summary"><span>YOUR STARTING POINT</span><p>{projectType} <i>·</i> {budget}</p><small>We'll use this context to make your enquiry more useful.</small></div><a className="button button-light" href="#contact" onClick={()=>setSubmitted(false)}>Continue to enquiry <span>↘</span></a></form></div>
    </section>
    <section className="contact section-pad" id="contact"><div className="section-label"><span>06 / START A CONVERSATION</span><span>YOUR PROJECT STARTS HERE</span></div><div className="contact-grid"><div><p className="eyebrow">HAVE SOMETHING IN MIND?</p><h2>Let's make<br /><em>space for it.</em></h2><p className="contact-copy">Tell us a little about your idea. We'll help you work out a thoughtful next step.</p><div className="contact-aside"><span>CONSULTIUM</span><span>Architecture · Spatial design</span><span>Contact details to be confirmed by the studio.</span></div></div>
      <form className="contact-form" onSubmit={submit}><label>Your name<input required value={contactForm.name} onChange={e=>setContactForm({...contactForm,name:e.target.value})} placeholder="Name" /></label><label>Email address<input type="email" required value={contactForm.email} onChange={e=>setContactForm({...contactForm,email:e.target.value})} placeholder="you@example.com" /></label><label>Tell us about the project<textarea rows={4} value={contactForm.details} onChange={e=>setContactForm({...contactForm,details:e.target.value})} placeholder="Site, ideas, timeline, questions..." /></label><button className="button button-dark" type="submit">Prepare enquiry <span>↗</span></button>{submitted && <div className="form-success">Your enquiry is ready. <a href={'mailto:?subject='+encodeURIComponent('Consultium project enquiry')+'&body='+mailBody}>Open in your email app ↗</a><p>We haven't sent anything automatically; your email app will let you review and send it.</p></div>}</form></div></section>
    <footer className="footer"><a href="#top" className="wordmark" aria-label="Consultium home"><span className="brand-main">CONSULTIUM</span><span className="brand-blocks" aria-hidden="true"><i></i><i></i><i></i><i></i></span><small>ARCHITECTS &amp; URBAN DESIGNERS</small></a><p>Thoughtful spaces. Lasting impact.</p><div><a href="#work">Work</a><a href="#services">Services</a><a href="#contact">Contact</a></div><span>© {new Date().getFullYear()} CONSULTIUM · CONCEPT WEBSITE</span></footer>
  </main>;
}
