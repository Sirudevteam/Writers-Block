import { PRO_MONTHLY_INR, PREMIUM_MONTHLY_INR } from "@/lib/pricing-inr"

export type HomeFAQItem = {
  /** Anchor for in-page links (e.g. footer legal). */
  id?: string
  question: string
  answer: string
}

const pro = PRO_MONTHLY_INR.toLocaleString("en-IN")
const prem = PREMIUM_MONTHLY_INR.toLocaleString("en-IN")

export const faqItems: HomeFAQItem[] = [
  {
    question: "How does Writers Block help me finish a better screenplay faster?",
    answer:
      "You focus on the scene and the emotional beat—Writers Block handles industry-style formatting, Tamil and English blend, and continuation so you are not starting from a blank page every time. The goal is a draft you can iterate on, not generic filler.",
  },
  {
    question: "Does it support the Tamil screenplay format?",
    answer:
      "Yes. The editor and exports follow common screenplay structure: scene headings, dialogue, and parentheticals, with support for natural Tamil lines alongside English slugs and technical terms. You can work in Tamil-first mode or mix with English as your story needs.",
  },
  {
    question: "What do I get on the Free plan vs Pro?",
    answer: `The Free plan is for trying the product: a small number of projects, lighter AI for drafting, and watermarked print/email PDF. Pro (from ₹${pro}/month) adds production-aimed generation, dialogue and continuation tools, style rewrite, clean PDF export, and a higher daily limit so you can push a draft to completion.`,
  },
  {
    question: "Can I export my screenplay to PDF?",
    answer:
      "Yes. You can use browser print on every plan. Free exports include a visible preview watermark. Pro and Premium give you clean, share-ready PDFs (including the email-PDF feature). Upgrade when you are sending work to collaborators or need a client-ready file.",
  },
  {
    question: "What powers the writing behind the scenes?",
    answer:
      "Screenplay, continuation, shot ideas, and similar flows run on Replicate-hosted text models, with your plan choosing a cost–quality mix (e.g. lighter on Free, stronger on Pro and Premium). Movie reference ideas may use a separate high-quality text API. You are not asked to juggle model names in the app—the plans differ in output quality, speed, and limits.",
  },
  {
    question: "Is Writers Block suitable for beginner screenwriters?",
    answer:
      "Yes. The Free tier is a low-risk way to learn the craft while the app handles formatting. When you are ready to write something you would share with a team, Pro adds the tools and clean export that make that realistic.",
  },
  {
    question: "Is there team or API access for studios?",
    answer: `Full team workspaces and a public API are on our roadmap. Today, Premium (₹${prem}/month) is aimed at pro throughput: unlimited projects under a high cap, stronger routing, and priority when the system is busy. If you are a production company with specific needs, contact sales so we can align on timing.`,
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "The Free plan is the trial: no card required, full editor access, and watermarked export so you can experience the product end to end. Upgrade when the draft is ready to leave your desk.",
  },
  {
    id: "faq-cookies",
    question: "Do you use cookies?",
    answer:
      "Like most web apps, we use cookies and similar storage for sign-in sessions, preferences, and security. Essential cookies keep you logged in and protect your account. You can control non-essential cookies in your browser settings. For full legal wording, use the contact details on Siru AI Labs if you need a written policy.",
  },
  {
    id: "faq-refunds",
    question: "What is your refund policy?",
    answer:
      "Paid plans are processed by our payment provider at the price shown at checkout. If something went wrong with billing or you believe you were charged in error, contact us through Siru AI Labs and we will review your case. We do not guarantee refunds for every situation; outcomes depend on the payment provider rules and what happened with your account.",
  },
]
