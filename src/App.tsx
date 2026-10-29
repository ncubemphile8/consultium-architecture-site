import { useMemo, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Html, useGLTF, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';

type Room = { id: string; label: string; note: string; position: [number, number, number] };
const rooms: Room[] = [
  { id: 'living', label: 'Living spaces', note: 'Open, light-filled spaces designed around everyday life.', position: [-1.4, 1.1, 0.8] },
  { id: 'kitchen', label: 'Kitchen', note: 'A calm material palette, generous light and thoughtful flow.', position: [1.1, 1, 0.5] },
  { id: 'terrace', label: 'Terrace', note: 'Architecture that opens naturally to its landscape.', position: [0.2, 0.8, 2] },
];

function VillaModel() {
  const { scene } = useGLTF('/models/villa.gltf');
  const clone = useMemo(() => {
    const object = scene.clone(true);
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return object;
  }, [scene]);
  return <primitive object={clone} position={[0, -0.7, 0]} scale={1.15} />;
}

function ModelFallback() {
  return <group position={[0, -0.4, 0]}>
    <mesh castShadow position={[0, 0.5, 0]}><boxGeometry args={[3.6, 1.2, 2.4]} /><meshStandardMaterial color="#d8d2c5" roughness={0.72} /></mesh>
    <mesh castShadow position={[0, 1.35, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[2.35, 1.15, 4]} /><meshStandardMaterial color="#5b6259" roughness={0.8} /></mesh>
    <mesh position={[0, 0.5, 1.21]}><boxGeometry args={[1.3, 0.85, 0.04]} /><meshStandardMaterial color="#34464b" metalness={0.15} roughness={0.2} /></mesh>
    <mesh position={[-0.85, 0.5, 1.22]}><boxGeometry args={[0.45, 0.85, 0.04]} /><meshStandardMaterial color="#34464b" roughness={0.2} /></mesh>
    <mesh position={[0.95, 0.5, 1.22]}><boxGeometry args={[0.45, 0.85, 0.04]} /><meshStandardMaterial color="#34464b" roughness={0.2} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow><planeGeometry args={[12, 9]} /><meshStandardMaterial color="#b6b2a7" roughness={1} /></mesh>
  </group>;
}

function Hotspot({ room, onSelect }: { room: Room; onSelect: (room: Room) => void }) {
  return <Html position={room.position} center distanceFactor={8}>
    <button className="hotspot" onClick={(event) => { event.stopPropagation(); onSelect(room); }} aria-label={'Explore ' + room.label}><span />{room.label}</button>
  </Html>;
}

function HouseExperience() {
  const [selected, setSelected] = useState<Room | null>(null);
  const [modelFailed, setModelFailed] = useState(true);
  return <div className="house-stage">
    <Canvas shadows camera={{ position: [5.2, 3.2, 6.5], fov: 40 }} dpr={[1, 1.6]}>
      <color attach="background" args={['#d8d7ce']} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 8, 5]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        {!modelFailed ? <ModelErrorBoundary onFail={() => setModelFailed(true)}><VillaModel /></ModelErrorBoundary> : <ModelFallback />}
        <Environment preset="city" />
        <ContactShadows position={[0, -0.18, 0]} opacity={0.35} scale={12} blur={2.5} far={4} />
        {rooms.map(room => <Hotspot key={room.id} room={room} onSelect={setSelected} />)}
      </Suspense>
      <OrbitControls makeDefault enablePan={false} minDistance={4} maxDistance={11} minPolarAngle={0.45} maxPolarAngle={Math.PI / 2.05} />
    </Canvas>
    <div className="stage-hint"><span className="hint-dot" /> Drag to explore · Select a marker</div>
    <AnimatePresence>
      {selected && <motion.div className="room-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }}>
        <button className="room-close" onClick={() => setSelected(null)} aria-label="Close room details">×</button>
        <p className="eyebrow">EXPLORE THE DESIGN</p><h3>{selected.label}</h3><p>{selected.note}</p>
        <button className="text-link" onClick={() => { setSelected(null); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}>Plan a space like this ↗</button>
      </motion.div>}
    </AnimatePresence>
    <div className="model-caption"><span>01 / CONCEPT VILLA</span><span>INTERACTIVE STUDY</span></div>
  </div>;
}

function ModelErrorBoundary({ children, onFail }: { children: React.ReactNode; onFail: () => void }) {
  // The public model file is added after the downloaded asset is checked.
  // Until then, the scene can be switched to the built-in demonstration villa.
  try { return <Suspense fallback={null}>{children}</Suspense>; } catch { onFail(); return <ModelFallback />; }
}

const projects = [
  { number: '01', name: 'The Ridge House', type: 'Residential · Concept study', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85', size: 'large' },
  { number: '02', name: 'Courtyard Living', type: 'Residential · Spatial design', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85', size: 'small' },
  { number: '03', name: 'Quiet Geometry', type: 'Interiors · Material study', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=85', size: 'small' },
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
      <a href="#top" className="wordmark" aria-label="Consultium home">CONSULTIUM<span>®</span><small>ARCHITECTURE · SPATIAL DESIGN</small></a>
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
    <footer className="footer"><a href="#top" className="wordmark">CONSULTIUM<span>®</span><small>ARCHITECTURE · SPATIAL DESIGN</small></a><p>Thoughtful spaces. Lasting impact.</p><div><a href="#work">Work</a><a href="#services">Services</a><a href="#contact">Contact</a></div><span>© {new Date().getFullYear()} CONSULTIUM · CONCEPT WEBSITE</span></footer>
  </main>;
}
