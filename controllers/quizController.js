const Quiz = require("../models/quizModel");
const Course = require("../models/courseModel");
const generateFeedback = require("../utils/functions/aiFeedbackFunctions");

// ✅ Create a new quiz
const createQuiz = async (req, res) => {
  try {
    const { courseId, title, description, questions } = req.body;
    const teacher = req.user;

    if (teacher.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const newQuiz = new Quiz({
      courseId,
      teacherId: teacher._id,
      title,
      description,
      questions,
    });

    await newQuiz.save();
    res
      .status(201)
      .json({ message: "Quiz created successfully!", quiz: newQuiz });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating quiz", error: error.message });
  }
};

// ✅ Get quizzes for a course
const getQuizzesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await Quiz.find({ courseId }).populate("teacherId", "name");
    // .populate("submissions.studentId", "name email");
    res.status(200).json({ quizzes });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching quizzes", error: error.message });
  }
};

const getSingleQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    res.status(200).json({ quiz });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching quiz", error: error.message });
  }
};

// ✅ Edit a quiz
const editQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacher = req.user;
    const { title, description, questions } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    quiz.questions = questions || quiz.questions;

    await quiz.save();
    res.status(200).json({ message: "Quiz updated successfully!", quiz });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating quiz", error: error.message });
  }
};

// ✅ Delete a quiz
const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacher = req.user;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    await Quiz.findByIdAndDelete(quizId);
    res.status(200).json({ message: "Quiz deleted successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting quiz", error: error.message });
  }
};

// ✅ Fetch available quizzes for a student
const getAvailableQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await Quiz.find({ courseId }); // Don't send submissions
    res.status(200).json({ quizzes });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching quizzes", error: error.message });
  }
};

const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const student = req.user;
    const { answers } = req.body; // Array of { questionId, response }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Prevent duplicate submissions
    if (
      quiz.submissions.some(
        (sub) => sub.studentId.toString() === student._id.toString()
      )
    ) {
      return res
        .status(400)
        .json({ message: "You have already submitted this quiz" });
    }

    let totalScore = 0;
    let totalPossibleScore = 0;
    const gradedAnswers = [];

    for (let answer of answers) {
      const question = quiz.questions.find(
        (q) => q._id.toString() === answer.questionId
      );
      if (!question) continue;

      const points = question.points || 1; // Default 1 if points not set
      totalPossibleScore += points; // Add points to total possible score

      if (question.type === "multiple-choice") {
        if (question.correctAnswer === answer.response) {
          totalScore += points; // Award full points if correct
        }
        gradedAnswers.push({
          questionId: question._id,
          response: answer.response,
        });
      } else if (question.type === "open-ended") {
        const feedback = await generateFeedback(
          `Question: ${question.questionText} Answer: ${answer.response}`
        );
        gradedAnswers.push({
          questionId: question._id,
          response: answer.response,
          feedback,
        });
      }
    }

    quiz.submissions.push({
      studentId: student._id,
      answers: gradedAnswers,
      score: totalScore,
      totalPossibleScore, // ⭐️ Save possible score too (optional)
      graded: false,
    });

    await quiz.save();
    res.status(201).json({
      message: "Quiz submitted successfully!",
      score: totalScore,
      totalPossibleScore,
      percentage: ((totalScore / totalPossibleScore) * 100).toFixed(2) + "%",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error submitting quiz", error: error.message });
  }
};

// ✅ Fetch quiz results for a student
const getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const student = req.user;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const submission = quiz.submissions.find(
      (sub) => sub.studentId.toString() === student._id.toString()
    );
    if (!submission)
      return res.status(404).json({ message: "No submission found" });

    res.status(200).json({ submission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching quiz results", error: error.message });
  }
};

// ✅ Grade a quiz submission
const gradeQuizSubmission = async (req, res) => {
  try {
    const { quizId, studentId } = req.params;
    const teacher = req.user;
    const { grades, feedback } = req.body; // { questionId: gradeValue, overallFeedback: "Good job!" }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    const submission = quiz.submissions.find(
      (sub) => sub.studentId.toString() === studentId
    );
    if (!submission)
      return res.status(404).json({ message: "Submission not found" });

    if (submission.graded) {
      return res.status(400).json({ message: "Submission already graded" });
    }

    let totalScore = submission.score || 0; // Start with auto-graded multiple-choice score

    submission.answers.forEach((answer) => {
      if (grades[answer.questionId]) {
        const question = quiz.questions.find(
          (q) => q._id.toString() === answer.questionId.toString()
        );

        if (question) {
          const points = question.points || 1; // Default to 1 if undefined
          let givenScore = grades[answer.questionId];

          if (givenScore > points) givenScore = points; // Prevent overscoring
          if (givenScore < 0) givenScore = 0; // Prevent negative scores

          totalScore += givenScore;
        }
      }
    });

    submission.score = totalScore;
    submission.graded = true;
    submission.feedback = feedback || "";

    await quiz.save();

    res.status(200).json({ message: "Quiz graded successfully!", submission });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error grading quiz", error: error.message });
  }
};

// ✅ Get all quiz submissions for teachers
const getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacher = req.user;

    const quiz = await Quiz.findById(quizId).populate(
      "submissions.studentId",
      "name email"
    );
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (quiz.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    res.status(200).json({ submissions: quiz.submissions });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching submissions", error: error.message });
  }
};

module.exports = {
  createQuiz,
  getSingleQuiz,
  getQuizzesByCourse,
  editQuiz,
  deleteQuiz,
  getAvailableQuizzes,
  submitQuiz,
  getQuizResults,
  gradeQuizSubmission,
  getQuizSubmissions,
};
