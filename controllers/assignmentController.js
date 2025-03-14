const Assignment = require("../models/assignmentModel");
const {
  uploadFileToDropbox,
  replaceFileInDropbox,
} = require("../utils/functions/dropboxUpload");

const createAssignment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, dueDate } = req.body;
    const teacher = req.user;

    if (teacher.role !== "teacher")
      return res.status(403).json({ message: "Unauthorized!" });

    const newAssignment = new Assignment({
      courseId,
      teacherId: teacher._id,
      title,
      description,
      dueDate,
    });
    await newAssignment.save();

    res.status(201).json({
      message: "Assignment created successfully!",
      assignment: newAssignment,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating assignment", error: error.message });
  }
};

const getAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = req.user;
    const assignments = await Assignment.find({ courseId });

    if (user.role === "student") {
      const formattedAssignments = assignments.map((assignment) => {
        const submission = assignment.submissions.find(
          (sub) => sub.studentId.toString() === user._id.toString()
        );
        return {
          _id: assignment._id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          submitted: submission ? true : false,
          grade: submission ? submission.grade : null,
          feedback: submission ? submission.feedback : "",
        };
      });

      return res.status(200).json({
        message: "Assignments fetched successfully!",
        assignments: formattedAssignments,
      });
    }

    res
      .status(200)
      .json({ message: "Assignments fetched successfully!", assignments });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching assignments", error: error.message });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const student = req.user;
    if (student.role !== "student")
      return res.status(403).json({ message: "Unauthorized!" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    const fileData = await uploadFileToDropbox(
      `Assignments/${assignmentId}`,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    assignment.submissions.push({
      studentId: student._id,
      fileUrl: fileData.url,
      fileName: fileData.name,
    });
    console.log(assignment);
    await assignment.save();

    res.status(200).json({
      message: "Assignment submitted successfully!",
      submission: fileData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error submitting assignment", error: error.message });
  }
};

const gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { grade, feedback } = req.body;
    const teacher = req.user;

    if (teacher.role !== "teacher")
      return res.status(403).json({ message: "Unauthorized!" });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    const submission = assignment.submissions.find(
      (sub) => sub.studentId.toString() === studentId
    );
    if (!submission)
      return res.status(404).json({ message: "Submission not found" });

    submission.grade = grade;
    submission.feedback = feedback;

    await assignment.save();

    res
      .status(200)
      .json({ message: "Grade submitted successfully!", submission });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error grading assignment", error: error.message });
  }
};

const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacher = req.user;

    if (teacher.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    const assignment = await Assignment.findById(assignmentId).populate(
      "submissions.studentId",
      "name email"
    );
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    res.status(200).json({
      message: "Submissions fetched successfully!",
      submissions: assignment.submissions,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching submissions", error: error.message });
  }
};

const resubmitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const student = req.user;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    // Check if due date has passed
    if (new Date() > new Date(assignment.dueDate)) {
      return res
        .status(400)
        .json({ message: "Cannot resubmit. Due date has passed." });
    }

    // Check if the assignment has already been graded
    const submission = assignment.submissions.find(
      (sub) => sub.studentId.toString() === student._id.toString()
    );
    if (submission && submission.grade !== null) {
      return res.status(400).json({
        message: "Cannot resubmit. Assignment has already been graded.",
      });
    }

    // Upload new file to Dropbox
    const fileData = await replaceFileInDropbox(
      `Assignments/${assignmentId}`,
      submission.fileUrl,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    // Update student's submission with the new file
    if (submission) {
      submission.fileUrl = fileData.url;
      submission.fileName = fileData.name;
      submission.submittedAt = new Date();
    } else {
      assignment.submissions.push({
        studentId: student._id,
        fileUrl: fileData.url,
        submittedAt: new Date(),
      });
    }

    await assignment.save();
    res.status(200).json({
      message: "Assignment resubmitted successfully!",
      submission: fileData,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error resubmitting assignment", error: error.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const teacher = req.user;

    if (teacher.role !== "teacher") {
      return res.status(403).json({ message: "Unauthorized!" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment)
      return res.status(404).json({ message: "Assignment not found" });

    // Optional: Prevent deletion if submissions exist
    if (assignment.submissions.length > 0) {
      return res.status(400).json({
        message: "Cannot delete. Students have already submitted work.",
      });
    }

    await Assignment.findByIdAndDelete(assignmentId);
    res.status(200).json({ message: "Assignment deleted successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting assignment", error: error.message });
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  submitAssignment,
  gradeAssignment,
  getAssignmentSubmissions,
  resubmitAssignment,
  deleteAssignment,
};
