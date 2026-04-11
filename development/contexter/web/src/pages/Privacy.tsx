import type { Component } from "solid-js"
import Logo from "../components/Logo"

const Container: Component<{ class?: string; children: any }> = (props) => (
  <div class={`max-w-[1280px] mx-auto px-6 md:px-16 ${props.class ?? ""}`}>
    {props.children}
  </div>
)

const Privacy: Component = () => {
  return (
    <div
      class="min-h-screen bg-bg-canvas"
    >
      {/* ── Nav ── */}
      <nav
        class="sticky top-0 z-[100] w-full bg-bg-canvas border-b border-border-subtle"
        style={{ height: "56px" }}
      >
        <div class="max-w-[1280px] mx-auto px-6 md:px-16 w-full h-full flex items-center">
          <a href="/" class="flex items-center">
            <Logo size="md" />
          </a>
          <a
            href="/"
            class="ml-auto text-[14px] text-text-tertiary hover:text-text-primary transition-colors duration-[80ms]"
          >
            Back to home
          </a>
        </div>
      </nav>

      {/* ── Content ── */}
      <section class="py-16 md:py-20 bg-bg-canvas">
        <Container class="max-w-[800px]">
          <p
            class="text-[12px] uppercase tracking-[0.15em] text-accent font-medium mb-3"
          >
            Legal
          </p>
          <h1
            class="text-[32px] md:text-[48px] font-bold text-black mb-3 leading-[1.2]"
            style={{ "letter-spacing": "-0.04em" }}
          >
            Privacy Policy
          </h1>
          <p class="text-[14px] text-text-tertiary mb-12">
            Last updated: March 30, 2026
          </p>

          {/* ── Introduction ── */}
          <div class="flex flex-col" style={{ gap: "48px" }}>
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                1. Introduction
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Contexter ("we", "us", "our") operates the contexter.cc website and
                the api.contexter.cc service (together, the "Service"). This Privacy
                Policy explains what personal data we collect, how we use it, and
                your rights regarding that data. We are committed to protecting your
                privacy and handling your data transparently.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                By using the Service, you agree to the collection and use of
                information as described in this policy. If you do not agree, please
                do not use the Service.
              </p>
            </div>

            {/* ── Data We Collect ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                2. Data We Collect
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We collect the minimum data necessary to operate the Service:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Account information:</strong> email address, display name,
                  and Google profile data (if you sign in via Google OAuth).
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Uploaded documents:</strong> files you upload to build your
                  knowledge base (PDFs, audio, images, text, and other formats).
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Query data:</strong> text of your search queries and API
                  requests sent to the Service.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Usage telemetry:</strong> IP address, timestamps, browser
                  user-agent, and request metadata for security and service
                  improvement.
                </li>
              </ul>
            </div>

            {/* ── How We Use Your Data ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                3. How We Use Your Data
              </h2>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Providing the Service:</strong> processing your documents
                  into a searchable knowledge base; executing queries against your
                  data; authenticating your account.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Security:</strong> detecting abuse, preventing
                  unauthorized access, and scanning for prompt injection patterns
                  (automated only; no human review of your content).
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Service improvement:</strong> aggregated, anonymized usage
                  statistics to understand performance and reliability.
                </li>
              </ul>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We do <strong>not</strong> use your documents, queries, or any
                personal data to train machine learning models — neither our own nor
                those of our data processors.
              </p>
            </div>

            {/* ── Data Storage and Retention ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                4. Data Storage and Retention
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Your data is stored in the European Union:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Database:</strong> PostgreSQL hosted on Hetzner in
                  Helsinki, Finland (EU).
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>File storage:</strong> Cloudflare R2, EU region.
                </li>
              </ul>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Retention periods:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Account data:</strong> retained until you delete your
                  account.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Documents:</strong> retained until you delete them.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Query logs:</strong> retained for 90 days, then aggregated
                  into anonymous statistics.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Backups:</strong> 7-day rolling window; automatically
                  deleted after expiration.
                </li>
              </ul>
            </div>

            {/* ── Data Processors ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                5. Data Processors and Third Parties
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                To provide the Service, we share limited data with the following
                processors. None of them train models on your data:
              </p>
              <div class="border border-border-subtle overflow-x-auto">
                <table class="w-full text-[14px]">
                  <thead>
                    <tr class="border-b border-border-subtle bg-bg-canvas">
                      <th class="text-left px-4 py-3 font-bold text-black">Processor</th>
                      <th class="text-left px-4 py-3 font-bold text-black">Location</th>
                      <th class="text-left px-4 py-3 font-bold text-black">Purpose</th>
                      <th class="text-left px-4 py-3 font-bold text-black">Data shared</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-border-subtle">
                      <td class="px-4 py-3 text-text-secondary">Groq</td>
                      <td class="px-4 py-3 text-text-tertiary">US</td>
                      <td class="px-4 py-3 text-text-tertiary">LLM inference</td>
                      <td class="px-4 py-3 text-text-tertiary">Text chunks as context for query answers</td>
                    </tr>
                    <tr class="border-b border-border-subtle">
                      <td class="px-4 py-3 text-text-secondary">DeepInfra</td>
                      <td class="px-4 py-3 text-text-tertiary">US</td>
                      <td class="px-4 py-3 text-text-tertiary">LLM inference (fallback)</td>
                      <td class="px-4 py-3 text-text-tertiary">Text chunks as context for query answers</td>
                    </tr>
                    <tr class="border-b border-border-subtle">
                      <td class="px-4 py-3 text-text-secondary">Jina AI</td>
                      <td class="px-4 py-3 text-text-tertiary">Germany</td>
                      <td class="px-4 py-3 text-text-tertiary">Text embeddings</td>
                      <td class="px-4 py-3 text-text-tertiary">Document text for vector generation</td>
                    </tr>
                    <tr class="border-b border-border-subtle">
                      <td class="px-4 py-3 text-text-secondary">Cloudflare</td>
                      <td class="px-4 py-3 text-text-tertiary">US (CDN global)</td>
                      <td class="px-4 py-3 text-text-tertiary">CDN, file storage (R2), DNS</td>
                      <td class="px-4 py-3 text-text-tertiary">Uploaded files, web traffic metadata</td>
                    </tr>
                    <tr class="border-b border-border-subtle">
                      <td class="px-4 py-3 text-text-secondary">Hetzner</td>
                      <td class="px-4 py-3 text-text-tertiary">Germany / Finland</td>
                      <td class="px-4 py-3 text-text-tertiary">Server infrastructure</td>
                      <td class="px-4 py-3 text-text-tertiary">All application data (database)</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-text-secondary">NOWPayments</td>
                      <td class="px-4 py-3 text-text-tertiary">International</td>
                      <td class="px-4 py-3 text-text-tertiary">Crypto payment processing</td>
                      <td class="px-4 py-3 text-text-tertiary">Payment amount, wallet address, order ID</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Cross-Border Transfers ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                6. Cross-Border Data Transfers
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Your primary data resides in the EU (Finland). When you execute
                queries, text fragments may be sent to LLM providers in the United
                States (Groq, DeepInfra) for inference. These transfers are
                protected by Standard Contractual Clauses (SCCs) and the providers'
                data processing agreements, which contractually prohibit using your
                data for model training.
              </p>
            </div>

            {/* ── Cookies and Tracking ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                7. Cookies and Tracking
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We do <strong>not</strong> use cookies for tracking or advertising.
                The Service uses:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Bearer token authentication:</strong> stored in your
                  browser's local storage for API access.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Google OAuth session cookie:</strong> a strictly necessary
                  cookie used only during the sign-in flow.
                </li>
              </ul>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                No analytics trackers, no advertising pixels, no fingerprinting.
              </p>
            </div>

            {/* ── Your Rights ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                8. Your Rights (GDPR)
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Regardless of where you are located, we extend the following rights
                to all users:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Access:</strong> request a copy of all personal data we
                  hold about you.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Rectification:</strong> correct inaccurate personal data.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Erasure:</strong> delete your account and all associated
                  data. You can also delete individual documents at any time through
                  the dashboard.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Data portability:</strong> export your documents and data
                  in a machine-readable format.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Objection:</strong> object to processing of your data for
                  specific purposes.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  <strong>Restriction:</strong> request that we limit how we process
                  your data.
                </li>
              </ul>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:nopoint@contexter.cc"
                  class="text-accent hover:underline"
                >
                  nopoint@contexter.cc
                </a>
                . We will respond within 30 days.
              </p>
            </div>

            {/* ── Content Filtering ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                9. Content Filtering
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We perform automated scanning of uploaded content and queries for
                prompt injection patterns and other abuse vectors. This filtering is
                entirely automated — no human reviews your documents or queries.
                Content that triggers safety filters may be rejected with an error
                message.
              </p>
            </div>

            {/* ── Data Security ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                10. Data Security
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We implement industry-standard security measures including
                encryption in transit (TLS), access controls, and regular security
                reviews. However, no method of electronic storage or transmission is
                100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            {/* ── Children ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                11. Children's Privacy
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                The Service is not intended for children under 16. We do not
                knowingly collect personal data from children. If you believe a child
                has provided us with personal data, please contact us and we will
                delete it promptly.
              </p>
            </div>

            {/* ── Changes ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                12. Changes to This Policy
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We may update this Privacy Policy from time to time. We will notify
                you of material changes by posting the updated policy on this page
                and updating the "Last updated" date. Your continued use of the
                Service after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* ── Contact ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                13. Contact
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                For questions about this Privacy Policy or to exercise your data
                rights, contact us at:{" "}
                <a
                  href="mailto:nopoint@contexter.cc"
                  class="text-accent hover:underline"
                >
                  nopoint@contexter.cc
                </a>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Footer ── */}
      <footer class="bg-black border-t border-black">
        <div class="max-w-[1280px] mx-auto px-6 md:px-16 py-10 md:py-12">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between" style={{ gap: "16px" }}>
            <div class="flex items-center" style={{ gap: "16px" }}>
              <Logo size="md" variant="inverted" />
              <span class="text-[12px] text-text-tertiary">
                © 2026 Contexter
              </span>
            </div>
            <div class="flex items-center" style={{ gap: "24px" }}>
              <a
                href="/privacy"
                class="text-[12px] text-text-tertiary hover:text-white transition-colors duration-[80ms]"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                class="text-[12px] text-text-tertiary hover:text-white transition-colors duration-[80ms]"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Privacy
