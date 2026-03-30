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
      class="min-h-screen bg-white"
      style={{ "font-family": "Inter, system-ui, sans-serif" }}
    >
      {/* ── Nav ── */}
      <nav
        class="sticky top-0 z-[100] w-full bg-white border-b border-[#E5E5E5]"
        style={{ height: "56px" }}
      >
        <div class="max-w-[1280px] mx-auto px-6 md:px-16 w-full h-full flex items-center">
          <a href="/" class="flex items-center">
            <Logo size="md" />
          </a>
          <a
            href="/"
            class="ml-auto text-[14px] text-[#808080] hover:text-[#0A0A0A] transition-colors duration-[80ms]"
          >
            Back to home
          </a>
        </div>
      </nav>

      {/* ── Content ── */}
      <section class="py-16 md:py-20 bg-white">
        <Container class="max-w-[800px]">
          <p
            class="text-[12px] uppercase tracking-[0.15em] text-[#1E3EA0] font-medium mb-3"
          >
            Legal
          </p>
          <h1
            class="text-[28px] md:text-[42px] font-bold text-[#0A0A0A] mb-3 leading-[1.15]"
            style={{ "letter-spacing": "-0.04em" }}
          >
            Privacy Policy
          </h1>
          <p class="text-[14px] text-[#808080] mb-12">
            Last updated: March 30, 2026
          </p>

          {/* ── Introduction ── */}
          <div class="flex flex-col" style={{ gap: "48px" }}>
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                1. Introduction
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                Contexter ("we", "us", "our") operates the contexter.cc website and
                the api.contexter.cc service (together, the "Service"). This Privacy
                Policy explains what personal data we collect, how we use it, and
                your rights regarding that data. We are committed to protecting your
                privacy and handling your data transparently.
              </p>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                By using the Service, you agree to the collection and use of
                information as described in this policy. If you do not agree, please
                do not use the Service.
              </p>
            </div>

            {/* ── Data We Collect ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                2. Data We Collect
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                We collect the minimum data necessary to operate the Service:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Account information:</strong> email address, display name,
                  and Google profile data (if you sign in via Google OAuth).
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Uploaded documents:</strong> files you upload to build your
                  knowledge base (PDFs, audio, images, text, and other formats).
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Query data:</strong> text of your search queries and API
                  requests sent to the Service.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Usage telemetry:</strong> IP address, timestamps, browser
                  user-agent, and request metadata for security and service
                  improvement.
                </li>
              </ul>
            </div>

            {/* ── How We Use Your Data ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                3. How We Use Your Data
              </h2>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Providing the Service:</strong> processing your documents
                  into a searchable knowledge base; executing queries against your
                  data; authenticating your account.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Security:</strong> detecting abuse, preventing
                  unauthorized access, and scanning for prompt injection patterns
                  (automated only; no human review of your content).
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Service improvement:</strong> aggregated, anonymized usage
                  statistics to understand performance and reliability.
                </li>
              </ul>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                We do <strong>not</strong> use your documents, queries, or any
                personal data to train machine learning models — neither our own nor
                those of our data processors.
              </p>
            </div>

            {/* ── Data Storage and Retention ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                4. Data Storage and Retention
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                Your data is stored in the European Union:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Database:</strong> PostgreSQL hosted on Hetzner in
                  Helsinki, Finland (EU).
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>File storage:</strong> Cloudflare R2, EU region.
                </li>
              </ul>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                Retention periods:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Account data:</strong> retained until you delete your
                  account.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Documents:</strong> retained until you delete them.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Query logs:</strong> retained for 90 days, then aggregated
                  into anonymous statistics.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Backups:</strong> 7-day rolling window; automatically
                  deleted after expiration.
                </li>
              </ul>
            </div>

            {/* ── Data Processors ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                5. Data Processors and Third Parties
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                To provide the Service, we share limited data with the following
                processors. None of them train models on your data:
              </p>
              <div class="border border-[#E5E5E5] overflow-x-auto">
                <table class="w-full text-[14px]">
                  <thead>
                    <tr class="border-b border-[#E5E5E5] bg-[#F9F9F9]">
                      <th class="text-left px-4 py-3 font-semibold text-[#0A0A0A]">Processor</th>
                      <th class="text-left px-4 py-3 font-semibold text-[#0A0A0A]">Location</th>
                      <th class="text-left px-4 py-3 font-semibold text-[#0A0A0A]">Purpose</th>
                      <th class="text-left px-4 py-3 font-semibold text-[#0A0A0A]">Data shared</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-[#E5E5E5]">
                      <td class="px-4 py-3 text-[#333]">Groq</td>
                      <td class="px-4 py-3 text-[#808080]">US</td>
                      <td class="px-4 py-3 text-[#808080]">LLM inference</td>
                      <td class="px-4 py-3 text-[#808080]">Text chunks as context for query answers</td>
                    </tr>
                    <tr class="border-b border-[#E5E5E5]">
                      <td class="px-4 py-3 text-[#333]">DeepInfra</td>
                      <td class="px-4 py-3 text-[#808080]">US</td>
                      <td class="px-4 py-3 text-[#808080]">LLM inference (fallback)</td>
                      <td class="px-4 py-3 text-[#808080]">Text chunks as context for query answers</td>
                    </tr>
                    <tr class="border-b border-[#E5E5E5]">
                      <td class="px-4 py-3 text-[#333]">Jina AI</td>
                      <td class="px-4 py-3 text-[#808080]">Germany</td>
                      <td class="px-4 py-3 text-[#808080]">Text embeddings</td>
                      <td class="px-4 py-3 text-[#808080]">Document text for vector generation</td>
                    </tr>
                    <tr class="border-b border-[#E5E5E5]">
                      <td class="px-4 py-3 text-[#333]">Cloudflare</td>
                      <td class="px-4 py-3 text-[#808080]">US (CDN global)</td>
                      <td class="px-4 py-3 text-[#808080]">CDN, file storage (R2), DNS</td>
                      <td class="px-4 py-3 text-[#808080]">Uploaded files, web traffic metadata</td>
                    </tr>
                    <tr class="border-b border-[#E5E5E5]">
                      <td class="px-4 py-3 text-[#333]">Hetzner</td>
                      <td class="px-4 py-3 text-[#808080]">Germany / Finland</td>
                      <td class="px-4 py-3 text-[#808080]">Server infrastructure</td>
                      <td class="px-4 py-3 text-[#808080]">All application data (database)</td>
                    </tr>
                    <tr>
                      <td class="px-4 py-3 text-[#333]">NOWPayments</td>
                      <td class="px-4 py-3 text-[#808080]">International</td>
                      <td class="px-4 py-3 text-[#808080]">Crypto payment processing</td>
                      <td class="px-4 py-3 text-[#808080]">Payment amount, wallet address, order ID</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Cross-Border Transfers ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                6. Cross-Border Data Transfers
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
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
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                7. Cookies and Tracking
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                We do <strong>not</strong> use cookies for tracking or advertising.
                The Service uses:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Bearer token authentication:</strong> stored in your
                  browser's local storage for API access.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Google OAuth session cookie:</strong> a strictly necessary
                  cookie used only during the sign-in flow.
                </li>
              </ul>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                No analytics trackers, no advertising pixels, no fingerprinting.
              </p>
            </div>

            {/* ── Your Rights ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                8. Your Rights (GDPR)
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                Regardless of where you are located, we extend the following rights
                to all users:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Access:</strong> request a copy of all personal data we
                  hold about you.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Rectification:</strong> correct inaccurate personal data.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Erasure:</strong> delete your account and all associated
                  data. You can also delete individual documents at any time through
                  the dashboard.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Data portability:</strong> export your documents and data
                  in a machine-readable format.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Objection:</strong> object to processing of your data for
                  specific purposes.
                </li>
                <li class="text-[15px] text-[#333] leading-[1.7]">
                  <strong>Restriction:</strong> request that we limit how we process
                  your data.
                </li>
              </ul>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:nopoint@contexter.cc"
                  class="text-[#1E3EA0] hover:underline"
                >
                  nopoint@contexter.cc
                </a>
                . We will respond within 30 days.
              </p>
            </div>

            {/* ── Content Filtering ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                9. Content Filtering
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                We perform automated scanning of uploaded content and queries for
                prompt injection patterns and other abuse vectors. This filtering is
                entirely automated — no human reviews your documents or queries.
                Content that triggers safety filters may be rejected with an error
                message.
              </p>
            </div>

            {/* ── Data Security ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                10. Data Security
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                We implement industry-standard security measures including
                encryption in transit (TLS), access controls, and regular security
                reviews. However, no method of electronic storage or transmission is
                100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            {/* ── Children ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                11. Children's Privacy
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                The Service is not intended for children under 16. We do not
                knowingly collect personal data from children. If you believe a child
                has provided us with personal data, please contact us and we will
                delete it promptly.
              </p>
            </div>

            {/* ── Changes ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                12. Changes to This Policy
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                We may update this Privacy Policy from time to time. We will notify
                you of material changes by posting the updated policy on this page
                and updating the "Last updated" date. Your continued use of the
                Service after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* ── Contact ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-[#0A0A0A]">
                13. Contact
              </h2>
              <p class="text-[15px] text-[#333] leading-[1.7]">
                For questions about this Privacy Policy or to exercise your data
                rights, contact us at:{" "}
                <a
                  href="mailto:nopoint@contexter.cc"
                  class="text-[#1E3EA0] hover:underline"
                >
                  nopoint@contexter.cc
                </a>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0A0A0A", "border-top": "1px solid #1A1A1A" }}>
        <div class="max-w-[1280px] mx-auto px-6 md:px-16 py-10 md:py-12">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between" style={{ gap: "16px" }}>
            <div class="flex items-center" style={{ gap: "16px" }}>
              <Logo size="md" variant="inverted" />
              <span class="text-[12px] text-[#444]">
                © 2026 Contexter
              </span>
            </div>
            <div class="flex items-center" style={{ gap: "24px" }}>
              <a
                href="/privacy"
                class="text-[13px] text-[#808080] hover:text-white transition-colors duration-[80ms]"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                class="text-[13px] text-[#808080] hover:text-white transition-colors duration-[80ms]"
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
