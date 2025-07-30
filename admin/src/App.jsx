import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Userlist from './pages/user/Userlist'
import Cashout from './pages/cashout/Cashout'
import Pendingcashout from './pages/cashout/Pendingcashout'
import Rejectedcashout from './pages/cashout/Rejectedcashout'
import Adddepositmethod from './pages/method/Adddepositmethod'
import Depositmethods from './pages/method/Depositmethods'
import Addpackage from './pages/loan/Addpackage'
import Allpackages from './pages/loan/Allpackages'
import Pendingloan from './pages/application/Pendingloan'
import Rejectedloan from './pages/application/Rejectedloan'
import Approvedloan from './pages/application/Approvedloan'
import Pendingcashin from './pages/cashin/Pendingcashin'
import Rejectedcashin from './pages/cashin/Rejectedcashin'
import Approvedcashin from './pages/cashin/Approvedcashin'
import Addreview from './pages/review/Addreview'
import Reviewlist from './pages/review/Reviewlist'
import AddSlider from './pages/slider/AddSlider'
import Slider from './pages/slider/Slider'
import Profile from './pages/settings/Profile'
import System from './pages/settings/System'
import Requestpayment from './pages/prepayment/Requestpayment'
import Viewuser from './pages/user/Viewuser'
import Allpayin from './pages/cashin/Allpayin'
import Forwardsms from './pages/sms/Forwardsms'
import Allpayout from './pages/cashout/Allpayout'
import Edituser from './pages/user/Edituser'
import Allmethod from './pages/allmethod/Allmethod'
import Apikey from './pages/apikey/Apikey'
import Merchantpayment from './pages/merchantpayment/Merchantpayment'
import Allmerchat from './pages/apikey/Allmerchat'
import Merchantwithdrwals from './pages/merchantwithdraw/Merchantwithdrwals'

const ProtectedRoute = ({ children }) => {
  // Check if user data exists in localStorage
  const userData = localStorage.getItem('userData');
  
  if (!userData) {
    // If no user data, redirect to login
    return <Navigate to="/login" replace />;
  }
  
  // If user data exists, render the child components
  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - accessible without authentication */}
        <Route exact path="/login" element={<Login />} />
        
        {/* Protected routes - require authentication */}
        <Route exact path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }/>
                {/* Protected routes - require authentication */}
        <Route exact path="/dashboard/generate-key" element={
          <ProtectedRoute>
            <Apikey />
          </ProtectedRoute>
        }/>
        <Route exact path="/dashboard/agents" element={
          <ProtectedRoute>
            <Userlist />
          </ProtectedRoute>
        }/>
          <Route exact path="/dashboard/merchant-payment" element={
          <ProtectedRoute>
            <Merchantpayment />
          </ProtectedRoute>
        }/>
           <Route exact path="/dashboard/all-merchants" element={
          <ProtectedRoute>
            <Allmerchat />
          </ProtectedRoute>
        }/>
        <Route exact path="/dashboard/view-agents/:id" element={
          <ProtectedRoute>
            <Viewuser />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/edit-agents/:id" element={
          <ProtectedRoute>
            <Edituser />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/all-method" element={
          <ProtectedRoute>
            <Allmethod />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/prepayment-requests" element={
          <ProtectedRoute>
            <Requestpayment />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/cashout-list" element={
          <ProtectedRoute>
            <Cashout />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/pending-cashout" element={
          <ProtectedRoute>
            <Pendingcashout />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/rejected-cashout" element={
          <ProtectedRoute>
            <Rejectedcashout />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/add-deposit-method" element={
          <ProtectedRoute>
            <Adddepositmethod />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/deposit-methods" element={
          <ProtectedRoute>
            <Depositmethods />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/add-package" element={
          <ProtectedRoute>
            <Addpackage />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/all-package" element={
          <ProtectedRoute>
            <Allpackages />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/pending-loans" element={
          <ProtectedRoute>
            <Pendingloan />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/rejected-loans" element={
          <ProtectedRoute>
            <Rejectedloan />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/approved-loans" element={
          <ProtectedRoute>
            <Approvedloan />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/pending-cashin" element={
          <ProtectedRoute>
            <Pendingcashin />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/rejected-cashin" element={
          <ProtectedRoute>
            <Rejectedcashin />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/all-payin" element={
          <ProtectedRoute>
            <Allpayin />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/forward-sms" element={
          <ProtectedRoute>
            <Forwardsms />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/approved-cashin" element={
          <ProtectedRoute>
            <Approvedcashin />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/add-review" element={
          <ProtectedRoute>
            <Addreview />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/review-list" element={
          <ProtectedRoute>
            <Reviewlist />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/add-slider" element={
          <ProtectedRoute>
            <AddSlider />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/slider-list" element={
          <ProtectedRoute>
            <Slider />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/settings/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/all-payout" element={
          <ProtectedRoute>
            <Allpayout />
          </ProtectedRoute>
        }/>
        
        <Route exact path="/dashboard/settings/system" element={
          <ProtectedRoute>
            <System />
          </ProtectedRoute>
        }/>
        
     <Route exact path="/dashboard/merchant-withdrawal" element={
          <ProtectedRoute>
            <Merchantwithdrwals />
          </ProtectedRoute>
        }/>

        {/* Redirect to login by default if no route matches */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App