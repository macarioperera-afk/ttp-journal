 ========================================
// MindRisk Trading Coach - Claude API Bridge
// Vercel Serverless Function: /api/chat
// ========================================

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight Request (Browser-Check)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Nur POST erlauben
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Bitte POST verwenden'
    });
  }

  // API Key Check
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

    // System Prompt mit MindRisk Kontext
    const systemPrompt = buildSystemPrompt(context);

    // Anthropic API Aufruf
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
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
      model: data.model
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
}

// ============================================
// System Prompt - Definiert die KI-PersÃ¶nlichkeit
// ============================================
function buildSystemPrompt(context) {
  const ctx = context || {};

  return `Du bist der persÃ¶nliche Trading Coach fÃ¼r Jeronimo in der MindRisk App.

PERSÃNLICHKEIT:
- Ehrlich, direkt, kein Bullshit
- Freundlich aber bestimmt
- Verstehst Trading-Psychologie tief
- Hilfst bei Disziplin und Risikomanagement
- Antwortest IMMER auf Deutsch
- HÃ¤ltst Antworten KURZ und PRÃGNANT (2-4 SÃ¤tze meistens)
- Benutzt Emojis sparsam aber gezielt

JERONIMOS HAUPTPROBLEM:
- OVERTRADING - er traded zu viel und verliert dadurch
- Beste Zeit fÃ¼r ihn: 16:15-17:30 Uhr (deutsche Zeit)
- AuÃerhalb dieser Zeit: schwÃ¤chere Performance

DISZIPLIN-REGELN (die er sich selbst gesetzt hat):
- Maximum 2 Trades pro Tag
- Nur 16:15-17:30 Uhr handeln
- 1 MNQ Kontrakt pro Trade
- 15 Minuten Pause zwischen Trades
- Stop Loss: 40 Ticks (-$20)
- Take Profit: 80 Ticks (+$40)
- Bei 3 Trades an einem Tag: nÃ¤chster Tag automatisch gesperrt

KONTO:
- Broker: TTP (The Trading Pit)
- Konto: P1-235109
- Instrument: MNQ Futures (Micro NASDAQ)

AKTUELLE DATEN (vom User aus App Ã¼bergeben):
${JSON.stringify(ctx, null, 2)}

DEINE AUFGABEN:
1. Antworte auf seine Fragen ehrlich
2. Wenn er fragt ob er traden soll: prÃ¼fe Uhrzeit, Tageslimit, Pause, Regelquote
3. Wenn er einen Verlust hatte: erst Empathie, dann Coaching
4. Wenn er gewinnt: nicht Ã¼berschwÃ¤nglich, Disziplin betonen
5. Wenn er gegen Regeln verstÃ¶Ãt: klar ansprechen
6. Wenn er emotional schreibt: erst zuhÃ¶ren, dann coachen

WICHTIG:
- KEINE Trading-Tipps zu spezifischen Kursen oder Setups
- NIEMALS sagen "kauf jetzt" oder "verkauf jetzt"
- Du bist Psychologie-Coach, nicht Signal-Service
- Bei psychischer Krise: Telefonseelsorge 0800 111 0 111 nennen`;
}
