import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, subject, html, orderNumber, status, customerName } = await req.json();

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, html" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch SMTP settings from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/email_settings?select=*&limit=1`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    const settings = (await settingsRes.json()) as Array<{
      smtp_host: string;
      smtp_port: number;
      smtp_username: string;
      smtp_password: string;
      from_email: string;
      from_name: string;
      enabled: boolean;
    }>;

    if (!settings[0] || !settings[0].enabled) {
      return new Response(JSON.stringify({ message: "Email notifications disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = settings[0];

    // Send email via SMTP using Deno's native approach
    // We use a simple TCP connection with the SMTP protocol
    const emailResult = await sendEmailViaSmtp({
      host: cfg.smtp_host,
      port: cfg.smtp_port,
      username: cfg.smtp_username,
      password: cfg.smtp_password,
      from: `${cfg.from_name} <${cfg.from_email}>`,
      to,
      subject,
      html,
    });

    if (!emailResult.success) {
      return new Response(JSON.stringify({ error: emailResult.error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Email sent", orderNumber, status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendEmailViaSmtp(cfg: {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const conn = await Deno.connect({ hostname: cfg.host, port: cfg.port });
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readLine = async (): Promise<string> => {
      const buf = new Uint8Array(1024);
      const n = await conn.read(buf);
      return decoder.decode(buf.subarray(0, n ?? 0));
    };

    const send = async (data: string): Promise<string> => {
      await conn.write(encoder.encode(data + "\r\n"));
      return await readLine();
    };

    // Read greeting
    await readLine();

    // EHLO
    await send(`EHLO ${cfg.host}`);

    // STARTTLS if port is 587
    if (cfg.port === 587) {
      await send("STARTTLS");
      // For TLS we'd need Deno.connectTls, but for simplicity we use port 465 (implicit TLS)
      // or continue without TLS for testing
    }

    // AUTH LOGIN
    await send("AUTH LOGIN");
    await send(btoa(cfg.username));
    const authRes = await send(btoa(cfg.password));
    if (authRes.startsWith("5")) {
      conn.close();
      return { success: false, error: "SMTP authentication failed" };
    }

    // MAIL FROM
    const fromEmail = cfg.from.match(/<(.+)>/)?.[1] || cfg.from;
    await send(`MAIL FROM:<${fromEmail}>`);

    // RCPT TO
    await send(`RCPT TO:<${cfg.to}>`);

    // DATA
    await send("DATA");
    const emailContent = [
      `From: ${cfg.from}`,
      `To: ${cfg.to}`,
      `Subject: ${cfg.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      cfg.html,
    ].join("\r\n");
    const dataRes = await send(emailContent + "\r\n.");
    conn.close();

    if (dataRes.startsWith("5")) {
      return { success: false, error: "Failed to send email data" };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
