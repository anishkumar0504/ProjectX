"use strict";
/**
 * Run:
 *   node example.js --sample                                   (no API call, built-in sample content)
 *   GEMINI_API_KEY=xxx node example.js "Title"                 (calls Gemini)
 *   GEMINI_API_KEY=xxx node example.js "Title" --shots ./shots --ref ./my-steps.docx
 * Windows PowerShell:  $env:GEMINI_API_KEY="xxx"; node example.js "Title"
 * Install:  npm i docx mammoth      (optional: npm i sharp  -> shrinks screenshots before upload)
 */
const fs = require("fs");
const path = require("path");
const { generatePracticalContent } = require("./geminiService");
const { buildPracticalDocx } = require("./docBuilder");

const SAMPLE = {
  aim: "To configure a Gateway VPC Endpoint for Amazon S3 that enables a private EC2 instance, with no route to an Internet Gateway or NAT Gateway, to securely read from Amazon S3 over the AWS private network.",
  objectives: [
    "To understand how VPC endpoints provide private connectivity to AWS services.",
    "To create a VPC with a public subnet and a fully private subnet.",
    "To launch an EC2 instance in the private subnet without a public IP address.",
    "To create and attach an IAM role that grants the instance read access to Amazon S3.",
    "To create a Gateway VPC Endpoint for S3 and associate it with the private route table.",
  ],
  services: [
    { name: "Amazon VPC", purpose: "networking, subnets, and route tables" },
    { name: "Amazon EC2", purpose: "hosts the private instance" },
    { name: "Amazon S3", purpose: "target storage service accessed privately" },
    { name: "AWS IAM", purpose: "role and policy granting S3 access" },
  ],
  prerequisites: [
    "An active AWS Free-tier account with console access.",
    "Basic understanding of VPC, subnets, route tables, and IAM roles.",
    "An existing S3 bucket, or permission to create one.",
  ],
  architecture: {
    description:
      "A private EC2 instance with no public IP and no NAT Gateway route reaches Amazon S3 through a Gateway VPC Endpoint attached to the private subnet's route table. Management access is provided by AWS Systems Manager Session Manager.",
    caption: "Architecture diagram of the VPC Endpoint setup",
  },
  steps: [
    { title: "Create the VPC and Subnets", instructions: [
        'Navigate to the VPC Dashboard and click "Create VPC".',
        'Choose "VPC and more" so subnets and route tables are created automatically.',
        'Name the VPC "2503Anish-VPC".',
        'Set "NAT gateways" to "None" so the private subnet stays isolated.',
        'Click "Create VPC".',
      ], commands: [], screenshotCaption: "Create the VPC and Subnets", screenshotHint: 'VPC settings with "VPC and more" selected' },
    { title: "Launch EC2 Instance in the Private Subnet", instructions: [
        "Open the EC2 Dashboard and click Launch Instances.",
        'Name the instance "2503Anish-PrivateEC2".',
        "Choose an Amazon Linux 2023 AMI and the t3.micro instance type.",
        'Under Network settings select the new VPC, the private subnet, and set "Auto-assign public IP" to "Disable".',
      ], commands: [], screenshotCaption: "Launch EC2 Instance in the Private Subnet", screenshotHint: "Network settings with public IP disabled" },
    { title: "Create an IAM Role for S3 Access", instructions: [
        "Go to IAM > Roles > Create role.",
        'Select "AWS service" and choose "EC2" as the trusted entity.',
        'Attach the "AmazonS3ReadOnlyAccess" policy.',
        'Name the role "2503Anish-EC2-S3Role" and click "Create role".',
      ], commands: [], screenshotCaption: "Create an IAM Role for S3 Access", screenshotHint: "Role name and trust policy" },
    { title: "Create a Gateway VPC Endpoint for S3", instructions: [
        "Go to VPC > Endpoints > Create endpoint.",
        'Set "Service category" to "AWS services" and search for "s3".',
        'Select the service of type "Gateway" (com.amazonaws.us-east-1.s3).',
        "Select the VPC created in Step 1 and choose the private route table.",
        'Click "Create endpoint".',
      ], commands: [], screenshotCaption: "Create a Gateway VPC Endpoint for S3", screenshotHint: "Endpoint list showing status Available" },
    { title: "Test S3 Access from the Private Instance", instructions: [
        "Connect to the instance using Session Manager.",
        "Run the commands below and confirm both succeed.",
      ], commands: ["aws s3 ls", "aws s3 cp s3://2503anish-private-s3-test/anish_hello.txt .", "curl -I https://www.google.com"],
      screenshotCaption: "Test S3 Access from the Private Instance", screenshotHint: "Terminal output of the S3 commands and the failed curl" },
  ],
  verification: [
    'Confirmed the Gateway VPC Endpoint for S3 shows a state of "Available".',
    "Confirmed the private route table contains a route to the S3 prefix list pointing to the endpoint.",
    "Confirmed the private instance could list and download S3 objects without internet access.",
  ],
  expectedOutput:
    'Running "aws s3 ls" and "aws s3 cp" from the private instance completes successfully, while "curl" to a public website fails.',
  conclusion:
    "A Gateway VPC Endpoint for Amazon S3 was created and associated with the private subnet's route table. The private instance accessed S3 without a public IP, NAT Gateway or Internet Gateway. This shows how VPC endpoints improve security and can reduce data transfer costs.",
};

async function main() {
  // usage: node example.js --sample
  //        node example.js "Title" [--shots ./shots] [--ref ./my-steps.docx]
  const args = process.argv.slice(2);
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
  const title = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));

  const meta = {
    studentName: "ANISH KUMAR",
    prn: "20240802503",
    facultyName: "Ms. Tahreem Shaikh",
    title: title || "Access S3 from Private EC2 Instance using VPC Endpoint",
    logoPath: path.join(__dirname, "dypiu.png"),
  };

  let content = SAMPLE;
  let screenshots = {};

  if (title) {
    // screenshots: every png/jpg in the folder, sorted by file name = the order you took them
    const dir = opt("--shots");
    const files = dir
      ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort().map((f) => path.join(dir, f))
      : [];

    content = await generatePracticalContent({
      title,
      namePrefix: "2503Anish",
      referenceDocx: opt("--ref") || undefined, // your own steps (.docx) = source of truth
      images: files.map((p) => ({ path: p, name: path.basename(p) })),
    });
    fs.writeFileSync("last-gemini-response.json", JSON.stringify(content, null, 2)); // handy for debugging

    // docBuilder places the images using content.steps[i].shots -> screenshots.all[index]
    screenshots = { all: files };
    if (content.unassigned?.length) console.log("Not placed (review these):", content.unassigned.map((i) => files[i]));
    if (content.reassigned?.length) console.log("Moved by the order check:", content.reassigned.map((i) => files[i]));
  }

  const buf = await buildPracticalDocx({
    meta, content, screenshots,
    options: { placeholders: "box", appendUnassigned: false },
  });
  fs.writeFileSync("practical.docx", buf);
  console.log("Created practical.docx");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

/* ── Express route (frontend → Gemini → docx) ─────────────────────────────
const express = require("express");
const multer = require("multer");                       // npm i express multer
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.post("/api/practical", upload.any(), async (req, res) => {
  try {
    const { title, studentName, prn, facultyName, namePrefix } = req.body;
    // fields: "shot" (many, in the order taken) and optional "ref" (.docx with your own steps)
    const shots = (req.files || []).filter((f) => f.fieldname === "shot");
    const ref = (req.files || []).find((f) => f.fieldname === "ref");
    const content = await generatePracticalContent({
      title, namePrefix,
      referenceDocx: ref?.buffer,
      images: shots.map((f) => ({ data: f.buffer, name: f.originalname })),
    });
    const buf = await buildPracticalDocx({
      meta: { studentName, prn, facultyName, title, logoPath: path.join(__dirname, "dypiu.png") },
      content,
      screenshots: { all: shots.map((f) => f.buffer) },
    });
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="practical.docx"',
    }).send(buf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.listen(3000);
*/