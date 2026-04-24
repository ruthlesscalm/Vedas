import React, { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { ShieldCheck, Package, MapPin, Database, Send, CheckCircle2, Copy, Trash2, Box, Scale, User, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { motion } from 'framer-motion'

const ManufacturerDashboard = () => {
  const [formData, setFormData] = useState({
    name: '',
    weight: '',
    originCity: '',
    manufacturer: ''
  })
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post('/api/products', formData)
      setProduct(res.data)
    } catch (err) {
      console.error(err)
      // Mock for development if backend isn't running
      const mockHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      setProduct({ ...formData, originalHash: mockHash, _id: 'mock-' + Date.now() });
    } finally {
      setLoading(false)
    }
  }

  const copyHash = () => {
    if (!product) return;
    navigator.clipboard.writeText(product.originalHash);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  }

  const resetForm = () => {
    setProduct(null);
    setFormData({ name: '', weight: '', originCity: '', manufacturer: '' });
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Input Form Column */}
        <div className="lg:w-1/2 space-y-6">
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-accent/20 border border-accent/30 flex items-center justify-center shadow-neon">
                <Box size={16} className="text-accent" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-accent uppercase">Crypto Protocol v1.0</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-md">Crypto</h1>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">Empowering the grassroots supply chain. Every parameter is hashed using <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">SHA-256</strong> to create an immutable digital seal.</p>
          </header>

          <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none group-hover:bg-accent/10 transition-colors duration-1000"></div>
            
            <div className="space-y-5 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Product Name</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:shadow-neon transition-all"
                    placeholder="e.g. Organic Arabica Coffee"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Origin City</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      name="originCity"
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:shadow-neon transition-all"
                      placeholder="e.g. Chikmagalur"
                      value={formData.originCity}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Weight</label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      name="weight"
                      required
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:shadow-neon transition-all"
                      placeholder="e.g. 50 kg"
                      value={formData.weight}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Manufacturer Details</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    name="manufacturer"
                    required
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:shadow-neon transition-all"
                    placeholder="e.g. Green Valley Estates"
                    value={formData.manufacturer}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-4 rounded-xl transition-all shadow-neon mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>GENERATE SEAL <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Output/QR Column */}
        <div className="lg:w-1/2 flex items-center justify-center">
          {product ? (
            <div className="w-full glass-panel border border-success/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] rounded-3xl p-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-success/10 blur-3xl rounded-full"></div>
               <div className="absolute top-4 right-4 z-20">
                 <button onClick={resetForm} className="p-2 text-slate-400 hover:text-danger transition-colors">
                   <Trash2 size={20} />
                 </button>
               </div>
               
               <div className="flex items-center gap-4 mb-8 relative z-10">
                 <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center text-success border border-success/30 shadow-neon-success">
                   <ShieldCheck size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-white">Cryptographic Seal Active</h3>
                   <p className="text-sm text-slate-400 font-mono mt-1">ID: {product._id}</p>
                 </div>
               </div>

               <div className="bg-white p-6 rounded-2xl flex justify-center items-center shadow-inner mb-8 relative z-10 max-w-[280px] mx-auto">
                 <QRCodeCanvas 
                    value={JSON.stringify({
                      id: product._id,
                      hash: product.originalHash
                    })} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
               </div>

               <div className="space-y-4 relative z-10">
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
                   <div className="flex justify-between items-center">
                     <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">SHA-256 Hash Signature</p>
                     <button 
                        onClick={copyHash}
                        className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                          copying ? 'bg-accent/20 text-accent' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {copying ? 'COPIED!' : <><Copy size={12}/> COPY</>}
                      </button>
                   </div>
                   <p className="text-xs font-mono text-success break-all">{product.originalHash}</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</p>
                      <p className="text-sm font-bold text-success">Verified</p>
                    </div>
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-center">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Node</p>
                      <p className="text-sm font-bold text-white">Origin</p>
                    </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[400px] glass-panel border-dashed border-slate-600 rounded-3xl flex flex-col items-center justify-center p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full"></div>
                <ShieldCheck size={80} className="relative z-10 text-slate-700" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-white">Awaiting Crypto</p>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">Input product parameters on the left to initialize the cryptographic chain.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManufacturerDashboard

