"use client";

import Link from "next/link";

/**
 * Footer — Client Component (uses hover event handlers).
 * Uses design system tokens throughout.
 */

const footerLinks = {
  Product: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "For Parents", href: "#parents" },
    { label: "Guarantee", href: "#guarantee" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      style={{
        background: "var(--color-text)",
        color: "rgba(255, 255, 255, 0.7)",
        paddingTop: "var(--space-16)",
        paddingBottom: "var(--space-8)",
      }}
    >
      <div
        className="footer-grid"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 var(--space-6)",
          display: "grid",
          gap: "var(--space-10)",
        }}
      >
        {/* Brand column */}
        <div>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontSize: "var(--text-h2)",
              fontWeight: 700,
              color: "#FFFFFF",
              textDecoration: "none",
              letterSpacing: "-0.02em",
              display: "block",
              marginBottom: "var(--space-4)",
            }}
          >
            Zorvai
          </Link>
          <p
            style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "var(--text-body-sm)",
              lineHeight: 1.6,
              maxWidth: "280px",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            AI-powered study coaching with a structured learning cycle.
            Real improvement, guaranteed.
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category}>
            <h3
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "var(--text-caption)",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.4)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "var(--space-4)",
              }}
            >
              {category}
            </h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
              }}
            >
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "var(--text-body-sm)",
                      color: "rgba(255, 255, 255, 0.6)",
                      textDecoration: "none",
                      transition: "color 200ms ease",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                      (e.currentTarget.style.color = "#FFFFFF")
                    }
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                      (e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)")
                    }
                  >
                    {link.text || link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "var(--space-12) auto 0",
          padding: "var(--space-6) var(--space-6) 0",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "var(--text-caption)",
            color: "rgba(255, 255, 255, 0.35)",
          }}
        >
          © 2026 Zorvai. All rights reserved.
        </p>
      </div>

      <style>{`
        .footer-grid {
          grid-template-columns: 2fr 1fr 1fr 1fr;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  );
}
