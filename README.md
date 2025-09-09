# Wortly 🇩🇪

A modern German vocabulary learning platform that helps users build their German vocabulary through interactive learning and spaced repetition.

## ✨ Features

- **Word Discovery**: Search and explore German words with AI-powered definitions
- **Personal Collections**: Organize words into custom WordBoxes for targeted learning
- **Interactive Learning**: Multiple study modes including flashcards, quizzes, and exercises
- **Progress Tracking**: Monitor learning streaks, vocabulary growth, and mastery levels
- **Smart Learning**: Spaced repetition algorithm optimizes retention
- **Multilingual Support**: Translations in English and Russian

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Convex (real-time database and server functions)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Integration**: OpenAI API for word analysis
- **Language**: TypeScript
- **Deployment**: Vercel

## 📁 Project Structure

```
wortly/
├── app/                # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Dashboard (word search & discovery)
│   ├── library/            # Word collections management
│   ├── learn/              # Study sessions and exercises
│   └── progress/           # Learning analytics
├── components/         # React components
│   ├── ui/                 # shadcn/ui components
│   └── ...                 # Custom components
├── convex/             # Backend (Convex)
│   ├── functions/          # API functions
│   ├── lib/                # Helper functions
│   ├── schema.ts           # Database schema
│   └── auth.config.ts      # Authentication config
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── .claude/            # AI assistant plans and docs
```

## 🎯 Core Functionality

### Word Management
- **Search**: Find German words with fuzzy search
- **Add New Words**: AI automatically fetches definitions, examples, and translations
- **Collections**: Organize words into custom WordBoxes

### Learning System
- **Flashcards**: Traditional spaced repetition
- **Interactive Exercises**: Multiple choice, fill-in-the-blank, word matching
- **Adaptive Difficulty**: Performance-based difficulty adjustment
- **Progress Tracking**: Detailed analytics and streak tracking

### Development Guidelines

- Follow existing code patterns and naming conventions
- Use TypeScript for type safety
- Follow kebab-case for file names
- Test your changes thoroughly

---

**Wortly** - Making German vocabulary learning engaging and effective! 🚀