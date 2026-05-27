import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import type { Config } from "@netlify/functions";

// Secure env variables fetcher
const getEnv = (key: string): string => {
  return process.env[key] || "";
};

const supabaseUrl = getEnv("VITE_SUPABASE_URL");
const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Setup SMTP Transporter
const getTransporter = () => {
  const host = getEnv("SMTP_HOST");
  const port = Number(getEnv("SMTP_PORT") || "587");
  const user = getEnv("SMTP_USER");
  const pass = getEnv("SMTP_PASS");

  if (!host || !user || !pass) {
    console.warn("SMTP settings missing. Falling back to Console mock transporter.");
    return {
      sendMail: async (options: any) => {
        console.log(`=== CRON MOCK EMAIL DISPATCH TO ${options.to} ===`);
        return { messageId: "cron-mock-id-" + Math.random() };
      },
    } as any;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Raw ICS File String Builder (same as api endpoint)
function generateIcs(event: any): string {
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

function emailTemplate(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { background-color: #0b0f19; color: #d1d5db; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 40px 30px; line-height: 1.6; }
          .footer { background-color: #0b0f19; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; }
          .button { display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-weight: 600; border-radius: 8px; margin: 20px 0; text-align: center; }
          a { color: #10b981; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>KAMADA</h1></div>
          <div class="content">${contentHtml}</div>
          <div class="footer">&copy; 2026 KAMADA Financial Blog. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;
}

export default async (req: Request) => {
  console.log("Starting event reminders check...");

  try {
    const transporter = getTransporter();
    const fromAddress = getEnv("SMTP_FROM") || `"KAMADA Team" <noreply@kamada.app>`;

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const in1h = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    // 1. Fetch registrations needing 24-hour reminders
    const { data: regs24h, error: err24h } = await supabaseAdmin
      .from("event_registrations")
      .select("id, user_id, event_id, events!inner(*), profiles(*)")
      .eq("status", "registered")
      .eq("reminder_sent_24h", false)
      .gt("events.start_time", nowIso)
      .lt("events.start_time", in24h);

    if (err24h) throw err24h;

    console.log(`Found ${regs24h?.length || 0} registrations for 24-hour reminders.`);

    for (const reg of regs24h || []) {
      const user = reg.profiles;
      const event = reg.events;
      if (!user?.email || !event) continue;

      const nameStr = user.first_name || "there";
      const localDate = new Date(event.start_time).toLocaleString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      });

      const html = emailTemplate(
        "Event Reminder",
        `
          <h2 style="color: #ffffff; font-size: 20px;">Hi ${nameStr},</h2>
          <p>This is a quick reminder that the event <strong>${event.title}</strong> is starting in 24 hours!</p>
          <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 20px; border-radius: 12px; margin: 25px 0;">
            <p style="margin: 6px 0;"><strong>Date & Time:</strong> ${localDate}</p>
            <p style="margin: 6px 0;"><strong>Location:</strong> ${event.location || "Online"}</p>
            ${
              event.virtual_lobby_url
                ? `<p style="margin: 6px 0;"><strong>Lobby Link:</strong> <a href="${event.virtual_lobby_url}">${event.virtual_lobby_url}</a></p>`
                : ""
            }
          </div>
          <p>An updated calendar file is attached if you need to add it to your agenda.</p>
          <div style="text-align: center;">
            <a href="https://kamad.netlify.app/events/${event.id}" class="button">Go to Event Page</a>
          </div>
        `
      );

      await transporter.sendMail({
        from: fromAddress,
        to: user.email,
        subject: `Reminder: ${event.title} is in 24 hours! ⏰`,
        html,
        attachments: [
          {
            filename: "event.ics",
            content: generateIcs(event),
            contentType: "text/calendar",
          },
        ],
      });

      // Update sent flag immediately
      await supabaseAdmin
        .from("event_registrations")
        .update({ reminder_sent_24h: true })
        .eq("id", reg.id);
    }

    // 2. Fetch registrations needing 1-hour reminders
    const { data: regs1h, error: err1h } = await supabaseAdmin
      .from("event_registrations")
      .select("id, user_id, event_id, events!inner(*), profiles(*)")
      .eq("status", "registered")
      .eq("reminder_sent_1h", false)
      .gt("events.start_time", nowIso)
      .lt("events.start_time", in1h);

    if (err1h) throw err1h;

    console.log(`Found ${regs1h?.length || 0} registrations for 1-hour reminders.`);

    for (const reg of regs1h || []) {
      const user = reg.profiles;
      const event = reg.events;
      if (!user?.email || !event) continue;

      const nameStr = user.first_name || "there";
      const html = emailTemplate(
        "Event Starting Soon",
        `
          <h2 style="color: #ffffff; font-size: 20px;">Hi ${nameStr},</h2>
          <p>Get ready! The event <strong>${event.title}</strong> starts in <strong>1 hour</strong>!</p>
          <div style="background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); padding: 20px; border-radius: 12px; margin: 25px 0;">
            <p style="margin: 6px 0;"><strong>Location:</strong> ${event.location || "Online"}</p>
            ${
              event.virtual_lobby_url
                ? `<p style="margin: 6px 0;"><strong>Lobby Link:</strong> <a href="${event.virtual_lobby_url}">${event.virtual_lobby_url}</a></p>`
                : ""
            }
          </div>
          ${
            event.virtual_lobby_url
              ? `<div style="text-align: center;"><a href="${event.virtual_lobby_url}" class="button">Join Lobby Now</a></div>`
              : `<div style="text-align: center;"><a href="https://kamad.netlify.app/events/${event.id}" class="button">Go to Event Page</a></div>`
          }
        `
      );

      await transporter.sendMail({
        from: fromAddress,
        to: user.email,
        subject: `Starting Soon: ${event.title} is in 1 hour! 🚀`,
        html,
      });

      // Update sent flag immediately
      await supabaseAdmin
        .from("event_registrations")
        .update({ reminder_sent_1h: true })
        .eq("id", reg.id);
    }

    return Response.json({ success: true, message: "Reminder check completed successfully." });
  } catch (error: any) {
    console.error("Error running event reminders cron:", error);
    return Response.json({ error: error.message || "Failed to process reminders" }, { status: 500 });
  }
};

// Netlify Cron Config: execute hourly
export const config: Config = {
  schedule: "@hourly",
};
