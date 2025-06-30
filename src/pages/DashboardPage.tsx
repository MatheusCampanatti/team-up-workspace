import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DashboardPage = () => {
  const { user, signOut, companies, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCompanyName, setNewCompanyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
          } else {
            setProfile(data);
          }
        } catch (error) {
          console.error("Unexpected error fetching profile:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const createCompanyMutation = useMutation({
    mutationFn: async (companyName: string) => {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          name: companyName,
          created_by: user!.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating company:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setNewCompanyName("");
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: "Company created successfully!",
      });
    },
    onError: (error: any) => {
      console.error("Failed to create company:", error);
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanyName.trim()) {
      createCompanyMutation.mutate(newCompanyName.trim());
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              {profile && (
                <p className="mt-1 text-sm text-gray-600">
                  Welcome back, {profile.name}
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Company</span>
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>

          {showCreateForm && (
            <div className="pb-6">
              <form onSubmit={handleCreateCompany} className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Enter company name..."
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={!newCompanyName.trim() || createCompanyMutation.isPending}
                >
                  {createCompanyMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCompanyName('');
                  }}
                >
                  Cancel
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Companies</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">Loading companies...</div>
            </div>
          ) : companies && companies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <Card key={company.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{company.name}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {company.role}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      Created: {new Date(company.created_at).toLocaleDateString()}
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => window.location.href = `/company/${company.id}/boards`}
                    >
                      View Boards
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No companies found. Create your first company to get started.</div>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Company</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
