const Student = require("../models/studentModel");
const Quiz = require("../models/quizModel");
const Assignment = require("../models/assignmentModel");

const getStudentAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, timeRange } = req.query;

    // Fetch student details
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Fetch quizzes, exams, and assignments based on filters
    let quizzes = await Quiz.find({
      "submissions.studentId": studentId,
    }).populate("courseId", "title");
    let assignments = await Assignment.find({
      "submissions.studentId": studentId,
    }).populate("courseId", "title");

    // Filter by course if needed
    if (courseId) {
      quizzes = quizzes.filter((q) => q.courseId.toString() === courseId);
      assignments = assignments.filter(
        (a) => a.courseId.toString() === courseId
      );
    }

    // Calculate averages
    const getAverage = (arr) =>
      arr.length ? arr.reduce((sum, val) => sum + val, 0) / arr.length : 0;

    const overallPerformance = {
      totalQuizzes: quizzes.length,
      totalAssignments: assignments.length,
      quizAverage: getAverage(
        quizzes.flatMap((q) => q.submissions.map((s) => s.score))
      ),
      assignmentAverage: getAverage(
        assignments.flatMap((a) => a.submissions.map((s) => s.score))
      ),
    };
    overallPerformance.averageScore =
      (overallPerformance.quizAverage +
        overallPerformance.assignmentAverage) /
      3;

    // Group by course
    const coursePerformance = {};
    [...quizzes, ...assignments].forEach((item) => {
      const cid = item.courseId._id.toString();
      if (!coursePerformance[cid]) {
        coursePerformance[cid] = {
          courseId: cid,
          courseName: item.courseId.title || "Unknown Course",
          quizScores: [],
          assignmentScores: [],
        };
      }
      if (item.type === "quiz")
        coursePerformance[cid].quizScores.push(
          ...item.submissions.map((s) => s.score)
        );
      if (item.type === "assignment")
        coursePerformance[cid].assignmentScores.push(
          ...item.submissions.map((s) => s.score)
        );
    });

    // Convert to array
    const coursePerformanceArray = Object.values(coursePerformance);
    coursePerformanceArray.forEach((course) => {
      course.averageScore = getAverage([
        ...course.quizScores,
        ...course.assignmentScores,
      ]);
    });

    const { password, ...modifiedStudent } = student.toObject();

    res.status(200).json({
      modifiedStudent,
      overallPerformance,
      coursePerformance: coursePerformanceArray,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching student analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getStudentAnalytics,
};
