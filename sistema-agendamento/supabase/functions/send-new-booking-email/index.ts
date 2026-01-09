import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRecord {
    unit: string;
    local: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    observations: string;
    user_id: string;
}

interface RequestBody {
    record: BookingRecord;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { record } = await req.json() as RequestBody;

        console.log("New booking received:", record);

        // 1. Fetch Admin Settings for the Unit
        // Filter by the unit name provided in the booking record
        const { data: settingsData, error: settingsError } = await supabase
            .from("settings")
            .select("notification_email, notification_email_enabled")
            .eq("unit", record.unit)
            .single();

        if (settingsError) {
            console.warn("Could not fetch settings:", settingsError);
        }

        const { notification_email, notification_email_enabled } = settingsData || {};

        // 2. In-App Notification is now handled by a Database Trigger.
        // We skip manual insertion here to avoid duplicates.
        // const message = ... (logic moved to DB trigger)


        // 3. Send Email if Enabled
        let emailSent = false;
        if (notification_email_enabled && notification_email && RESEND_API_KEY) {
            console.log(`Sending email to ${notification_email}...`);

            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "Agendamentos <onboarding@resend.dev>", // Or verified domain
                    to: [notification_email],
                    subject: `Novo Agendamento: ${record.unit} - ${record.local}`,
                    html: `
            <h1>Novo Agendamento Confirmado</h1>
            <p><strong>Unidade:</strong> ${record.unit}</p>
            <p><strong>Local:</strong> ${record.local}</p>
            <p><strong>Data:</strong> ${record.booking_date}</p>
            <p><strong>Horário:</strong> ${record.start_time} - ${record.end_time}</p>
            <p><strong>Observações:</strong> ${record.observations || "Nenhuma"}</p>
            <br/>
            <a href="https://objetivoportal.com.br/admin">Acessar Painel Admin</a>
          `,
                }),
            });

            if (!res.ok) {
                console.error("Resend API Error:", data);
                return new Response(JSON.stringify({ error: "Resend Error", details: data }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            } else {
                console.log("Email sent successfully:", data);
                emailSent = true;
            }
        } else {
            console.log("Email sending skipped...");
            if (notification_email_enabled && (!notification_email || !RESEND_API_KEY)) {
                return new Response(JSON.stringify({ error: "Configuration Missing", details: "Email enabled but missing email or API Key" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 400,
                });
            }
        }

        return new Response(JSON.stringify({ success: true, emailSent }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
