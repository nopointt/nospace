interface ConsentPageParams {
  clientId: string;
  scopes: string[];
  userEmail: string;
}

const scopeLabels: Record<string, string> = {
  "knowledge:read": "Чтение базы знаний",
  "knowledge:write": "Запись в базу знаний",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderConsentPage(params: ConsentPageParams): string {
  const { clientId, scopes, userEmail } = params;

  const scopesHtml = scopes
    .map(
      (scope) => `
        <li class="scope-item">
          <span class="checkmark">✓</span>
          <span class="scope-label">${escapeHtml(scopeLabels[scope] || scope)}</span>
        </li>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Запрос доступа — Harkly</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #FFFAF5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .card {
      background: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      max-width: 480px;
      width: 100%;
      padding: 32px 24px;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #1C1C1C;
      margin-bottom: 24px;
      text-align: center;
    }

    .heading {
      font-size: 20px;
      font-weight: 600;
      color: #1C1C1C;
      margin-bottom: 8px;
      text-align: center;
    }

    .subheading {
      font-size: 14px;
      color: #6B6B6B;
      margin-bottom: 24px;
      text-align: center;
    }

    .scopes-list {
      list-style: none;
      background: #FFFAF5;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .scope-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      font-size: 14px;
      color: #1C1C1C;
    }

    .scope-item:not(:last-child) {
      border-bottom: 1px solid #FFE8D6;
    }

    .checkmark {
      color: #FF8C42;
      font-weight: 700;
      flex-shrink: 0;
    }

    .scope-label {
      flex: 1;
    }

    .buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .btn {
      width: 100%;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity 0.2s ease;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .btn-primary {
      background-color: #FF8C42;
      color: #FFFFFF;
    }

    .btn-secondary {
      background-color: transparent;
      color: #1C1C1C;
      border: 2px solid #E0E0E0;
    }

    @media (min-width: 480px) {
      .buttons {
        flex-direction: row;
      }

      .btn-primary {
        flex: 1;
      }

      .btn-secondary {
        flex: 1;
      }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Harkly</div>
    <h1 class="heading">${escapeHtml(clientId)} запрашивает доступ</h1>
    <p class="subheading">к вашей базе знаний (${escapeHtml(userEmail)})</p>

    <ul class="scopes-list">
      ${scopesHtml}
    </ul>

    <form id="consent-form" action="/authorize/confirm" method="POST">
      <input type="hidden" name="action" id="action-input" value="">
      <div class="buttons">
        <button type="button" class="btn btn-primary" onclick="submitForm('approve')">Разрешить</button>
        <button type="button" class="btn btn-secondary" onclick="submitForm('deny')">Отклонить</button>
      </div>
    </form>
  </div>

  <script>
    function submitForm(action) {
      document.getElementById('action-input').value = action;
      document.getElementById('consent-form').submit();
    }
  </script>
</body>
</html>
  `.trim();
}
