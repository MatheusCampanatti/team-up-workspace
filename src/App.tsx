
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AcceptInvitation from '@/components/AcceptInvitation';
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CompanyBoardsPage from "./pages/CompanyBoardsPage";
import BoardPage from "./pages/BoardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/company/:companyId/boards" element={
              <ProtectedRoute>
                <CompanyBoardsPage />
              </ProtectedRoute>
            } />
            <Route path="/board/:boardId" element={
              <ProtectedRoute>
                <BoardPage />
              </ProtectedRoute>
            } />
            <Route path="/accept" element={
              <ProtectedRoute>
                <AcceptInvitation />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
