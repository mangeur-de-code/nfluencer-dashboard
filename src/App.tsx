import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Overview from "./pages/Admin/Overview";
import Users from "./pages/Admin/Users";
import Creators from "./pages/Admin/Creators";
import Content from "./pages/Admin/Content";
import Subscriptions from "./pages/Admin/Subscriptions";
import Revenue from "./pages/Admin/Revenue";
import Streams from "./pages/Admin/Streams";
import Moderation from "./pages/Admin/Moderation";
import System from "./pages/Admin/System";
import AuditLog from "./pages/Admin/AuditLog";
import Reports from "./pages/Admin/Reports";
import Settings from "./pages/Admin/Settings";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Overview />} />
            <Route path="/users" element={<Users />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/content" element={<Content />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/streams" element={<Streams />} />
            <Route path="/moderation" element={<Moderation />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/system" element={<System />} />
            <Route path="/audit-log" element={<AuditLog />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
