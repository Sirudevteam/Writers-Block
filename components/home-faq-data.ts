export type HomeFAQItem = {
  question: string
  answer: string
}

export const faqItems: HomeFAQItem[] = [
  {
    question: "How does Writers Block generate Tamil screenplays?",
    answer:
      "Writers Block uses Replicate-hosted text models, currently defaulting to Google Gemini 2.5 Flash, with prompts tailored for Tamil cinema storytelling conventions, dialogue patterns, and screenplay formatting rules. You describe your scene, choose your genre and mood, and the AI generates a properly formatted Tamil or English screenplay scene within seconds.",
  },
  {
    question: "Does it support the Tamil screenplay format?",
    answer:
      "Yes. Writers Block natively supports Tamil screenplay formatting, including Tamil character names, Tamil dialogue style, scene headings, and emotional beats that resonate with Tamil cinema sensibilities. You can switch between Tamil and English screenplay modes for each project.",
  },
  {
    question: "How many scenes can I generate on the Free plan?",
    answer:
      "The Free plan lets you create up to 5 screenplay projects and includes a daily AI generation allowance. Upgrade to Pro (INR 1999/month) for up to 25 projects, a much higher daily AI limit, and access to advanced features like Dialogue Improver, Shot Suggestions, and PDF export.",
  },
  {
    question: "Can I export my screenplay to PDF?",
    answer:
      "Yes. PDF export is available on the Pro and Premium plans. The exported PDF follows industry-standard screenplay formatting and is ready to share with producers, directors, or use for production. The Free plan allows you to work in the editor but does not include PDF export.",
  },
  {
    question: "What AI model powers the screenplay generation?",
    answer:
      "Screenplay generation, continuation, dialogue improvement, and shot suggestions currently run through Replicate, with Google Gemini 2.5 Flash as the default model and support for compatible model overrides via configuration. Movie reference suggestions use Anthropic on the server side. This setup keeps the writing workflows flexible while preserving the cinematic prompting tuned for Tamil and English screenplay writing.",
  },
  {
    question: "Is Writers Block suitable for beginner screenwriters?",
    answer:
      "Absolutely. Writers Block is designed for all skill levels. Beginners benefit from the AI handling formatting automatically so you can focus entirely on your story. The Movie Scene References feature also doubles as a learning tool, showing how professional screenwriters structure scenes.",
  },
  {
    question: "Can a team collaborate on the same screenplay?",
    answer:
      "Team collaboration is available on the Premium plan (INR 4999/month). Multiple team members can work on projects together, making it useful for production houses, writing rooms, and co-writers. Individual plans (Free and Pro) are single-user accounts.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "Yes. The Free plan acts as a trial. You can explore the full editor, generate scenes, and experience the platform with no credit card required. When you are ready for more projects, advanced AI, and professional features, you can upgrade to Pro or Premium.",
  },
]
