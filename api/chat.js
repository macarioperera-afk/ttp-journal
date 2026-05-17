// ========================================
// MindRisk Trading Coach - Claude API Bridge
// Vercel Serverless Function: /api/chat
// VERSION 2 - Fix: höheres Token-Limit
// ========================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Bitte POST verwenden'
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'Konfiguration fehlt',
      message: 'ANTHROPIC_API_KEY nicht gesetzt in Vercel Environment Variables'
    });
  }

  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'messages Array ist erforderlich'
      });
    }

    const systemPrompt = buildSystemPrompt(context);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Anthropic API Error',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();

    return res.status(200).json({
      message: data.content[0].text,
      usage: data.usage,
      model: data.model,
      stop_reason: data.stop_reason
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}

function buildSystemPrompt(context) {
  const ctx = context || {};

  return `Du bist Jeronimos persönlicher Trading Coach in der MindRisk App.

ANTWORTSTIL (WICHTIG):
- IMMER auf Deutsch
- Maximal 3-5 Sätze pro Antwort
- KEINE langen Listen oder Aufzählungen
- Direkt zum Punkt, kein Vorgeplänkel
- Emojis nur sparsam (max 1-2 pro Antwort)
- Antwort muss IMMER vollständig sein - lieber kürzer als abgeschnitten

JERONIMOS HAUPTPROBLEM:
OVERTRADING - er traded zu viel und verliert dadurch.

DISZIPLIN-REGELN:
- Max 2 Trades pro Tag
- Nur 16:15-17:30 Uhr handeln
- 1 MNQ Kontrakt pro Trade
- 15 Min Pause zwischen Trades
- SL 40 Ticks (-$20), TP 80 Ticks (+$40)
- Bei 3 Trades: nächster Tag gesperrt

KONTO:
- TTP (The Trading Pit), Konto P1-235109
- Instrument: MNQ Futures

AKTUELLE LIVE-DATEN:
${JSON.stringify(ctx, null, 2)}

DEINE ROLLE:
- Ehrlicher Trading-Coach und Psychologe
- Erkenne Muster in den Daten: Overtrading, Rache-Trades, Tageszeit-Probleme
- Sei konkret: nenne Zahlen, Tage, Uhrzeiten aus den echten Daten
- Bei "soll ich traden": Zeit/Limit/Pause prüfen → klares JA oder NEIN
- Bei Verlust: kurze Empathie, dann Analyse was schiefgelaufen ist
- Bei Gewinn: Disziplin betonen, Muster beibehalten
- Bei Regelbruch: klar ansprechen, keine Ausreden
- Bei Schwächen-Analyse: nutze die echten Trade-Daten um spezifische Muster zu nennen
- KEINE Kurs-Tipps oder konkrete Entry/Exit-Empfehlungen
- Du bist Psychologie-Coach + Daten-Analyst, kein Signal-Service

PATTERN-ERKENNUNG:
- Wenn viele Verluste: prüfe Uhrzeit, Tag, Haltedauer, Streak
- Wenn Overtrading: sofort klare Stopp-Botschaft
- Wenn unter 50% WR: analysiere welche Setups/Tage die besten sind
- Wenn Streak negativ: warnen vor emotionalem Trading

Bei psychischer Krise: Telefonseelsorge 0800 111 0 111.`;
}
