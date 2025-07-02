
import { Resend } from 'resend';

const resend = new Resend('re_CMxBDkXZ_FjkeTuEQ6sCoSguKJ1fE8d8K');

export async function sendInviteEmail(email: string, token: string) {
  const inviteLink = `https://team-up-workspace.lovable.app/accept?token=${token}`;

  const { error } = await resend.emails.send({
    from: 'TeamUp <no-reply@onresend.com>',
    to: email,
    subject: "You've been invited to join TeamUp!",
    html: `<h2>You're invited 🎉</h2><p><a href="${inviteLink}" target="_blank">Click here to accept the invitation</a></p>`
  });

  if (error) {
    console.error('Email send error:', error);
    return false;
  }
  return true;
}
