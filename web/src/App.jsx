import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { ModalProvider } from './components/Modal.jsx'
import StoreAddImage from './pages/StoreAddImage.jsx'
import StoreAddChart from './pages/StoreAddChart.jsx'
import StoreAddFile from './pages/StoreAddFile.jsx'
import StoreSync from './pages/StoreSync.jsx'
import StoreSave from './pages/StoreSave.jsx'
import StoreLoad from './pages/StoreLoad.jsx'
import StoreExtract from './pages/StoreExtract.jsx'
import StoreCopy from './pages/StoreCopy.jsx'
import StoreRemove from './pages/StoreRemove.jsx'
import Manifests from './pages/Manifests.jsx'
import StoreContents from './pages/StoreContents.jsx'
import Hauls from './pages/Hauls.jsx'
import HaulDetail from './pages/HaulDetail.jsx'
import Publishing from './pages/Publishing.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/DashboardPage.jsx'
import Store from './pages/StorePage.jsx'
import Serve from './pages/ServePage.jsx'
import RegistryLogin from './pages/RegistryLogin.jsx'
import JobHistory from './pages/JobHistory.jsx'
import JobDetail from './pages/JobDetail.jsx'
import Settings from './pages/SettingsPage.jsx'
import { HaulProvider } from './contexts/HaulContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { JobsProvider } from './contexts/JobsContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ModalProvider>
          <HaulProvider>
          <JobsProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={
                <ProtectedRoute>
                  <div className="App">
                    <Sidebar />
                    <div className="main-wrapper">
                      <TopBar />
                      <main className="main-content">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/store" element={<Store />} />
                          <Route path="/store/add" element={<StoreAddImage />} />
                          <Route path="/store/add-chart" element={<StoreAddChart />} />
                          <Route path="/store/add-file" element={<StoreAddFile />} />
                          <Route path="/store/sync" element={<StoreSync />} />
                          <Route path="/store/sync/:manifestId" element={<StoreSync />} />
                          <Route path="/store/save" element={<StoreSave />} />
                          <Route path="/store/load" element={<StoreLoad />} />
                          <Route path="/store/extract" element={<StoreExtract />} />
                          <Route path="/store/copy" element={<StoreCopy />} />
                          <Route path="/store/remove" element={<StoreRemove />} />
                          <Route path="/store/contents" element={<StoreContents />} />
                          <Route path="/manifests" element={<Manifests />} />
                          <Route path="/hauls" element={<Hauls />} />
                          <Route path="/hauls/:id" element={<HaulDetail />} />
                          <Route path="/serve" element={<Serve />} />
                          <Route path="/publish" element={<Publishing />} />
                          <Route path="/registry" element={<RegistryLogin />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/jobs" element={<JobHistory />} />
                          <Route path="/jobs/:id" element={<JobDetail />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </JobsProvider>
          </HaulProvider>
        </ModalProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
