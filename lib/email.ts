import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function buildEmailHtml(title: string, body: string) {
  const bodyHtml = body.replace(/\n/g, "<br>");

  return (
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">' +
    '<div style="background-color: #1e3a8a; padding: 20px; text-align: center;">' +
    '<h1 style="color: #ffffff; margin: 0; font-size: 22px;">Club de Bádminton 360</h1>' +
    "<p style=\"color: #93c5fd; margin: 5px 0 0; font-size: 13px;\">Comunicación oficial del club</p>" +
    "</div>" +
    '<div style="padding: 24px; background-color: #ffffff;">' +
    '<h2 style="color: #1e3a8a; margin-top: 0; font-size: 18px;">' + title + "</h2>" +
    '<p style="color: #374151; line-height: 1.7; font-size: 14px;">' + bodyHtml + "</p>" +
    "</div>" +
    '<div style="padding: 16px; text-align: center; background-color: #f3f4f6;">' +
    '<p style="color: #6b7280; font-size: 11px; margin: 0;">Este mensaje fue enviado desde el sistema de comunicaciones del Club de Bádminton 360.</p>' +
    "</div>" +
    "</div>"
  );
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; simulated?: boolean; error?: any }> {
  if (!resend) {
    console.log("=== EMAIL SIMULADO (RESEND_API_KEY no configurada) ===");
    console.log("Para:", to);
    console.log("Asunto:", subject);
    console.log("Cuerpo:", body);
    console.log("=====================================================");
    return { success: true, simulated: true };
  }

  try {
    const from =
      process.env.EMAIL_FROM || "Club Badminton 360 <onboarding@resend.dev>";

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: subject,
      html: buildEmailHtml(subject, body),
    });

    if (error) {
      console.error("Error al enviar email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Excepción al enviar email:", error);
    return { success: false, error };
  }
}
