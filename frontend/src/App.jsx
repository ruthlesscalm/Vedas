import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Zap, Globe, Truck } from 'lucide-react'
import ManufacturerDashboard from './pages/ManufacturerDashboard'
import DriverScan from './pages/DriverScan'
import ClientTrustDashboard from './pages/ClientTrustDashboard'
import ServerTrustDashboard from './pages/ServerTrustDashboard'
import RoleSelection from './pages/RoleSelection'
import Login from './pages/Login'
import Register from './pages/Register'
import PortalLayout from './layouts/PortalLayout'

// Define the portal configurations
const clientLinks = [
  { to: '/client/crypto', icon: Zap, label: 'Crypto' },
  { to: '/client/trust', icon: Globe, label: 'Trust' },
];

const serverLinks = [
  { to: '/server/scan', icon: Truck, label: 'Ghost-Log' },
  { to: '/server/trust', icon: Globe, label: 'Trust' },
];

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Client Portal Routes */}
        <Route path="/client" element={<PortalLayout portalName="Client" links={clientLinks} />}>
          <Route path="crypto" element={<ManufacturerDashboard />} />
          <Route path="trust" element={<ClientTrustDashboard />} />
        </Route>

        {/* Server Portal Routes */}
        <Route path="/server" element={<PortalLayout portalName="Server" links={serverLinks} />}>
          <Route path="scan" element={<DriverScan />} />
          <Route path="trust" element={<ServerTrustDashboard />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App



