import type { Component } from "solid-js"
import Logo from "../components/Logo"

const Container: Component<{ class?: string; children: any }> = (props) => (
  <div class={`max-w-[1280px] mx-auto px-6 md:px-16 ${props.class ?? ""}`}>
    {props.children}
  </div>
)

const Terms: Component = () => {
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
            Terms of Service
          </h1>
          <p class="text-[14px] text-text-tertiary mb-12">
            Last updated: April 11, 2026
          </p>

          <div class="flex flex-col" style={{ gap: "48px" }}>
            {/* ── Agreement ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                1. Agreement to Terms
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                These Terms of Service ("Terms") govern your use of Contexter,
                operated at contexter.cc and api.contexter.cc (the "Service"). By
                creating an account or using the Service, you agree to these Terms.
                If you do not agree, do not use the Service.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                You must be at least 16 years old to use the Service. By using it,
                you represent that you meet this requirement.
              </p>
            </div>

            {/* ── The Service ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                2. The Service
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Contexter is a RAG-as-a-service platform. You upload documents, and
                Contexter processes them into a knowledge base that you can query via
                API, MCP (Model Context Protocol), or our web interface. The Service
                enables AI assistants to access your documents as context when
                answering your questions.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Answers generated through the Service are{" "}
                <strong>informational only</strong>. They are produced by
                third-party language models using your uploaded context and should
                not be relied upon as professional, legal, medical, or financial
                advice. You are responsible for verifying any information before
                acting on it.
              </p>
            </div>

            {/* ── Accounts ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                3. Accounts
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                You are responsible for maintaining the security of your account
                credentials, API tokens, and share links. You are responsible for
                all activity that occurs under your account. Notify us immediately at{" "}
                <a
                  href="mailto:nopoint@contexter.cc"
                  class="text-accent hover:underline"
                >
                  nopoint@contexter.cc
                </a>{" "}
                if you suspect unauthorized access.
              </p>
            </div>

            {/* ── Intellectual Property ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                4. Your Content and Intellectual Property
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                You retain full ownership of all documents and data you upload to the
                Service ("Your Content"). By uploading content, you grant Contexter
                a limited, non-exclusive license to process, store, and transmit
                Your Content solely for the purpose of providing the Service to you.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                <strong>
                  We do not train any machine learning models on Your Content.
                </strong>{" "}
                Neither Contexter nor our data processors (Groq, DeepInfra, Jina AI)
                use Your Content for model training. Your data is used exclusively
                to serve your queries.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                You represent that you have the necessary rights to upload Your
                Content and that it does not infringe on any third party's
                intellectual property or other rights.
              </p>
            </div>

            {/* ── Acceptable Use ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                5. Acceptable Use
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                You agree not to use the Service to:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Upload, store, or distribute illegal content in any jurisdiction.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Upload malware, viruses, or any harmful code.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Upload personally identifiable information (PII) of third parties
                  without their explicit consent.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Attempt to bypass rate limits, access controls, or content
                  filtering mechanisms.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Use the Service in ways that could damage, disable, or impair it
                  for other users.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Reverse-engineer, decompile, or attempt to extract the source code
                  of the Service.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Resell or sublicense access to the Service without written
                  permission.
                </li>
              </ul>
            </div>

            {/* ── Billing ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                6. Billing and Payments
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                The Service offers both free and paid tiers. Paid plans are prepaid
                via cryptocurrency through NOWPayments. By making a payment, you
                acknowledge and agree to the following:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  All cryptocurrency payments are <strong>final and non-refundable</strong> due to
                  the nature of blockchain transactions.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Credits are applied to your account upon payment confirmation and
                  do not expire.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Pricing may change with 30 days' notice. Existing prepaid credits
                  will be honored at the rate at which they were purchased.
                </li>
              </ul>
            </div>

            {/* ── Supporter Program and Loyalty Tokens ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                7. Supporter Program and Loyalty Tokens
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Contexter operates a Supporter Program limited to 100 lifetime
                spots. Participants receive loyalty tokens based on their
                contributions, tier-based multipliers on subscription payments,
                and may receive quarterly revenue share distributions once our
                monthly recurring revenue exceeds a threshold documented on the
                Supporters page.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                <strong>
                  Loyalty tokens earned through the Supporter Program are not a
                  security, equity, investment, currency, or financial instrument
                  of any kind.
                </strong>{" "}
                They are non-transferable loyalty points with no monetary value.
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Tokens cannot be exchanged for cash, cryptocurrency, bank
                  transfer, or any other asset outside the Service.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Tokens carry no redemption guarantee and may be modified,
                  capped, expired, or forfeited at our discretion in accordance
                  with the rules published on our Supporters page.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Tokens expire after 12 months of account inactivity.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Tokens are subject to forfeiture upon entry into <em>exiting</em>{" "}
                  status (triggered by sustained inactivity) or upon voluntary
                  account deletion.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Tokens used to pay for subscriptions or features do not
                  generate further tokens (anti-circular rule).
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Tokens earned through admin-reviewed tasks are capped at 50
                  tokens per calendar month per user.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Tokens earned through subscription payments may be placed on
                  a 14-day hold before becoming eligible for revenue share
                  distribution, to accommodate potential refunds or chargebacks.
                </li>
              </ul>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Payment to join the Supporter Program is governed by Section 6
                (Billing and Payments) and is final and non-refundable once
                processed. Revenue share distributions, when activated, are paid
                out as additional loyalty tokens and remain subject to all
                restrictions in this Section 7.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                The full Supporter Program rules — tier thresholds, multipliers,
                distribution mechanics, soft-demotion schedule, and anti-abuse
                constraints — are documented at{" "}
                <a href="/supporters" class="text-accent hover:underline">
                  contexter.cc/supporters
                </a>{" "}
                and may change with reasonable notice.
              </p>
            </div>

            {/* ── Availability ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                8. Availability and SLA
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We strive to keep the Service available, but provide it on a{" "}
                <strong>best-effort basis</strong>. We do not guarantee any specific
                uptime percentage or response time. The Service may be temporarily
                unavailable for maintenance, updates, or reasons beyond our control
                (such as upstream provider outages).
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We will make reasonable efforts to notify users in advance of
                planned maintenance windows.
              </p>
            </div>

            {/* ── Limitation of Liability ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                9. Limitation of Liability
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                To the maximum extent permitted by applicable law:
              </p>
              <ul class="list-disc pl-6 flex flex-col" style={{ gap: "8px" }}>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  The Service is provided <strong>"as is"</strong> and{" "}
                  <strong>"as available"</strong>, without warranties of any kind,
                  whether express or implied.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  We do not warrant that query results are accurate, complete, or
                  suitable for any particular purpose.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  Our total liability for any claims arising from your use of the
                  Service is limited to{" "}
                  <strong>
                    the amount you paid us in the 30 days preceding the claim
                  </strong>
                  , or $10 USD, whichever is greater.
                </li>
                <li class="text-[16px] text-text-secondary leading-[1.5]">
                  We are not liable for any indirect, incidental, special,
                  consequential, or punitive damages, including loss of profits,
                  data, or business opportunities.
                </li>
              </ul>
            </div>

            {/* ── Termination ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                10. Termination
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                <strong>By you:</strong> You may delete your account and all
                associated data at any time through the Settings page. Deletion is
                immediate and irreversible.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                <strong>By us:</strong> We may suspend or terminate your access if
                you violate these Terms. For non-critical violations, we will
                provide 30 days' written notice and an opportunity to remedy the
                issue. We reserve the right to terminate immediately for severe
                violations (illegal content, active security threats, or sustained
                abuse of the Service).
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Upon termination, your data will be deleted in accordance with our{" "}
                <a href="/privacy" class="text-accent hover:underline">
                  Privacy Policy
                </a>
                . Unused prepaid credits are not refundable.
              </p>
            </div>

            {/* ── Indemnification ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                11. Indemnification
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                You agree to indemnify and hold Contexter harmless from any claims,
                losses, or damages (including reasonable legal fees) arising from
                your use of the Service, your violation of these Terms, or your
                infringement of any third party's rights through content you upload.
              </p>
            </div>

            {/* ── Governing Law ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                12. Governing Law and Dispute Resolution
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                These Terms are governed by the laws of England and Wales, without
                regard to conflict of law principles.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Any dispute arising from these Terms or the Service shall first be
                attempted to be resolved through good-faith negotiation. If
                negotiation fails within 30 days, the dispute shall be submitted to
                binding online arbitration in accordance with the rules of a
                mutually agreed arbitration provider. The language of arbitration
                shall be English.
              </p>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                Nothing in this section prevents either party from seeking injunctive
                relief in a court of competent jurisdiction where necessary to
                protect intellectual property or prevent irreparable harm.
              </p>
            </div>

            {/* ── Changes ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                13. Changes to These Terms
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                We may modify these Terms at any time. We will notify you of
                material changes by posting the updated Terms on this page and
                updating the "Last updated" date. For significant changes, we will
                also notify you via email. Your continued use of the Service after
                the effective date of updated Terms constitutes acceptance.
              </p>
            </div>

            {/* ── Severability ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                14. Severability
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                If any provision of these Terms is found to be unenforceable, the
                remaining provisions will continue in full force and effect.
              </p>
            </div>

            {/* ── Contact ── */}
            <div class="flex flex-col" style={{ gap: "16px" }}>
              <h2 class="text-[20px] md:text-[24px] font-bold text-black">
                15. Contact
              </h2>
              <p class="text-[16px] text-text-secondary leading-[1.5]">
                For questions about these Terms, contact us at:{" "}
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

export default Terms
