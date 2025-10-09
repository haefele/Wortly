import { paginationOptsValidator } from "convex/server";
import { query, mutation, DatabaseReader } from "./_generated/server";
import { v, ConvexError, Infer } from "convex/values";
import { getCurrentUser } from "./users";
import { Doc } from "./_generated/dataModel";
import { pickRandomElements, shuffle } from "./lib/shuffle";
import schema from "./schema";
import { internal } from "./_generated/api";

const MAX_QUESTIONS = 10;
const OPTIONS_PER_QUESTION = 4;

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
      return getMultipleChoiceCompletedStatus(session, ctx.db);
    } else {
      return getMultipleChoiceInProgressStatus(session, ctx.db);
    }
  },
});

async function getMultipleChoiceCompletedStatus(
  session: Doc<"practiceSessions">,
  db: DatabaseReader
) {
  if (
    session.type !== "multiple_choice" &&
    session.multipleChoice.type !== "german_word_choose_translation"
  ) {
    throw new ConvexError("Unsupported practice session type.");
  }

  return {
    completed: true as const,
    _id: session._id,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    multipleChoice: {
      wordBoxId: session.multipleChoice.wordBoxId,
      wordBoxName: session.multipleChoice.wordBoxName,
      questions: session.multipleChoice.questions,
    },
  };
}

async function getMultipleChoiceInProgressStatus(
  session: Doc<"practiceSessions">,
  db: DatabaseReader
) {
  if (
    session.type !== "multiple_choice" &&
    session.multipleChoice.type !== "german_word_choose_translation"
  ) {
    throw new ConvexError("Unsupported practice session type.");
  }

  const currentQuestion =
    session.multipleChoice.questions[session.multipleChoice.currentQuestionIndex ?? 0];

  return {
    completed: false as const,
    _id: session._id,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    multipleChoice: {
      wordBoxId: session.multipleChoice.wordBoxId,
      wordBoxName: session.multipleChoice.wordBoxName,
      totalQuestions: session.multipleChoice.questions.length,
      currentQuestionNumber: (session.multipleChoice.currentQuestionIndex ?? 0) + 1,
      currentQuestion: {
        question: currentQuestion.question,
        options: currentQuestion.answers.map(f => f.text),
        selectedAnswerIndex: currentQuestion.selectedAnswerIndex,
        correctAnswerIndex: currentQuestion.correctAnswerIndex,
      },
    },
  };
}

type MultipleChoice = Infer<typeof schema.tables.practiceSessions.validator>["multipleChoice"];
type MultipleChoiceQuestion = MultipleChoice["questions"][0];

export const startMultipleChoice = mutation({
  args: {
    wordBoxId: v.id("wordBoxes"),
    questionCount: v.optional(v.number()),
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

    const wordIds = assignments.map(a => a.wordId);

    const questionWordIds = pickRandomElements(wordIds, args.questionCount ?? MAX_QUESTIONS);

    const questions = await Promise.all(
      questionWordIds.map(async wordId => {
        const wrongAnswerPool = wordIds.filter(otherId => otherId !== wordId);
        const wrongAnswerWordIds = pickRandomElements(wrongAnswerPool, OPTIONS_PER_QUESTION - 1);

        const shuffledAnswers = shuffle(
          await Promise.all(
            [wordId, ...wrongAnswerWordIds].map(async id => {
              const w = await ctx.db.get(id);
              return {
                text: getPreferredTranslation(w),
                wordId: w?._id,
              };
            })
          )
        );

        const word = await ctx.db.get(wordId);

        return {
          question: word?.word,
          wordId,

          answers: shuffledAnswers,

          correctAnswerIndex: shuffledAnswers.findIndex(a => a.wordId === wordId),

          selectedAnswerIndex: undefined,
          answeredAt: undefined,
        } as MultipleChoiceQuestion;
      })
    );

    const sessionId = await ctx.db.insert("practiceSessions", {
      userId: user._id,
      createdAt: Date.now(),
      type: "multiple_choice",
      multipleChoice: {
        type: "german_word_choose_translation",
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
      const { currentQuestionIndex: _omit, ...rest } = session.multipleChoice;

      const completedAt = session.completedAt ?? Date.now();

      await ctx.db.patch(session._id, {
        multipleChoice: {
          ...rest,
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
