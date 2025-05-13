const Admin = require("../../models/adminModel");
const bcrypt = require("bcryptjs");

const ensureDefaultAdmin = async () => {
  const existingAdmin = await Admin.findOne({ email: "admin@example.com" });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin@1234", 10);

    const newAdmin = new Admin({
      name: "Super Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();
    console.log("✅ Default admin created: admin@example.com / Admin@1234");
  } else {
    console.log("🔒 Admin already exists. Skipping default admin creation.");
  }
};

module.exports = ensureDefaultAdmin;
