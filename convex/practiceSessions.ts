import { paginationOptsValidator } from "convex/server";
import { query, mutation, DatabaseReader } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getCurrentUser } from "./users";
import { Doc, Id } from "./_generated/dataModel";
import { deterministicShuffle, pickRandomDistinctElements } from "./lib/shuffle";

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
        const answeredCount = session.multipleChoice.questions.filter(q => q.selectedWordId).length;
        const correctCount = session.multipleChoice.questions.filter(
          q => q.selectedWordId && q.selectedWordId === q.wordId
        ).length;

        return {
          _id: session._id,
          _creationTime: session._creationTime,
          mode: session.mode,
          createdAt: session.createdAt,
          completedAt: session.completedAt,
          multipleChoice: {
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

    if (session.mode !== "multiple_choice") {
      throw new ConvexError("Unsupported practice session mode.");
    }

    const wordBox = await ctx.db.get(session.multipleChoice.wordBoxId);

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
  const allWords = await loadWordMapForSession(db, session.multipleChoice.questions);

  return {
    completed: true as const,
    _id: session._id,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    multipleChoice: {
      wordBoxId: session.multipleChoice.wordBoxId,
      wordBoxName: session.multipleChoice.wordBoxName,
      questions: session.multipleChoice.questions.map(question => {
        const word = allWords.get(question.wordId);
        const otherWords = question.otherWordIds.map(id => allWords.get(id));

        return {
          word: word,
          otherWords: otherWords,
          selectedWordId: question.selectedWordId,
        };
      }),
    },
  };
}

async function getMultipleChoiceInProgressStatus(
  session: Doc<"practiceSessions">,
  db: DatabaseReader
) {
  const allWords = await loadWordMapForSession(db, session.multipleChoice.questions);

  const currentQuestion =
    session.multipleChoice.questions[session.multipleChoice.currentQuestionIndex ?? 0];
  const word = allWords.get(currentQuestion.wordId);
  const otherWords = currentQuestion.otherWordIds.map(id => allWords.get(id));

  const shuffled = deterministicShuffle(
    [word, ...otherWords],
    `${session._id}:${session.multipleChoice.currentQuestionIndex ?? 0}`
  );

  const options = shuffled
    .filter((w): w is Doc<"words"> => !!w)
    .map(f => ({ wordId: f._id, text: getPreferredTranslation(f) }));

  const selectedWordId = currentQuestion.selectedWordId ?? null;
  const correctWordId = selectedWordId ? currentQuestion.wordId : null;

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
        word: word?.word,
        options: options,
        selectedWordId,
        correctWordId,
      },
    },
  };
}

export const startMultipleChoice = mutation({
  args: {
    wordBoxId: v.id("wordBoxes"),
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

    if (assignments.length < OPTIONS_PER_QUESTION) {
      throw new ConvexError("At least 4 words are required to start a practice session.");
    }

    const wordIds = assignments.map(a => a.wordId);

    const questionWordIds = pickRandomDistinctElements(
      wordIds,
      Math.min(MAX_QUESTIONS, wordIds.length)
    );

    const questions = questionWordIds.map(wordId => {
      const decoyPool = wordIds.filter(otherId => otherId !== wordId);
      const decoys = pickRandomDistinctElements(
        decoyPool,
        Math.min(OPTIONS_PER_QUESTION - 1, decoyPool.length)
      );

      if (decoys.length < OPTIONS_PER_QUESTION - 1) {
        throw new ConvexError("Not enough unique words to generate answer options.");
      }

      return {
        wordId,
        otherWordIds: decoys,
      };
    });

    const sessionId = await ctx.db.insert("practiceSessions", {
      userId: user._id,
      createdAt: Date.now(),
      mode: "multiple_choice",
      multipleChoice: {
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
    selectedWordId: v.id("words"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) {
      throw new Error("Practice session not found");
    }

    const currentIndex = session.multipleChoice.currentQuestionIndex;
    if (currentIndex === undefined || currentIndex === null) {
      throw new ConvexError("Practice session already completed.");
    }

    if (currentIndex < 0 || currentIndex >= session.multipleChoice.questions.length) {
      throw new ConvexError("Invalid current question index.");
    }

    const question = session.multipleChoice.questions[currentIndex];
    if (question.selectedWordId) {
      throw new ConvexError("This question has already been answered.");
    }

    const optionIds = [question.wordId, ...question.otherWordIds];
    if (!optionIds.includes(args.selectedWordId)) {
      throw new ConvexError("Selected option is not part of this question.");
    }

    question.selectedWordId = args.selectedWordId;
    question.answeredAt = Date.now();

    await ctx.db.replace(session._id, session);

    return {
      isCorrect: args.selectedWordId === question.wordId,
      correctWordId: question.wordId,
      selectedWordId: args.selectedWordId,
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
    if (!question.selectedWordId) {
      throw new ConvexError("Answer the current question before moving on.");
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= session.multipleChoice.questions.length) {
      const { currentQuestionIndex: _omit, ...rest } = session.multipleChoice;

      await ctx.db.patch(session._id, {
        multipleChoice: {
          ...rest,
        },
        completedAt: session.completedAt ?? Date.now(),
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

async function loadWordMapForSession(
  db: DatabaseReader,
  questions: Array<{ wordId: Id<"words">; otherWordIds: Id<"words">[] }>
) {
  const wordMap = new Map<Id<"words">, Doc<"words"> | null>();

  for (const question of questions) {
    if (!wordMap.has(question.wordId)) {
      wordMap.set(question.wordId, await db.get(question.wordId));
    }

    for (const otherId of question.otherWordIds) {
      if (!wordMap.has(otherId)) {
        wordMap.set(otherId, await db.get(otherId));
      }
    }
  }

  return wordMap;
}

function getPreferredTranslation(word: Doc<"words"> | null): string {
  if (!word) {
    return "";
  }

  return word.translations.en ?? word.translations.ru ?? word.word;
}
