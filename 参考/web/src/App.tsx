import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AdminShell } from "@/layouts/AdminShell";
import { FeatureDetailPage } from "@/pages/FeatureDetailPage";
import { FeaturesOverviewPage } from "@/pages/FeaturesOverviewPage";
import { HooksPage } from "@/pages/HooksPage";
import { SessionPage } from "@/pages/SessionPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminShell />}>
          <Route index element={<Navigate to="/hooks" replace />} />
          <Route path="hooks" element={<HooksPage />} />
          <Route path="session" element={<SessionPage />} />
          <Route path="features" element={<Outlet />}>
            <Route index element={<FeaturesOverviewPage />} />
            <Route path=":featureId" element={<FeatureDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
