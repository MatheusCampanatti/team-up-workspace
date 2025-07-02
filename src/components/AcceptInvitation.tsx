
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    acceptInvitation(token);
  }, [token]);

  const acceptInvitation = async (invitationToken: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Accepting invitation with token:", invitationToken);

      const { data, error } = await supabase.rpc("accept_company_invitation", {
        invitation_token: invitationToken,
      });

      if (error) {
        console.error("Error accepting invitation:", error);
        setError(String(error.message));
        return;
      }

      console.log("Invitation response:", data);

      if (!data) {
        setError("No response from server");
        return;
      }

      // Cast the Json response to our expected type with proper type safety
      const response = data as unknown as AcceptInvitationResponse;

      if (response?.success) {
        setAccepted(true);
        toast({
          title: "Invitation accepted!",
          description: "Welcome to the company! Redirecting to boards...",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Invitation
            </h2>
            <p className="text-gray-600 text-center">
              Please wait while we process your invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invitation Error
            </h2>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome!
            </h2>
            <p className="text-gray-600 text-center">
              Your invitation has been accepted successfully. You'll be redirected to the boards page shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AcceptInvitation;
