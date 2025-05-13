const Student = require("../models/studentModel");
const Quiz = require("../models/quizModel");
const Assignment = require("../models/assignmentModel");

const getStudentAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    let quizzes = await Quiz.find({
      "submissions.studentId": studentId,
    }).populate("courseId", "title");
    let assignments = await Assignment.find({
      "submissions.studentId": studentId,
    }).populate("courseId", "title");

    // Optional: Filter by course
    if (courseId) {
      quizzes = quizzes.filter((q) => q.courseId._id.toString() === courseId);
      assignments = assignments.filter(
        (a) => a.courseId._id.toString() === courseId
      );
    }

    // Calculate per-quiz scores as percentage
    const quizScores = quizzes.flatMap((quiz) => {
      const totalPoints = quiz.questions.reduce(
        (sum, q) => sum + (q.points || 1),
        0
      );
      const submission = quiz.submissions.find(
        (s) => s.studentId.toString() === studentId
      );
      if (!submission || submission.score == null) return [];
      return [(submission.score / totalPoints) * 100];
    });

    const assignmentScores = assignments.flatMap((assignment) => {
      const submission = assignment.submissions.find(
        (s) => s.studentId.toString() === studentId
      );
      if (!submission || submission.grade == null) return [];
      return [submission.grade];
    });

    // Utility to compute average
    const getAverage = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    // Overall stats
    const overallPerformance = {
      totalQuizzes: quizzes.length,
      totalAssignments: assignments.length,
      quizAverage: getAverage(quizScores),
      assignmentAverage: getAverage(assignmentScores),
    };

    overallPerformance.averageScore =
      (overallPerformance.quizAverage + overallPerformance.assignmentAverage) /
      2;

    // Group by course with separate averages
    const coursePerformanceMap = {};

    quizzes.forEach((quiz) => {
      const cid = quiz.courseId._id.toString();
      const courseName = quiz.courseId.title;

      if (!coursePerformanceMap[cid]) {
        coursePerformanceMap[cid] = {
          courseId: cid,
          courseName,
          quizScores: [],
          assignmentScores: [],
        };
      }

      const totalPoints = quiz.questions.reduce(
        (sum, q) => sum + (q.points || 1),
        0
      );
      const submission = quiz.submissions.find(
        (s) => s.studentId.toString() === studentId
      );
      if (submission && submission.score != null) {
        const percent = (submission.score / totalPoints) * 100;
        coursePerformanceMap[cid].quizScores.push(percent);
      }
    });

    assignments.forEach((assignment) => {
      const cid = assignment.courseId._id.toString();
      const courseName = assignment.courseId.title;

      if (!coursePerformanceMap[cid]) {
        coursePerformanceMap[cid] = {
          courseId: cid,
          courseName,
          quizScores: [],
          assignmentScores: [],
        };
      }

      const submission = assignment.submissions.find(
        (s) => s.studentId.toString() === studentId
      );
      if (submission && submission.grade != null) {
        coursePerformanceMap[cid].assignmentScores.push(submission.grade);
      }
    });

    // Finalize course stats with separated and overall averages
    const coursePerformance = Object.values(coursePerformanceMap).map(
      (course) => ({
        ...course,
        quizAverage: getAverage(course.quizScores),
        assignmentAverage: getAverage(course.assignmentScores),
        averageScore: getAverage([
          ...course.quizScores,
          ...course.assignmentScores,
        ]),
      })
    );

    // Clean student object
    const { password, ...sanitizedStudent } = student.toObject();

    res.status(200).json({
      student: sanitizedStudent,
      overallPerformance,
      coursePerformance,
    });
  } catch (error) {
    console.error("Analytics Error:", error.message);
    res.status(500).json({
      message: "Error fetching student analytics",
      error: error.message,
    });
  }
};

const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;

    const quizzes = await Quiz.find({ courseId });
    const assignments = await Assignment.find({ courseId });

    const studentScores = {};

    // Aggregate student-level scores
    quizzes.forEach((quiz) => {
      const totalPoints = quiz.questions.reduce(
        (sum, q) => sum + (q.points || 1),
        0
      );
      quiz.submissions.forEach((sub) => {
        const id = sub.studentId.toString();
        if (!studentScores[id])
          studentScores[id] = { quizzes: [], assignments: [] };
        if (sub.score != null) {
          studentScores[id].quizzes.push((sub.score / totalPoints) * 100);
        }
      });
    });

    assignments.forEach((assignment) => {
      assignment.submissions.forEach((sub) => {
        const id = sub.studentId.toString();
        if (!studentScores[id])
          studentScores[id] = { quizzes: [], assignments: [] };
        if (sub.grade != null) {
          studentScores[id].assignments.push(sub.grade);
        }
      });
    });

    const studentIds = Object.keys(studentScores);

    // Fetch names from Student model
    const students = await Student.find({ _id: { $in: studentIds } }).select(
      "name email"
    );

    const aggregate = studentIds.map((studentId) => {
      const scores = studentScores[studentId];
      const quizAvg = scores.quizzes.length
        ? scores.quizzes.reduce((a, b) => a + b, 0) / scores.quizzes.length
        : 0;
      const assignAvg = scores.assignments.length
        ? scores.assignments.reduce((a, b) => a + b, 0) /
          scores.assignments.length
        : 0;

      const student = students.find((s) => s._id.toString() === studentId);

      return {
        studentId,
        studentName: student?.name || "Unknown",
        studentEmail: student?.email || "N/A",
        quizAverage: quizAvg,
        assignmentAverage: assignAvg,
        overallAverage: (quizAvg + assignAvg) / 2,
      };
    });

    // Class averages
    const classQuizAvg =
      aggregate.reduce((sum, s) => sum + s.quizAverage, 0) / aggregate.length;
    const classAssignAvg =
      aggregate.reduce((sum, s) => sum + s.assignmentAverage, 0) /
      aggregate.length;
    const classOverall = (classQuizAvg + classAssignAvg) / 2;

    res.status(200).json({
      classStats: {
        totalStudents: aggregate.length,
        averageQuizScore: classQuizAvg,
        averageAssignmentScore: classAssignAvg,
        averageOverallScore: classOverall,
      },
      studentBreakdown: aggregate,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching course analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentAnalytics,
  getCourseAnalytics,
};
