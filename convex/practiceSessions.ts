import { paginationOptsValidator } from "convex/server";
import { query, mutation, DatabaseReader } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getCurrentUser } from "./users";
import { Doc, Id } from "./_generated/dataModel";
import { pickRandomElements, shuffle } from "./lib/shuffle";
import { MultipleChoiceQuestion, MultipleChoiceType, MultipleChoiceTypeValidator } from "./schema";
import { internal } from "./_generated/api";

const OPTIONS_PER_QUESTION = 4;
const ARTICLE_OPTIONS = ["der", "die", "das"] as const;

export const getPracticeSessions = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const sessions = await ctx.db
      .query("practiceSessions")
      .withIndex("by_userId_and_createdAt", q => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      page: sessions.page.map(session => {
        const totalQuestions = session.multipleChoice.questions.length;
        const answeredCount = session.multipleChoice.questions.filter(
          q => q.selectedAnswerIndex !== undefined
        ).length;
        const correctCount = session.multipleChoice.questions.filter(
          q => q.selectedAnswerIndex !== undefined && q.selectedAnswerIndex === q.correctAnswerIndex
        ).length;

        return {
          _id: session._id,
          _creationTime: session._creationTime,
          type: session.type,
          createdAt: session.createdAt,
          completedAt: session.completedAt,
          multipleChoice: {
            type: session.multipleChoice.type,
            wordBoxName: session.multipleChoice.wordBoxName,
            totalQuestions,
            answeredCount,
            correctCount,
            currentQuestionIndex: session.multipleChoice.currentQuestionIndex,
          },
        };
      }),
      isDone: sessions.isDone,
      continueCursor: sessions.continueCursor ?? null,
    };
  },
});

export const getMultipleChoiceStatus = query({
  args: {
    sessionId: v.id("practiceSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Practice session not found");
    }

    if (session.completedAt) {
      return getMultipleChoiceCompletedStatus(session);
    } else {
      return getMultipleChoiceInProgressStatus(session);
    }
  },
});

async function getMultipleChoiceCompletedStatus(session: Doc<"practiceSessions">) {
  if (session.type !== "multiple_choice") {
    throw new ConvexError("Unsupported practice session type.");
  }

  return {
    completed: true as const,
    _id: session._id,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    multipleChoice: {
      type: session.multipleChoice.type,
      wordBoxId: session.multipleChoice.wordBoxId,
      wordBoxName: session.multipleChoice.wordBoxName,
      questions: session.multipleChoice.questions,
    },
  };
}

async function getMultipleChoiceInProgressStatus(session: Doc<"practiceSessions">) {
  if (session.type !== "multiple_choice") {
    throw new ConvexError("Unsupported practice session type.");
  }

  const currentQuestion =
    session.multipleChoice.questions[session.multipleChoice.currentQuestionIndex ?? 0];

  // Calculate status for each question
  const questionStatuses = session.multipleChoice.questions.map(q => {
    if (q.selectedAnswerIndex === undefined) {
      return "unanswered" as const;
    } else if (q.selectedAnswerIndex === q.correctAnswerIndex) {
      return "correct" as const;
    } else {
      return "incorrect" as const;
    }
  });

  return {
    completed: false as const,
    _id: session._id,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    multipleChoice: {
      type: session.multipleChoice.type,
      wordBoxId: session.multipleChoice.wordBoxId,
      wordBoxName: session.multipleChoice.wordBoxName,
      totalQuestions: session.multipleChoice.questions.length,
      currentQuestionNumber: (session.multipleChoice.currentQuestionIndex ?? 0) + 1,
      questionStatuses,
      currentQuestion: {
        question: currentQuestion.question,
        options: currentQuestion.answers.map(f => f.text),
        selectedAnswerIndex: currentQuestion.selectedAnswerIndex,
        correctAnswerIndex: currentQuestion.correctAnswerIndex,
      },
    },
  };
}

export const startMultipleChoice = mutation({
  args: {
    wordBoxId: v.id("wordBoxes"),
    questionCount: v.number(),
    type: MultipleChoiceTypeValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const box = await ctx.db.get(args.wordBoxId);
    if (!box || box.userId !== user._id) {
      throw new Error("Word box not found");
    }

    const assignments = await ctx.db
      .query("wordBoxAssignments")
      .withIndex("by_boxId", q => q.eq("boxId", box._id))
      .collect();

    if (assignments.length < 1) {
      throw new ConvexError("At least 1 word is required to start a practice session.");
    }

    const questions =
      args.type === "german_substantive_choose_article"
        ? await buildArticleQuestions(ctx.db, assignments, args.questionCount)
        : await buildTranslationQuestions(
            ctx.db,
            assignments.map(a => a.wordId),
            args.questionCount,
            args.type
          );

    const sessionId = await ctx.db.insert("practiceSessions", {
      userId: user._id,
      createdAt: Date.now(),
      type: "multiple_choice",
      multipleChoice: {
        type: args.type,
        wordBoxId: box._id,
        wordBoxName: box.name,
        questions,
        currentQuestionIndex: 0,
      },
    });

    return sessionId;
  },
});

export const answerMultipleChoice = mutation({
  args: {
    sessionId: v.id("practiceSessions"),
    selectedAnswerIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Practice session not found");
    }

    const currentQuestionIndex = session.multipleChoice.currentQuestionIndex;
    if (currentQuestionIndex === undefined || currentQuestionIndex === null) {
      throw new ConvexError("Practice session already completed.");
    }

    const question = session.multipleChoice.questions[currentQuestionIndex];
    if (question.selectedAnswerIndex !== undefined) {
      throw new ConvexError("This question has already been answered.");
    }

    if (args.selectedAnswerIndex < 0 || args.selectedAnswerIndex >= question.answers.length) {
      throw new ConvexError("Selected option is out of range.");
    }

    question.selectedAnswerIndex = args.selectedAnswerIndex;
    question.answeredAt = Date.now();

    await ctx.db.replace(session._id, session);

    return {
      isCorrect: args.selectedAnswerIndex === question.correctAnswerIndex,
      correctAnswerIndex: question.correctAnswerIndex,
      selectedAnswerIndex: args.selectedAnswerIndex,
    };
  },
});

export const nextQuestionMultipleChoice = mutation({
  args: {
    sessionId: v.id("practiceSessions"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Practice session not found");
    }

    const currentIndex = session.multipleChoice.currentQuestionIndex;
    if (currentIndex === undefined || currentIndex === null) {
      return {
        currentQuestionIndex: null,
        completed: true,
      };
    }

    if (currentIndex < 0 || currentIndex >= session.multipleChoice.questions.length) {
      throw new ConvexError("Invalid current question index.");
    }

    const question = session.multipleChoice.questions[currentIndex];
    if (question.selectedAnswerIndex === undefined) {
      throw new ConvexError("Answer the current question before moving on.");
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= session.multipleChoice.questions.length) {
      const completedAt = session.completedAt ?? Date.now();

      await ctx.db.patch(session._id, {
        multipleChoice: {
          ...session.multipleChoice,
          currentQuestionIndex: undefined,
        },
        completedAt,
      });

      // Update streak when session is completed
      await ctx.scheduler.runAfter(0, internal.users.updateStreak, {
        userId: user._id,
        completedAt,
      });

      return {
        currentQuestionIndex: null,
        completed: true,
      };
    }

    await ctx.db.patch(session._id, {
      multipleChoice: {
        ...session.multipleChoice,
        currentQuestionIndex: nextIndex,
      },
    });

    return {
      currentQuestionIndex: nextIndex,
      completed: false,
    };
  },
});

function getPreferredTranslation(word: Doc<"words"> | null): string {
  if (!word) {
    return "";
  }

  return word.translations.en ?? word.translations.ru ?? word.word;
}

async function buildTranslationQuestions(
  db: DatabaseReader,
  wordIds: Id<"words">[],
  questionCount: number,
  sessionType: MultipleChoiceType
) {
  const questionWordIds = pickRandomElements(wordIds, questionCount);

  return Promise.all(
    questionWordIds.map(async wordId => {
      const wrongAnswerPool = wordIds.filter(otherId => otherId !== wordId);
      const wrongAnswerWordIds = pickRandomElements(wrongAnswerPool, OPTIONS_PER_QUESTION - 1);

      const answerDocs = await Promise.all(
        [wordId, ...wrongAnswerWordIds].map(async id => {
          const word = await db.get(id);
          return { id, word };
        })
      );

      const shuffledAnswers = shuffle(
        answerDocs.map(({ id, word }) => ({
          text: getMultipleChoiceAnswerText(word, sessionType),
          wordId: word?._id ?? id,
        }))
      );

      const questionWord = answerDocs.find(({ id }) => id === wordId)?.word ?? null;

      return {
        question: getMultipleChoiceQuestionText(questionWord, sessionType),
        wordId,

        answers: shuffledAnswers,

        correctAnswerIndex: shuffledAnswers.findIndex(a => a.wordId === wordId),
      } as MultipleChoiceQuestion;
    })
  );
}

async function buildArticleQuestions(
  db: DatabaseReader,
  assignments: Doc<"wordBoxAssignments">[],
  questionCount: number
) {
  const nounAssignments = assignments.filter(a => a.wordType === "Substantiv");
  if (nounAssignments.length === 0) {
    throw new ConvexError("This collection needs nouns.");
  }

  const selectedWords = await Promise.all(
    pickRandomElements(nounAssignments, questionCount).map(async assignment => {
      const word = await db.get(assignment.wordId);
      return word;
    })
  );

  if (selectedWords.length === 0) {
    throw new ConvexError("This collection needs nouns.");
  }

  return selectedWords.map(word => {
    if (!word) {
      throw new ConvexError("Word not found.");
    }

    const answers = ARTICLE_OPTIONS.map(option => ({
      text: option,
      wordId: undefined,
    }));

    const correctAnswerIndex = ARTICLE_OPTIONS.findIndex(option => option === word?.article);
    if (correctAnswerIndex === -1) {
      throw new ConvexError("Word is missing a valid article.");
    }

    return {
      question: getMultipleChoiceQuestionText(word, "german_substantive_choose_article"),
      wordId: word._id,

      answers,

      correctAnswerIndex,
    } as MultipleChoiceQuestion;
  });
}

function getMultipleChoiceQuestionText(word: Doc<"words"> | null, type: MultipleChoiceType) {
  if (!word) {
    return "";
  }

  if (type === "german_word_choose_translation") {
    return word.word;
  }

  if (type === "translation_choose_german_word") {
    return getPreferredTranslation(word);
  }

  return word.word;
}

function getMultipleChoiceAnswerText(word: Doc<"words"> | null, type: MultipleChoiceType) {
  if (!word) {
    return "";
  }

  if (type === "german_word_choose_translation") {
    return getPreferredTranslation(word);
  }

  if (type === "translation_choose_german_word") {
    return word.word;
  }

  return word.translations.en ?? "";
}
