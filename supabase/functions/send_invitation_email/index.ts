
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend('re_CMxBDkXZ_FjkeTuEQ6sCoSguKJ1fE8d8K');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationEmailRequest {
  email: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token }: InvitationEmailRequest = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: 'Email and token are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const inviteLink = `https://team-up-workspace.lovable.app/accept?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: 'TeamUp <no-reply@onresend.com>',
      to: [email],
      subject: "You've been invited to join TeamUp!",
      html: `
        <h2>You're invited 🎉</h2>
        <p>You've been invited to join a team on TeamUp!</p>
        <p><a href="${inviteLink}" target="_blank" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${inviteLink}</p>
        <p>This invitation will expire in 7 days.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation email sent successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send_invitation_email function:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
