const Exam = require("../models/examModel");
const Course = require("../models/courseModel");

// ✅ Create an exam
const createExam = async (req, res) => {
  try {
    const { courseId, title, description, questions } = req.body;
    const teacher = req.user;

    if (teacher.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const newExam = new Exam({
      courseId,
      teacherId: teacher._id,
      title,
      description,
      questions,
    });

    await newExam.save();
    res
      .status(201)
      .json({ message: "Exam created successfully!", exam: newExam });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating exam", error: error.message });
  }
};

// ✅ Get exams for a course
const getExamsByCourse = async (req, res) => {
  try {
    const { courseId } = params;
    const exams = await Exam.find({ courseId }).populate("teacherId", "name");
    res.status(200).json({ exams });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching exams", error: error.message });
  }
};

const getSingleExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    res.status(200).json({ exam });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching examination", error: error.message });
  }
};

// ✅ Edit an exam
const editExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const teacher = req.user;
    const { title, description, questions } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    exam.title = title || exam.title;
    exam.description = description || exam.description;
    exam.questions = questions || exam.questions;

    await exam.save();
    res.status(200).json({ message: "Exam updated successfully!", exam });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating exam", error: error.message });
  }
};

// ✅ Delete an exam
const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const teacher = req.user;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    await Exam.findByIdAndDelete(examId);
    res.status(200).json({ message: "Exam deleted successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting exam", error: error.message });
  }
};

// ✅ Fetch available exams for a student
const getAvailableExams = async (req, res) => {
  try {
    const { courseId } = req.params;
    const exams = await Exam.find({ courseId }); // Don't send submissions
    res.status(200).json({ exams });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching exams", error: error.message });
  }
};

// ✅ Submit exam answers
const submitExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const student = req.user;
    const { answers } = req.body; // Array of { questionId, response }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Prevent duplicate submissions
    if (
      exam.submissions.some(
        (sub) => sub.studentId.toString() === student._id.toString()
      )
    ) {
      return res
        .status(400)
        .json({ message: "You have already submitted this exam" });
    }

    let score = 0;
    const gradedAnswers = answers.map((answer) => {
      const question = exam.questions.find(
        (q) => q._id.toString() === answer.questionId
      );
      if (!question) return null;

      if (
        question.type === "multiple-choice" &&
        question.correctAnswer === answer.response
      ) {
        score += 1; // Correct answer
      }

      return { questionId: question._id, response: answer.response };
    });

    exam.submissions.push({
      studentId: student._id,
      answers: gradedAnswers,
      score, // Auto-graded score
      graded: false, // Open-ended questions need manual grading
    });

    await exam.save();
    res.status(201).json({ message: "Exam submitted successfully!", score });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error submitting exam", error: error.message });
  }
};

// ✅ Fetch exam results for a student
const getExamResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const student = req.user;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const submission = exam.submissions.find(
      (sub) => sub.studentId.toString() === student._id.toString()
    );
    if (!submission)
      return res.status(404).json({ message: "No submission found" });

    res.status(200).json({ submission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching exam results", error: error.message });
  }
};

// ✅ Grade an exam submission
const gradeExamSubmission = async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const teacher = req.user;
    const { grades, feedback } = req.body; // { questionId: gradeValue, overallFeedback: "Well done!" }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    const submission = exam.submissions.find(
      (sub) => sub.studentId.toString() === studentId
    );
    if (!submission)
      return res.status(404).json({ message: "Submission not found" });

    if (submission.graded) {
      return res.status(400).json({ message: "Submission already graded" });
    }

    let totalScore = submission.score; // Start with auto-graded score
    submission.answers.forEach((answer) => {
      if (grades[answer.questionId]) {
        totalScore += grades[answer.questionId]; // Add teacher-provided scores
      }
    });

    submission.score = totalScore;
    submission.graded = true;
    submission.feedback = feedback || "";

    await exam.save();
    res.status(200).json({ message: "Exam graded successfully!", submission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error grading exam", error: error.message });
  }
};

const getExamSubmissions = async (req, res) => {
  try {
    const { examId } = req.params;
    const teacher = req.user;

    const exam = await Exam.findById(examId).populate(
      "submissions.studentId",
      "name email"
    );
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    if (exam.teacherId.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    res.status(200).json({ submissions: exam.submissions });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching submissions", error: error.message });
  }
};

module.exports = {
  createExam,
  getSingleExam,
  getExamsByCourse,
  editExam,
  deleteExam,
  getAvailableExams,
  submitExam,
  getExamResults,
  gradeExamSubmission,
  getExamSubmissions,
};
