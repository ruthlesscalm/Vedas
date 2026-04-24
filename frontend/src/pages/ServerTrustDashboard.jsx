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
  Truck,
} from "lucide-react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default marker icons in Leaflet
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

const ServerTrustDashboard = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Initial Load
  useEffect(() => {
    fetchProducts();
    // Auto-refresh every 30 seconds instead of WebSockets for reliability
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      // Assuming you have an endpoint that lists all batches
      const res = await axios.get("/api/batch/all");
      setProducts(res.data.data);
    } catch (err) {
      console.error("Fetch failed, using mock data", err);
      setProducts([
        {
          _id: "1",
          name: "Organic Coffee Batch",
          batchId: "BCH-9942",
          originCity: "Chikmagalur",
          status: "Authentic",
          originHash: "sh256-mock-hash...",
          journey: [
            {
              timeStamp: new Date().toISOString(),
              location: { lat: 13.31, lng: 75.77 },
              scannedBy: "Farmer_01",
              status: "Verified",
            },
            {
              timeStamp: new Date().toISOString(),
              location: { lat: 12.97, lng: 77.59 },
              scannedBy: "Driver_Bob",
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
    doc.text("VEDAS Supply Chain Audit", 20, 30);
    doc.text(`Batch ID: ${product.batchId}`, 20, 50);
    doc.save(`Audit-${product.batchId}.pdf`);
  };

  return (
    <div className="p-6 space-y-8 bg-slate-950 min-h-screen text-slate-200">
      {/* Header section remains visually the same but logic is purely REST now */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="text-blue-500" /> VEDAS Global Ledger
          </h1>
          <p className="text-slate-400">
            Cryptographically verified supply chain movements.
          </p>
        </div>
        <button
          onClick={fetchProducts}
          className="bg-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-500 transition"
        >
          Refresh Data
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Sidebar: Batch List */}
        <div className="glass-panel p-4 rounded-xl space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-2.5 text-slate-500"
              size={18}
            />
            <input
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 focus:border-blue-500 outline-none"
              placeholder="Search Batch ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => setSelectedProduct(product)}
              className={`p-4 rounded-lg cursor-pointer border transition ${selectedProduct?.batchId === product.batchId ? "bg-blue-900/20 border-blue-500" : "bg-slate-900/50 border-slate-800"}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-white">{product.batchId}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border ${product.journey.some((l) => l.status === "Tampered") ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}`}
                >
                  {product.journey.some((l) => l.status === "Tampered")
                    ? "TAMPERED"
                    : "SECURE"}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {product.originHash}
              </p>
            </div>
          ))}
        </div>

        {/* Main Section: Map & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProduct ? (
            <>
              {/* Map View */}
              <div className="h-80 rounded-xl overflow-hidden border border-slate-800">
                <MapContainer
                  center={mapPoints[0] || [12.97, 77.59]}
                  zoom={10}
                  style={{ height: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {mapPoints.map((point, i) => (
                    <Marker key={i} position={point}>
                      <Popup>
                        {selectedProduct.journey[i].location.lat},{" "}
                        {selectedProduct.journey[i].location.lng}
                      </Popup>
                    </Marker>
                  ))}
                  {mapPoints.length > 1 && (
                    <Polyline positions={mapPoints} color="#3b82f6" />
                  )}
                  <MapRecenter points={mapPoints} />
                </MapContainer>
              </div>

              {/* Timeline */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <History size={20} /> Audit Trail
                  </h2>
                  <button
                    onClick={() => exportPDF(selectedProduct)}
                    className="bg-slate-800 p-2 rounded hover:bg-slate-700"
                  >
                    <FileText size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedProduct.journey.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800"
                    >
                      <div
                        className={`mt-1.5 w-3 h-3 rounded-full ${log.status === "Verified" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-bold">{log.scannedBy}</p>
                          <p className="text-xs text-slate-500 font-mono">
                            {new Date(log.timeStamp).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400">
                          GPS: {log.location.lat}, {log.location.lng}
                        </p>
                        <p
                          className={`text-[10px] mt-2 font-bold ${log.status === "Verified" ? "text-green-500" : "text-red-500"}`}
                        >
                          {log.status === "Verified"
                            ? "✓ CRYPTOGRAPHICALLY VERIFIED"
                            : "⚠ INTEGRITY MISMATCH"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-600">
                Select a shipment to view the audit trail
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerTrustDashboard;
