import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

// CORS Headers for client invocation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase Admin client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// SMTP Transporter Setup
const getTransporter = () => {
  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") || "587");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");

  if (!host || !user || !pass) {
    console.warn("SMTP settings missing. Falling back to Ethereal mock transporter.");
    return {
      sendMail: async (options: any) => {
        console.log("=== MOCK EMAIL DISPATCH ===");
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body Snippet: ${options.html.substring(0, 300)}...`);
        if (options.attachments) {
          console.log(`Attachments: ${options.attachments.map((a: any) => a.filename).join(", ")}`);
        }
        return { messageId: "mock-id-" + Math.random() };
      },
    } as any;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// ICS Calendar file generator
function generateIcs(event: { title: string; description: string; start_time: string; end_time: string; location: string; id: string }): string {
  const formatIcsDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const start = formatIcsDate(event.start_time);
  const end = formatIcsDate(event.end_time);
  const created = formatIcsDate(new Date().toISOString());

  const cleanDescription = (event.description || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KAMADA//Event Invite//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}`,
    `DTSTAMP:${created}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${event.location || "Online"}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// Common Email HTML Wrapper
function emailTemplate(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            background-color: #0b0f19;
            color: #d1d5db;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #111827;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
            color: #d1d5db !important;
          }
          .content p, .content li, .content span, .content ul, .content ol {
            color: #d1d5db !important;
          }
          .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
            color: #ffffff !important;
          }
          .content strong {
            color: #ffffff !important;
          }
          .footer {
            background-color: #0b0f19;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            font-size: 12px;
            color: #6b7280;
          }
          .button {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            font-weight: 600;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
          }
          .button:hover {
            background-color: #059669;
          }
          a {
            color: #10b981;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KAMADA</h1>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            &copy; 2026 KAMADA Financial Blog. All rights reserved.<br>
            You are receiving this email because you registered on our platform.
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, email, first_name, last_name, event_id, user_id } = payload;

    console.log(`[send-email] Request: type=${type}, email=${email}, user_id=${user_id || "N/A"}, event_id=${event_id || "N/A"}`);

    if (!type) {
      return new Response(JSON.stringify({ error: "Missing action type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve recipient details (fallback to DB lookup if they aren't passed explicitly)
    let recipientEmail = email;
    let firstName = first_name;
    let lastName = last_name;

    const targetUserId = user_id || payload.record?.user_id || payload.record?.id;
    if (!recipientEmail && targetUserId) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", targetUserId)
        .single();

      if (!profileError && profile) {
        recipientEmail = profile.email;
        firstName = profile.first_name;
        lastName = profile.last_name;
      }
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "Missing recipient email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transporter = getTransporter();
    let fromAddress = Deno.env.get("SMTP_FROM") || `"KAMADA Team" <noreply@kamada.app>`;
    if (fromAddress && !fromAddress.includes("@")) {
      const smtpUser = Deno.env.get("SMTP_USER");
      if (smtpUser) {
        fromAddress = `"${fromAddress}" <${smtpUser}>`;
      }
    }

    let subject = "";
    let htmlContent = "";
    const attachments: any[] = [];
    const nameStr = firstName || "there";

    // 1. SIGNUP EMAIL
    if (type === "signup") {
      subject = `Welcome to KAMADA, ${nameStr}! 🚀`;
      htmlContent = emailTemplate(
        "Welcome to KAMADA",
        `
          <h2 style="color: #ffffff; font-size: 20px;">Welcome aboard, ${nameStr}!</h2>
          <p>We are absolutely thrilled to welcome you to the KAMADA community, your new hub for mastering personal finance, investing, and algorithmic markets.</p>
          <p>Here is what you can do right now to kickstart your journey:</p>
          <ul>
            <li><strong>Complete Onboarding</strong>: Configure your personal interests to receive custom insights tailormade for you.</li>
            <li><strong>Interactive Learning</strong>: Jump into our bite-sized structured financial modules.</li>
            <li><strong>Community Webinars</strong>: Join live bootcamps and quizzes hosted by our expert contributors.</li>
          </ul>
          <p style="margin-top: 30px;">Let's get started on unlocking your financial potential.</p>
          <div style="text-align: center;">
            <a href="https://kamad.netlify.app/onboarding" class="button">Go to Dashboard</a>
          </div>
        `
      );
    }
    // 2. NEWSLETTER SUBSCRIPTION EMAIL
    else if (type === "subscription") {
      subject = "Welcome to the KAMADA Newsletter 📬";
      htmlContent = emailTemplate(
        "Newsletter Subscribed",
        `
          <h2 style="color: #ffffff; font-size: 20px;">You are subscribed!</h2>
          <p>Hi ${nameStr},</p>
          <p>Thank you for subscribing to the KAMADA newsletter updates. You will now receive high-quality, actionable insights, stock market digests, and retirement planning guides straight to your inbox.</p>
          <p>We respect your time: we never spam, and we package only the highest-value content. You can fine-tune your email preferences or opt out at any time directly from your Profile settings page.</p>
          <p>Stay sharp, stay curious!</p>
          <div style="text-align: center;">
            <a href="https://kamad.netlify.app/newsletter" class="button">Browse Latest Articles</a>
          </div>
        `
      );
    }
    // 3. EVENT CONFIRMATION EMAIL
    else if (type === "confirmation" || type === "promotion" || type === "event_registration") {
      const targetEventId = event_id || payload.record?.event_id;
      if (!targetEventId) {
        return new Response(JSON.stringify({ error: "Missing event_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch Event Details
      const { data: event, error: eventError } = await supabaseAdmin
        .from("events")
        .select("*")
        .eq("id", targetEventId)
        .single();

      if (eventError || !event) {
        return new Response(JSON.stringify({ error: "Event not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isPromotion = type === "promotion";
      subject = isPromotion
        ? `Waitlist Update: You're confirmed for ${event.title}! 🌟`
        : `RSVP Confirmed: ${event.title} 📅`;

      const headerText = isPromotion
        ? "Good News! You are Promoted"
        : "Your RSVP is Confirmed";

      const introText = isPromotion
        ? `A spot opened up and you have been promoted from the waitlist for <strong>${event.title}</strong>!`
        : `Your registration is confirmed for our upcoming session: <strong>${event.title}</strong>.`;

      const localDate = new Date(event.start_time).toLocaleString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short",
      });

      htmlContent = emailTemplate(
        headerText,
        `
          <h2 style="color: #ffffff; font-size: 20px;">Hi ${nameStr},</h2>
          <p>${introText}</p>
          <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 20px; border-radius: 12px; margin: 25px 0;">
            <h3 style="color: #ffffff; margin-top: 0; font-size: 16px;">Session Details:</h3>
            <p style="margin: 6px 0;"><strong>Date & Time:</strong> ${localDate}</p>
            <p style="margin: 6px 0;"><strong>Location:</strong> ${event.location || "Online"}</p>
            ${
              event.virtual_lobby_url
                ? `<p style="margin: 6px 0;"><strong>Lobby Link:</strong> <a href="${event.virtual_lobby_url}">${event.virtual_lobby_url}</a></p>`
                : ""
            }
          </div>
          <p>We've attached an <code>event.ics</code> calendar file to this email. You can open it to automatically add this session to Google Calendar, Apple Calendar, or Outlook.</p>
          <p>Looking forward to seeing you there!</p>
          <div style="text-align: center;">
            <a href="https://kamad.netlify.app/events/${event.id}" class="button">View Event Page</a>
          </div>
        `
      );

      // Generate and Attach ICS File
      const icsString = generateIcs(event);
      attachments.push({
        filename: "event.ics",
        content: icsString,
        contentType: "text/calendar",
      });
    } else {
      return new Response(JSON.stringify({ error: `Unsupported email type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send the email
    const result = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject,
      html: htmlContent,
      attachments,
    });

    console.log(`[send-email] Successfully sent '${type}' email to ${recipientEmail}. MessageId: ${result?.messageId || "N/A"}`);

    return new Response(JSON.stringify({ success: true, message: `Email sent successfully.` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[send-email] Server error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to process request" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
