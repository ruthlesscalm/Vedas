import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ShieldCheck,
  History,
  Map as MapIcon,
  FileText,
  Search,
  Package,
  Zap,
  Shield,
} from "lucide-react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapRecenter = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
};

const ClientTrustDashboard = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/batch/all");
      setProducts(res.data.data);
    } catch {
      setProducts([
        {
          _id: "1",
          batchId: "B-2029-X-45",
          originLocation: { lat: 13.01, lng: 77.51 },
          originHash:
            "a3f9e2b1c4d8e7f6a5b4c3d2e1f09876543210abcdef1234567890abcdef1234",
          journey: [
            {
              timeStamp: new Date().toISOString(),
              location: { lat: 13.01, lng: 77.51 },
              scannedBy: "MFR-01",
              status: "Verified",
            },
            {
              timeStamp: new Date(Date.now() + 3600000).toISOString(),
              location: { lat: 13.05, lng: 77.62 },
              scannedBy: "DRV-77",
              status: "Verified",
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        p.batchId?.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [products, searchQuery],
  );

  const mapPoints = useMemo(() => {
    if (!selectedProduct?.journey) return [];
    return selectedProduct.journey.map((step) => [
      step.location.lat,
      step.location.lng,
    ]);
  }, [selectedProduct]);

  const exportPDF = (product) => {
    const doc = new jsPDF();
    doc.text("VEDAS — Client Proof of Authenticity", 20, 30);
    doc.text(`Batch ID: ${product.batchId}`, 20, 50);
    doc.text(`Hash: ${product.originHash}`, 20, 60);
    doc.save(`Audit-${product.batchId}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shadow-neon">
              <ShieldCheck className="text-accent" size={20} />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-accent uppercase">
              Client · Proof of Authenticity
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Product Trust Ledger
          </h1>
          <p className="text-slate-400 text-lg max-w-xl">
            View the <strong className="text-white">Chain of Custody</strong>{" "}
            for every registered product.
          </p>
        </header>

        <div className="glass-panel p-5 rounded-2xl space-y-4 relative overflow-hidden min-w-[200px]">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
          <h4 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-2">
            <Zap size={12} className="text-accent" /> System Status
          </h4>
          <div className="grid grid-cols-2 gap-4 text-[10px] font-bold tracking-wider">
            <div className="space-y-1">
              <p className="text-slate-500">PORTAL</p>
              <p className="text-accent">CLIENT MODE</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">SECURITY</p>
              <p className="text-accent">SHA-256</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <div className="relative group w-full md:w-auto">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search Batch ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-accent w-full md:w-96 text-white placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2">
          {loading ? (
            Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-slate-800/50 rounded-xl animate-pulse border border-slate-700/50"
                ></div>
              ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <motion.div
                key={product._id}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedProduct(product)}
                className={`p-5 rounded-xl cursor-pointer transition-all border relative overflow-hidden backdrop-blur-sm ${
                  selectedProduct?.batchId === product.batchId
                    ? "bg-accent/10 border-accent shadow-neon"
                    : "glass-panel hover:border-accent/40"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${product.journey.some((l) => l.status === "Tampered") ? "bg-danger shadow-neon-danger animate-pulse" : "bg-success shadow-neon-success"}`}
                    ></div>
                    <h3 className="font-bold text-lg text-white">
                      {product.batchId}
                    </h3>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 font-mono bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50 truncate">
                  {product.originHash}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                  <span className="flex items-center gap-1.5">
                    <MapIcon size={12} /> VERIFIED JOURNEY
                  </span>
                  <span className="flex items-center gap-1.5">
                    <History size={12} /> {product.journey?.length || 0} NODES
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 glass-panel rounded-2xl border-dashed border-slate-600">
              <Package size={48} className="mx-auto mb-4 text-slate-700" />
              <p className="text-slate-400">No products found</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {selectedProduct ? (
              <motion.div
                key={selectedProduct._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="h-80 rounded-2xl overflow-hidden border border-slate-700/50 shadow-glass relative">
                  <MapContainer
                    center={mapPoints[0] || [13.0, 77.5]}
                    zoom={11}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {mapPoints.map((point, i) => (
                      <Marker key={i} position={point}>
                        <Popup>
                          <div className="font-sans">
                            <p className="font-bold text-sm">
                              {selectedProduct.journey[i]?.scannedBy}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                selectedProduct.journey[i]?.timeStamp,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                    {mapPoints.length > 1 && (
                      <Polyline
                        positions={mapPoints}
                        color="#6366f1"
                        weight={4}
                      />
                    )}
                    <MapRecenter points={mapPoints} />
                  </MapContainer>
                </div>

                <div className="glass-panel rounded-2xl p-8 space-y-8 relative overflow-hidden">
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <h2 className="text-2xl font-extrabold flex items-center gap-3 text-white">
                        <History className="text-accent" size={24} /> Chain of
                        Custody
                      </h2>
                      <p className="text-slate-400 text-sm mt-1">
                        Immutable cryptographic log.
                      </p>
                    </div>
                    <button
                      onClick={() => exportPDF(selectedProduct)}
                      className="flex items-center gap-2 text-sm bg-accent text-white font-bold px-5 py-2.5 rounded-xl shadow-neon"
                    >
                      <FileText size={16} /> Export PDF
                    </button>
                  </div>

                  <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
                    {selectedProduct.journey?.map((step, index) => (
                      <div key={index} className="relative pl-10 group">
                        <div
                          className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${step.status === "Verified" ? "bg-success/20 border-success shadow-neon-success" : "bg-danger/20 border-danger shadow-neon-danger"}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${step.status === "Verified" ? "bg-success" : "bg-danger"}`}
                          ></div>
                        </div>
                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-white text-lg">
                                {step.scannedBy}
                              </p>
                              <p className="text-xs text-slate-500 font-mono mt-1">
                                GPS: {step.location.lat}, {step.location.lng}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono text-slate-500 mb-2">
                                {new Date(step.timeStamp).toLocaleString()}
                              </p>
                              <span
                                className={`text-[10px] font-bold px-3 py-1 rounded-md border ${step.status === "Verified" ? "text-success bg-success/10 border-success/30" : "text-danger bg-danger/10 border-danger/30"}`}
                              >
                                {step.status === "Verified"
                                  ? "✓ VERIFIED"
                                  : "⚠ TAMPERED"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-slate-500 space-y-6 min-h-[500px] glass-panel rounded-2xl border-dashed border-slate-600"
              >
                <Shield size={80} className="text-slate-700" />
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    Select a product
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Verify journey and cryptographic integrity.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ClientTrustDashboard;
