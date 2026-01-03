import { createClient } from '@supabase/supabase-js';

// Replace with your project details
const SUPABASE_URL = 'https://qwzowpunfziersklxrpv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Test Payload
const payload = {
    record: {
        unit: 'Objetivo Teste',
        local: 'Sala de Teste',
        booking_date: '03/01/2026',
        start_time: '12:00',
        end_time: '13:00',
        observations: 'Teste Manual de Email',
        user_id: 'test-user'
    }
};

async function testFunction() {
    if (!SUPABASE_ANON_KEY) {
        console.error("Please set SUPABASE_ANON_KEY env var");
        return;
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log("Invoking function 'send-new-booking-email'...");

    const { data, error } = await supabase.functions.invoke('send-new-booking-email', {
        body: payload
    });

    if (error) {
        console.error("Function Error:", error);
    } else {
        console.log("Function Response:", data);
    }
}

testFunction();
