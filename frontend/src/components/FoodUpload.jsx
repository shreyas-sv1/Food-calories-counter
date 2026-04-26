import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { predictFood, predictFoodTopK } from '../api'
import ResultCard from './ResultCard'

/* ─── tiny inline-style helpers ─── */
const S = {
  page:    { maxWidth:'80rem', margin:'0 auto', paddingBottom:'4rem' },
  header:  { textAlign:'center', marginBottom:'2.5rem' },
  grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:'2rem', alignItems:'start' },
  col:     { display:'flex', flexDirection:'column', gap:'1.25rem' },
  badge:   { display:'flex', justifyContent:'center', marginBottom:'1rem' },
  row:     { display:'flex', gap:'0.75rem' },
  mono:    { fontFamily:"'JetBrains Mono',monospace" },
}

const TIPS = ['Upload food image (JPEG / PNG / WebP)','Click "Run ML Analysis"','View calorie & macro breakdown','Switch to Top-5 candidates']
const COLORS = ['#00d4ff','#4f8ef7','#8b5cf6','#10d494','#f59e0b']

export default function FoodUpload() {
  const [preview,      setPreview]      = useState(null)
  const [result,       setResult]       = useState(null)
  const [topK,         setTopK]         = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [file,         setFile]         = useState(null)
  const [activeTab,    setActiveTab]    = useState('single')
  const [analysisTime, setAnalysisTime] = useState(null)
  const [dragOver,     setDragOver]     = useState(false)

  const onDrop = useCallback((ok, bad) => {
    if (bad.length) { toast.error('Invalid file. JPEG, PNG or WebP under 5 MB.'); return }
    const f = ok[0]
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setTopK(null) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragOver(true),
    onDragLeave: () => setDragOver(false),
    onDropAccepted: () => setDragOver(false),
    accept: { 'image/jpeg':[], 'image/png':[], 'image/webp':[] },
    maxSize: 5*1024*1024,
    multiple: false,
  })

  const handleAnalyze = async () => {
    if (!file) { toast.error('Please upload an image first.'); return }
    setLoading(true)
    const t0 = Date.now()
    try {
      const [single, multi] = await Promise.all([predictFood(file), predictFoodTopK(file, 5)])
      setResult(single); setTopK(multi.predictions || [])
      setAnalysisTime(((Date.now()-t0)/1000).toFixed(2))
      toast.success(`🎯 Detected: ${single.food}`)
      const h = JSON.parse(localStorage.getItem('foodHistory')||'[]')
      h.unshift({...single, timestamp:Date.now()})
      localStorage.setItem('foodHistory', JSON.stringify(h.slice(0,50)))
    } catch (err) {
      toast.error(err.response?.data?.detail||'Analysis failed. Make sure the backend is running.')
    } finally { setLoading(false) }
  }

  const handleReset = () => { setFile(null); setPreview(null); setResult(null); setTopK(null); setAnalysisTime(null) }

  const handleCapture = () => {
    const inp = document.createElement('input')
    inp.type='file'; inp.accept='image/*'; inp.capture='environment'
    inp.onchange = e => { const f=e.target.files[0]; if(f){setFile(f);setPreview(URL.createObjectURL(f));setResult(null);setTopK(null)} }
    inp.click()
  }

  const isActive = isDragActive || dragOver

  return (
    <div style={S.page}>

      {/* ── PAGE HEADER ── */}
      <div style={S.header}>
        <div style={S.badge}><div className="model-badge"><div className="status-dot"/>CNN · EfficientNet-B0</div></div>
        <h1 style={{fontSize:'clamp(1.8rem,5vw,2.8rem)', fontWeight:900, color:'#f0f4ff', marginBottom:'0.75rem', letterSpacing:'-0.02em'}}>
          Food Calorie Analyzer
        </h1>
        <p style={{color:'#94a3b8', fontSize:'1.05rem', maxWidth:'500px', margin:'0 auto', lineHeight:1.6}}>
          Upload a food photo and let our&nbsp;<strong style={{color:'#22d3ee'}}>CNN model</strong>&nbsp;do the rest — instant nutrition data, zero guesswork.
        </p>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div style={S.grid}>

        {/* LEFT PANEL */}
        <div style={S.col}>

          {/* DROP ZONE */}
          <div
            {...getRootProps()}
            style={{
              position:'relative', borderRadius:'20px', cursor:'pointer',
              border: isActive ? '2px solid rgba(0,212,255,0.7)' : preview ? '2px solid rgba(0,212,255,0.25)' : '2px dashed rgba(99,179,237,0.25)',
              background: isActive ? 'rgba(0,212,255,0.04)' : 'rgba(15,20,32,0.7)',
              backdropFilter:'blur(20px)', transition:'all 0.3s ease',
              boxShadow: isActive ? '0 0 40px rgba(0,212,255,0.12), inset 0 0 40px rgba(0,212,255,0.04)' : 'none',
              minHeight: preview ? 'auto' : '320px',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              overflow:'hidden',
            }}
          >
            <input {...getInputProps()} />

            {/* scan line when dragging */}
            {isActive && (
              <div style={{position:'absolute', left:0, right:0, height:'2px', background:'linear-gradient(90deg,transparent,rgba(0,212,255,0.7),transparent)', animation:'scan-line 1.5s linear infinite', zIndex:2}}/>
            )}

            {preview ? (
              <div style={{width:'100%', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center'}}>
                {/* image with glow frame */}
                <div style={{position:'relative', width:'100%', borderRadius:'14px', overflow:'hidden', boxShadow:'0 0 0 1px rgba(0,212,255,0.15), 0 8px 32px rgba(0,0,0,0.5)'}}>
                  <img src={preview} alt="Preview" style={{width:'100%', maxHeight:'280px', objectFit:'contain', display:'block', background:'rgba(0,0,0,0.3)'}}/>
                  {/* loading overlay */}
                  {loading && (
                    <div style={{position:'absolute', inset:0, background:'rgba(5,8,16,0.75)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.75rem', backdropFilter:'blur(4px)'}}>
                      <div style={{width:'52px', height:'52px', borderRadius:'50%', border:'3px solid rgba(0,212,255,0.2)', borderTopColor:'#00d4ff', animation:'spin 0.8s linear infinite'}}/>
                      <div style={{textAlign:'center'}}>
                        <p style={{color:'#00d4ff', fontSize:'0.9rem', ...S.mono, marginBottom:'2px'}}>Running Inference</p>
                        <p style={{color:'#475569', fontSize:'0.75rem', ...S.mono}}>EfficientNet-B0 · 101 classes</p>
                      </div>
                    </div>
                  )}
                  {/* corner badge */}
                  <div style={{position:'absolute', top:'10px', right:'10px', background:'rgba(5,8,16,0.85)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'8px', padding:'4px 10px', fontSize:'0.7rem', ...S.mono, color:'#22d3ee', backdropFilter:'blur(8px)'}}>
                    {file?.name?.length > 20 ? file.name.slice(0,20)+'…' : file?.name}
                  </div>
                </div>
                {/* file meta */}
                <div style={{display:'flex', alignItems:'center', gap:'1rem', fontSize:'0.75rem', ...S.mono, color:'#475569'}}>
                  <span>📁 {(file?.size/1024).toFixed(0)} KB</span>
                  <span style={{width:'4px', height:'4px', borderRadius:'50%', background:'#334155', display:'inline-block'}}/>
                  <span>🔄 Click to replace</span>
                </div>
              </div>
            ) : (
              /* EMPTY STATE */
              <div style={{padding:'3rem 2rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'1.5rem'}}>
                {/* animated upload icon */}
                <div style={{
                  width:'96px', height:'96px', borderRadius:'24px',
                  background:'linear-gradient(135deg,rgba(0,212,255,0.1),rgba(79,142,247,0.1))',
                  border:'1px solid rgba(0,212,255,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  animation:'float 4s ease-in-out infinite',
                  boxShadow:'0 0 30px rgba(0,212,255,0.08)',
                }}>
                  <svg style={{width:'48px', height:'48px', color:'#22d3ee'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                  </svg>
                </div>

                <div>
                  {isActive
                    ? <p style={{fontSize:'1.2rem', fontWeight:700, color:'#22d3ee', margin:0}}>Drop it here! 🎯</p>
                    : <>
                        <p style={{fontSize:'1.1rem', fontWeight:700, color:'#f0f4ff', margin:'0 0 6px'}}>Drop your food image here</p>
                        <p style={{fontSize:'0.9rem', color:'#64748b', margin:0}}>or click to browse files</p>
                      </>
                  }
                </div>

                {/* format pills */}
                <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', justifyContent:'center'}}>
                  {['JPEG','PNG','WebP'].map(f=>(
                    <span key={f} style={{padding:'4px 12px', borderRadius:'20px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', fontSize:'0.75rem', ...S.mono, color:'#64748b'}}>{f}</span>
                  ))}
                  <span style={{padding:'4px 12px', borderRadius:'20px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', fontSize:'0.75rem', ...S.mono, color:'#f59e0b'}}>Max 5 MB</span>
                </div>

                {/* tips */}
                <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', width:'100%', maxWidth:'280px', textAlign:'left', marginTop:'0.25rem'}}>
                  {TIPS.map((tip,i)=>(
                    <div key={i} style={{display:'flex', alignItems:'center', gap:'0.75rem', fontSize:'0.75rem', color:'#475569'}}>
                      <span style={{width:'20px', height:'20px', borderRadius:'50%', border:'1px solid #1e293b', display:'flex', alignItems:'center', justifyContent:'center', ...S.mono, flexShrink:0, color:'#334155', fontSize:'0.65rem'}}>{i+1}</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div style={S.row}>
            <button
              id="analyze-food-btn"
              onClick={handleAnalyze}
              disabled={!file||loading}
              className="btn-primary"
              style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', fontSize:'0.95rem', padding:'14px 20px'}}
            >
              {loading
                ? <><div style={{width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite'}}/><span style={S.mono}>Running Inference…</span></>
                : <><svg style={{width:'18px', height:'18px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg>Run ML Analysis</>
              }
            </button>

            <button onClick={handleCapture} className="btn-secondary" style={{padding:'0 16px'}} title="Open camera">
              <svg style={{width:'20px',height:'20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
              </svg>
            </button>

            {preview && (
              <button onClick={handleReset} className="btn-secondary" style={{padding:'0 16px'}} title="Reset"
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(239,68,68,0.4)';e.currentTarget.style.color='#f87171'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='';e.currentTarget.style.color=''}}>
                <svg style={{width:'20px',height:'20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* MODEL INFO CARD */}
          <div style={{borderRadius:'16px', border:'1px solid rgba(99,179,237,0.1)', background:'rgba(15,20,32,0.8)', backdropFilter:'blur(20px)', padding:'1.25rem', overflow:'hidden', position:'relative'}}>
            {/* accent strip */}
            <div style={{position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,#00d4ff,#8b5cf6,#10d494)'}}/>
            <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', marginTop:'0.25rem'}}>
              <div style={{width:'6px', height:'6px', borderRadius:'50%', background:'#10d494', boxShadow:'0 0 8px rgba(16,212,148,0.6)'}}/>
              <p style={{fontSize:'0.7rem', ...S.mono, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em'}}>ML Model Info</p>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem 1rem'}}>
              {[
                ['Architecture','EfficientNet-B0'],['Framework','PyTorch 2.2+'],
                ['Input Size','224 × 224 px'],['Output','101 classes · softmax'],
                ['Dataset','Food-101'],['Optimizer','Adam + LR Scheduler'],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex', flexDirection:'column', gap:'2px', padding:'0.5rem', borderRadius:'8px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)'}}>
                  <span style={{fontSize:'0.65rem', color:'#475569', textTransform:'uppercase', letterSpacing:'0.06em'}}>{k}</span>
                  <span style={{fontSize:'0.78rem', ...S.mono, color:'#cbd5e1', fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div>
          {loading ? <SkeletonLoader/>
           : result ? (
            <div style={{display:'flex', flexDirection:'column', gap:'1rem', animation:'fadeInUp 0.4s ease-out forwards'}}>
              {/* tabs */}
              {topK && (
                <div style={{display:'flex', gap:'0.5rem', background:'rgba(15,20,32,0.6)', borderRadius:'14px', padding:'4px', border:'1px solid rgba(255,255,255,0.05)'}}>
                  {[['single','🎯 Top Prediction'],['topk','📊 Top-5 Candidates']].map(([id,label])=>(
                    <button key={id} onClick={()=>setActiveTab(id)} style={{
                      flex:1, padding:'8px 12px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'0.85rem', fontWeight:600, transition:'all 0.2s',
                      background: activeTab===id ? 'rgba(0,212,255,0.15)' : 'transparent',
                      color: activeTab===id ? '#22d3ee' : '#64748b',
                      boxShadow: activeTab===id ? 'inset 0 0 0 1px rgba(0,212,255,0.3)' : 'none',
                    }}>{label}</button>
                  ))}
                </div>
              )}
              {/* inference badge */}
              {analysisTime && (
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <div style={{display:'inline-flex', alignItems:'center', gap:'6px', padding:'5px 14px', borderRadius:'20px', background:'rgba(16,212,148,0.08)', border:'1px solid rgba(16,212,148,0.25)', fontSize:'0.75rem', ...S.mono, color:'#10d494'}}>
                    ⚡ Inference: {analysisTime}s
                  </div>
                </div>
              )}
              {activeTab==='single' ? <ResultCard result={result}/> : <TopKCard predictions={topK}/>}
            </div>
          ) : <EmptyState/>}
        </div>
      </div>
    </div>
  )
}

/* ── SUB-COMPONENTS ── */

function EmptyState() {
  return (
    <div style={{borderRadius:'20px', border:'1px solid rgba(99,179,237,0.08)', background:'rgba(15,20,32,0.7)', backdropFilter:'blur(20px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'520px', padding:'3rem', textAlign:'center', gap:'1.5rem'}}>
      <div style={{position:'relative'}}>
        <div style={{width:'100px', height:'100px', borderRadius:'28px', background:'linear-gradient(135deg,rgba(0,212,255,0.08),rgba(139,92,246,0.08))', border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', animation:'float 4s ease-in-out infinite'}}>
          <svg style={{width:'52px', height:'52px', color:'#1e293b'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3"/>
          </svg>
        </div>
        {/* orbiting dot */}
        <div style={{position:'absolute', top:'-4px', right:'-4px', width:'18px', height:'18px', borderRadius:'50%', background:'linear-gradient(135deg,#00d4ff,#4f8ef7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}}>✨</div>
      </div>

      <div>
        <h3 style={{fontSize:'1.2rem', fontWeight:700, color:'#64748b', margin:'0 0 6px'}}>Awaiting ML Input</h3>
        <p style={{color:'#334155', fontSize:'0.875rem', maxWidth:'260px', lineHeight:1.6, margin:0}}>Upload a food image on the left and run the analysis to see results here.</p>
      </div>

      {/* decorative stat chips */}
      <div style={{display:'flex', gap:'0.75rem', flexWrap:'wrap', justifyContent:'center', marginTop:'0.5rem'}}>
        {[['101','Food Classes','#00d4ff'],['85%','Val Accuracy','#10d494'],['<1s','Inference','#8b5cf6']].map(([v,l,c])=>(
          <div key={l} style={{padding:'10px 18px', borderRadius:'12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', textAlign:'center'}}>
            <p style={{fontSize:'1.1rem', fontWeight:900, color:c, margin:0}}>{v}</p>
            <p style={{fontSize:'0.65rem', color:'#334155', margin:0, fontFamily:"'JetBrains Mono',monospace"}}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopKCard({ predictions }) {
  if (!predictions?.length) return null
  return (
    <div style={{borderRadius:'20px', border:'1px solid rgba(99,179,237,0.1)', background:'rgba(15,20,32,0.8)', backdropFilter:'blur(20px)', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem'}}>
      <div>
        <h3 style={{fontSize:'1.1rem', fontWeight:700, color:'#f0f4ff', margin:'0 0 4px'}}>Top-5 Model Predictions</h3>
        <p style={{fontSize:'0.72rem', color:'#475569', fontFamily:"'JetBrains Mono',monospace", margin:0}}>Softmax probability distribution across candidate classes</p>
      </div>
      {predictions.map((pred,i)=>(
        <div key={pred.food} style={{display:'flex', flexDirection:'column', gap:'6px'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <div style={{width:'22px', height:'22px', borderRadius:'6px', background:`${COLORS[i]}18`, border:`1px solid ${COLORS[i]}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontFamily:"'JetBrains Mono',monospace", color:COLORS[i], flexShrink:0}}>{i+1}</div>
              <span style={{fontSize:'0.9rem', fontWeight:600, color:'#f0f4ff', textTransform:'capitalize'}}>{pred.food}</span>
              {i===0 && <span style={{fontSize:'0.65rem', padding:'2px 8px', borderRadius:'20px', background:'rgba(0,212,255,0.1)', color:'#22d3ee', border:'1px solid rgba(0,212,255,0.25)', fontFamily:"'JetBrains Mono',monospace"}}>best</span>}
            </div>
            <span style={{fontSize:'0.9rem', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:COLORS[i]}}>{(pred.confidence*100).toFixed(1)}%</span>
          </div>
          <div style={{height:'5px', background:'rgba(255,255,255,0.04)', borderRadius:'3px', overflow:'hidden'}}>
            <div style={{height:'100%', borderRadius:'3px', width:`${pred.confidence*100}%`, background:`linear-gradient(90deg,${COLORS[i]}60,${COLORS[i]})`, transition:'width 0.9s cubic-bezier(0.4,0,0.2,1)'}}/>
          </div>
          <p style={{fontSize:'0.7rem', color:'#334155', fontFamily:"'JetBrains Mono',monospace", paddingLeft:'1.75rem'}}>
            {pred.calories} kcal · P {pred.protein}g · C {pred.carbs}g · F {pred.fat}g
          </p>
        </div>
      ))}
    </div>
  )
}

function SkeletonLoader() {
  const bar = (w,h,r=8) => <div className="shimmer" style={{width:w,height:h,borderRadius:r}}/>
  return (
    <div style={{borderRadius:'20px', border:'1px solid rgba(99,179,237,0.08)', background:'rgba(15,20,32,0.7)', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem', animation:'fadeInUp 0.4s ease-out forwards'}}>
      <div style={{display:'flex', gap:'0.75rem'}}>{bar('45%',20)}{bar('25%',20)}</div>
      {bar('100%',64,12)}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem'}}>{[0,1,2].map(i=><div key={i}>{bar('100%',64,12)}</div>)}</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>{[0,1].map(i=><div key={i}>{bar('100%',130,12)}</div>)}</div>
      {[0,1,2,3,4].map(i=>(
        <div key={i} style={{display:'flex', flexDirection:'column', gap:'4px'}}>{bar('70%',10,4)}{bar('100%',6,3)}</div>
      ))}
    </div>
  )
}
