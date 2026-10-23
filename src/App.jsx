import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Droplets, UserRound, MapPin, CalendarDays, Clock3, IndianRupee,
  CreditCard, CheckCircle2, Sparkles, GlassWater, RefreshCw,
  ArrowRight, Zap, AlertCircle, ArrowLeft
} from 'lucide-react';

const RATE_PER_LITER = 20; // Change this value to update the price per liter.
const PRESETS = [5, 10, 15, 20];
const PAYMENTS = [
  { name: 'UPI / QR', icon: Zap },
  { name: 'Cash', icon: IndianRupee },
  { name: 'Card', icon: CreditCard }
];
const money = n => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);

/* 3D tilt card: follows the pointer */
function Tilt({ children, className = '' }) {
  const ref = useRef(null);
  const move = e => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${x * 7}deg`);
    el.style.setProperty('--rx', `${-y * 7}deg`);
  };
  const leave = () => {
    const el = ref.current; if (!el) return;
    el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg');
  };
  return <div ref={ref} className={`card3d ${className}`} onPointerMove={move} onPointerLeave={leave}>{children}</div>;
}

export default function App() {
  const [customer, setCustomer] = useState({ name: '', address: '', date: today(), time: '10:00' });
  const [quantityMode, setQuantityMode] = useState('preset');
  const [preset, setPreset] = useState(10);
  const [customLiters, setCustomLiters] = useState('');
  const [step, setStep] = useState('details');
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR');
  const [order, setOrder] = useState(null);
  const [filled, setFilled] = useState(false);
  const [fillProgress, setFillProgress] = useState(0);
  const [error, setError] = useState('');
  const [serviceFee, setServiceFee] = useState(''); // optional
  const [paying, setPaying] = useState(false);
  const payTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(payTimer.current), []);

  const liters = quantityMode === 'custom' ? Number(customLiters) : preset;
  const waterAmount = useMemo(() => Math.max(0, liters || 0) * RATE_PER_LITER, [liters]);
  const fee = serviceFee === '' ? 0 : Number(serviceFee);
  const feeValid = Number.isFinite(fee) && fee >= 0 && fee <= 5000;
  const total = waterAmount + (feeValid ? fee : 0);
  const validLiters = Number.isFinite(liters) && liters > 0 && liters <= 500;
  const canProceed = customer.name.trim() && customer.address.trim() && customer.date && customer.time && validLiters && feeValid;

  useEffect(() => {
    if (step !== 'dispensing' || filled) return;
    let current = 0;
    const timer = window.setInterval(() => {
      current = Math.min(100, current + 2.5);
      setFillProgress(current);
      if (current >= 100) { setFilled(true); window.clearInterval(timer); }
    }, 90);
    return () => window.clearInterval(timer);
  }, [step, filled]);

  const upd = (f, v) => { setCustomer(p => ({ ...p, [f]: v })); setError(''); };
  function startPayment(e) {
    e.preventDefault();
    if (!canProceed) { setError(!feeValid ? 'Service fee must be between ₹0 and ₹5,000.' : 'Fill all details and choose 0.1 – 500 liters.'); return; }
    setOrder({ ...customer, liters, waterAmount, fee, total, paymentMethod, id: `PF-${Date.now().toString().slice(-6)}` });
    setStep('payment'); setError('');
  }
  function confirmPayment() {
    if (paying) return;
    setPaying(true); // generate payment (demo)
    payTimer.current = window.setTimeout(() => {
      const paymentId = `TXN${Math.floor(100000 + Math.random() * 900000)}`;
      setOrder(o => ({ ...o, paymentMethod, paymentId }));
      setPaying(false); setFillProgress(0); setFilled(false); setStep('dispensing');
    }, 1300);
  }
  function reset() {
    setCustomer({ name: '', address: '', date: today(), time: '10:00' });
    setQuantityMode('preset'); setPreset(10); setCustomLiters(''); setServiceFee(''); setPaying(false);
    setStep('details'); setOrder(null); setFilled(false); setFillProgress(0); setError('');
  }

  const heads = {
    details: ['Book Your Refill', 'Pure water. Pay only per liter.'],
    payment: ['Review & Pay', order ? `Order ${order.id} · confirm to start` : ''],
    dispensing: ['Filling Your Water', filled ? 'Your container is full and ready.' : 'Sit back, it fills automatically.'],
    complete: ['All Filled Up!', order ? `Thanks ${order.name.split(' ')[0]}, stay refreshed.` : '']
  };
  const stepNo = { details: 1, payment: 2, dispensing: 3, complete: 4 }[step];

  const streaming = fillProgress > 0 && !filled;
  const canW = order ? Math.min(66, 48 + order.liters * 0.9) : 56;
  const canH = order ? Math.min(92, 66 + order.liters * 1.2) : 76;

  return (
    <main className="app">
      {/* animated 3D background */}
      <div className="bg" aria-hidden="true">
        <i className="blob b1" /><i className="blob b2" /><i className="blob b3" />
        {Array.from({ length: 9 }).map((_, i) => <i key={i} className={`bub bub${i}`} />)}
      </div>

      <header className="head">
        <div className="brand"><span className="drop3d"><i /></span><b>pureflow</b></div>
        <div className="dots" aria-label={`Step ${stepNo} of 4`}>
          {[1, 2, 3, 4].map(n => <span key={n} className={n === stepNo ? 'on' : n < stepNo ? 'done' : ''} />)}
        </div>
        <h1 key={step}>{heads[step][0]}</h1>
        <p key={step + 's'}>{heads[step][1]}</p>
      </header>

      {step === 'details' && (
        <Tilt>
          <form className="form" onSubmit={startPayment}>
            <div className="grid2">
              <label className="fld"><span>Name</span><div className="inp c1"><UserRound size={15} /><input value={customer.name} onChange={e => upd('name', e.target.value)} placeholder="Full name" autoComplete="name" required /></div></label>
              <label className="fld"><span>Address</span><div className="inp c2"><MapPin size={15} /><input value={customer.address} onChange={e => upd('address', e.target.value)} placeholder="House / area" required /></div></label>
              <label className="fld"><span>Date</span><div className="inp c3"><CalendarDays size={15} /><input type="date" value={customer.date} onChange={e => upd('date', e.target.value)} required /></div></label>
              <label className="fld"><span>Time</span><div className="inp c4"><Clock3 size={15} /><input type="time" value={customer.time} onChange={e => upd('time', e.target.value)} required /></div></label>
            </div>

            <div className="lbl">Choose liters</div>
            <div className="chips">
              {PRESETS.map((n, i) => (
                <button type="button" key={n} className={`chip k${i} ${quantityMode === 'preset' && preset === n ? 'sel' : ''}`}
                  onClick={() => { setQuantityMode('preset'); setPreset(n); setError(''); }}>
                  <span className="mc"><u style={{ height: `${40 + n * 2.5}%` }} /></span><b>{n} L</b>
                </button>
              ))}
              <button type="button" className={`chip k4 ${quantityMode === 'custom' ? 'sel' : ''}`} onClick={() => { setQuantityMode('custom'); setError(''); }}>
                <span className="mc cu"><GlassWater size={14} /></span><b>Custom</b>
              </button>
            </div>
            {quantityMode === 'custom' && (
              <div className="inp c5 customrow"><GlassWater size={15} />
                <input type="number" min="0.1" max="500" step="0.1" value={customLiters} onChange={e => setCustomLiters(e.target.value)} placeholder="Enter liters (0.1 – 500)" autoFocus /><em>L</em>
              </div>
            )}

            <div className="grid2">
              <label className="fld"><span>Service fee <small>(optional)</small></span><div className="inp c6"><IndianRupee size={15} /><input type="number" min="0" max="5000" step="1" value={serviceFee} onChange={e => { setServiceFee(e.target.value); setError(''); }} placeholder="0" /></div></label>
              <div className="fld"><span>Total · ₹{RATE_PER_LITER}/L</span><div className="total mini"><strong>{money(total)}</strong></div></div>
            </div>
            {error && <div className="err"><AlertCircle size={14} />{error}</div>}
            <button className="btn3d" type="submit">Continue to payment <ArrowRight size={16} /></button>
          </form>
        </Tilt>
      )}

      {step === 'payment' && order && (
        <Tilt>
          <div className="form">
            <div className="rows">
              <div><span>Customer</span><b>{order.name}</b></div>
              <div><span>Address</span><b>{order.address}</b></div>
              <div><span>Date Water Want</span><b>{order.date} · {order.time}</b></div>
              <div><span>Water ({order.liters} L × ₹{RATE_PER_LITER})</span><b>{money(order.waterAmount)}</b></div>
              <div><span>Delivery Service fee</span><b>{money(order.fee)}</b></div>
            </div>
            <div className="total"><span>Amount payable</span><strong>{money(order.total)}</strong></div>
            <div className="lbl">Payment method <small>(demo, no real payment)</small></div>
            <div className="pays">
              {PAYMENTS.map(({ name, icon: Icon }, i) => (
                <button type="button" key={name} disabled={paying} className={`pay p${i} ${paymentMethod === name ? 'sel' : ''}`} onClick={() => setPaymentMethod(name)}>
                  <Icon size={18} /><b>{name}</b>
                </button>
              ))}
            </div>
            <button className="btn3d" onClick={confirmPayment} disabled={paying}>
              {paying ? <><span className="spin" /> Generating payment…</> : <>Pay {money(order.total)} <ArrowRight size={16} /></>}
            </button>
            <button className="link" disabled={paying} onClick={() => setStep('details')}><ArrowLeft size={13} /> Edit details</button>
          </div>
        </Tilt>
      )}

      {step === 'dispensing' && order && (
        <Tilt>
          <div className="form">
            <div className={`scene ${filled ? 'done' : ''}`}>
              <div className="floor" />
              <div className="tank"><span className="tcap" /><div className="tbody"><div className="twater"><s /></div><i className="tshine" /><small>TANK</small></div></div>
              <div className="pipe"><i /></div>
              <div className={`valve ${streaming ? 'on' : ''}`}><span className="vstem" /><span className="vwheel"><i /></span></div>
              <div className="nozzle" />
              <div className={`stream ${streaming ? 'on' : ''}`} />
              <span className={`ulabel ${filled ? 'on' : ''}`}>USER BOX</span>
              <div className={`ubox ${filled ? 'on' : ''}`} />
              <div className={`canwrap ${filled ? 'moved' : ''}`}>
                <span className="ccap" />
                <div className="can" style={{ width: canW, height: canH }}>
                  <div className="cwater" style={{ height: `${Math.max(3, fillProgress)}%` }} />
                  <i className="cshine" /><b>{order.liters} L</b>
                </div>
              </div>
            </div>

            <div className="prog">
              <div className="ph"><span>{filled ? 'Complete' : 'Filling…'}</span><b>{Math.min(order.liters, Math.round(order.liters * fillProgress / 100 * 10) / 10)} / {order.liters} L</b></div>
              <div className="track"><div className={filled ? 'fill ok' : 'fill'} style={{ width: `${fillProgress}%` }} /></div>
            </div>
            <button className="btn3d" onClick={() => setStep('complete')} disabled={!filled}>
              {filled ? <>Collect container <ArrowRight size={16} /></> : 'Filling automatically…'}
            </button>
          </div>
        </Tilt>
      )}

      {step === 'complete' && order && (
        <Tilt>
          <div className="form center">
            <div className="ring"><CheckCircle2 size={40} /><Sparkles className="sp s1" size={16} /><Sparkles className="sp s2" size={13} /></div>
            <div className="rows receipt">
              <div><span>Order</span><b>{order.id}</b></div>
              <div><span>Payment ID</span><b>{order.paymentId}</b></div>
              <div><span>Water rate / liter</span><b>₹{RATE_PER_LITER} / L</b></div>
              <div><span>Water ({order.liters} L)</span><b>{money(order.waterAmount)}</b></div>
              <div><span>Service fee</span><b>{money(order.fee)}</b></div>
              <div><span>Paid via</span><b>{order.paymentMethod}</b></div>
              <div className="tot"><span>Total</span><strong>{money(order.total)}</strong></div>
            </div>
            <div className="two">
              <button className="btn3d ghost" onClick={() => setStep('details')}><ArrowLeft size={15} /> Edit</button>
              <button className="btn3d" onClick={reset}><RefreshCw size={15} /> New order</button>
            </div>
            <p className="note">Front-end demo. No real payment or dispensing.</p>
          </div>
        </Tilt>
      )}
    </main>
  );
}
