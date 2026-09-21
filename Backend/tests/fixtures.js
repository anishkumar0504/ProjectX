const path = require("path");

module.exports = {
  TEST_USER: {
    email: `testuser-${Date.now()}@example.com`,
    password: "securepass123",
  },

  TEST_USER_2: {
    email: `testuser2-${Date.now()}@example.com`,
    password: "anotherpass456",
  },

  VALID_META: {
    studentName: "ANISH KUMAR",
    prn: "20240802503",
    facultyName: "Ms. Tahreem Shaikh",
    title: "Access S3 from Private EC2 Instance using VPC Endpoint",
    subject: "Cloud Architecture and Services",
    program: "B.Tech TY (CCSA)",
    school: "School of Computer Science, Engineering and Applications(SCSEA)",
    namePrefix: "2503Anish",
  },

  VALID_SECTIONS: {
    aim: true,
    objectives: true,
    services: true,
    prerequisites: true,
    architecture: true,
    steps: true,
    verification: true,
    expectedOutput: true,
    conclusion: true,
    screenshotNote: true,
  },

  TEMPLATE_SLUG: "vpc-endpoint-s3",

  LOGO_PATH: path.join(__dirname, "../dypiu.png"),
};