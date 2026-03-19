function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderLoginPage(nextUrl: string): string {
  const escapedNextUrl = escapeHtml(nextUrl);

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход — Harkly</title>
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
      max-width: 400px;
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
      margin-bottom: 24px;
      text-align: center;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #1C1C1C;
      margin-bottom: 6px;
    }

    .form-group input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #E0E0E0;
      border-radius: 12px;
      font-size: 16px;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: #FF8C42;
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
      margin-top: 8px;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .btn-primary {
      background-color: #FF8C42;
      color: #FFFFFF;
    }

    .error-message {
      background-color: #FFF0F0;
      border: 1px solid #FFCCCC;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #D32F2F;
      display: none;
    }

    .toggle-link {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #6B6B6B;
    }

    .toggle-link a {
      color: #FF8C42;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
    }

    .toggle-link a:hover {
      text-decoration: underline;
    }

    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Harkly</div>
    <h1 class="heading">Войти в Harkly</h1>

    <div id="error-message" class="error-message"></div>

    <!-- Login Form -->
    <form id="login-form">
      <div class="form-group">
        <label for="login-email">Email</label>
        <input type="email" id="login-email" name="email" required autocomplete="email">
      </div>
      <div class="form-group">
        <label for="login-password">Пароль</label>
        <input type="password" id="login-password" name="password" required autocomplete="current-password">
      </div>
      <button type="submit" class="btn btn-primary">Войти</button>
    </form>

    <!-- Signup Form -->
    <form id="signup-form" class="hidden">
      <div class="form-group">
        <label for="signup-name">Имя</label>
        <input type="text" id="signup-name" name="name" required autocomplete="name">
      </div>
      <div class="form-group">
        <label for="signup-email">Email</label>
        <input type="email" id="signup-email" name="email" required autocomplete="email">
      </div>
      <div class="form-group">
        <label for="signup-password">Пароль</label>
        <input type="password" id="signup-password" name="password" required autocomplete="new-password">
      </div>
      <button type="submit" class="btn btn-primary">Создать аккаунт</button>
    </form>

    <div class="toggle-link">
      <span id="toggle-text">Нет аккаунта?</span>
      <a id="toggle-link" onclick="toggleForm()">Создать</a>
    </div>
  </div>

  <script>
    const nextUrl = '${escapedNextUrl}';
    let isLoginMode = true;

    function toggleForm() {
      isLoginMode = !isLoginMode;
      const loginForm = document.getElementById('login-form');
      const signupForm = document.getElementById('signup-form');
      const toggleText = document.getElementById('toggle-text');
      const toggleLink = document.getElementById('toggle-link');

      if (isLoginMode) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        toggleText.textContent = 'Нет аккаунта?';
        toggleLink.textContent = 'Создать';
      } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        toggleText.textContent = 'Уже есть аккаунт?';
        toggleLink.textContent = 'Войти';
      }

      hideError();
    }

    function showError(message) {
      const errorEl = document.getElementById('error-message');
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }

    function hideError() {
      const errorEl = document.getElementById('error-message');
      errorEl.style.display = 'none';
    }

    document.getElementById('login-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      hideError();

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const response = await fetch('/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          window.location.href = nextUrl;
        } else {
          showError(data.error || 'Ошибка входа');
        }
      } catch (err) {
        showError('Ошибка соединения. Попробуйте снова.');
      }
    });

    document.getElementById('signup-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      hideError();

      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      try {
        const response = await fetch('/api/auth/sign-up/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
          window.location.href = nextUrl;
        } else {
          showError(data.error || 'Ошибка регистрации');
        }
      } catch (err) {
        showError('Ошибка соединения. Попробуйте снова.');
      }
    });
  </script>
</body>
</html>
  `.trim();
}
