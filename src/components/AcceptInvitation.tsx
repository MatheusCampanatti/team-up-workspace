
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AcceptInvitationResponse } from "@/types/rpc";

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const token = searchParams.get("token");

  /** ───────────────────────────────────────────────────────────────
   * 1. Verifica se o usuário está logado; se não, redireciona p/ login
   *    (mantém query string para voltar após login)
   * ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate(
          `/auth?redirectTo=/accept${token ? `?token=${token}` : ""}`,
          { replace: true }
        );
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [navigate, token]);

  /** ───────────────────────────────────────────────────────────────
   * 2. Aceitar convite (RPC)
   * ─────────────────────────────────────────────────────────────── */
  const handleAcceptInvitation = async () => {
    if (!token) {
      setError("Invalid invitation token");
      console.error("Invitation token missing in URL.");
      return;
    }

    console.log("🟢 Accepting invitation with token:", token);
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.rpc(
        "accept_company_invitation",
        { invitation_token: token }
      );

      if (functionError) {
        console.error("Error accepting invitation (RPC):", functionError);
        setError(functionError.message || "Failed to accept invitation");
        return;
      }

      // Cast the Json response to our expected type
      const response = data as AcceptInvitationResponse;

      if (response?.success) {
        setAccepted(true);
        toast({
          title: "Invitation accepted!",
          description: "You have successfully joined the company.",
        });

        setTimeout(() => {
          navigate(`/company/${response.company_id}/boards`);
        }, 2000);
      } else {
        setError(response?.error || "Failed to accept invitation");
      }
    } catch (err: any) {
      console.error("Unexpected error accepting invitation:", err);
      setError(String(err.message) || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  /** ───────────────────────────────────────────────────────────────
   * 3. Estados de interface
   * ─────────────────────────────────────────────────────────────── */
  if (checkingAuth) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mb-3" />
          <span className="text-sm text-muted-foreground">
            Checking authentication…
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Invitation
          </h2>
          <p className="text-gray-600 text-center">
            This invitation link is invalid or has expired.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (accepted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invitation Accepted!
          </h2>
          <p className="text-gray-600 text-center mb-4">
            You have successfully joined the company. Redirecting…
          </p>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept Company Invitation</CardTitle>
        <CardDescription>
          Click the button below to accept the invitation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <Button
            onClick={handleAcceptInvitation}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accepting…
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcceptInvitation;
