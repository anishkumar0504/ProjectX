const { z } = require("zod");

exports.registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

exports.generateDocSchema = z.object({
  templateSlug: z.string().min(1),
  meta: z.object({
    studentName: z.string().min(1),
    prn: z.string().min(1),
    facultyName: z.string().optional(),
    title: z.string().min(1),
    subject: z.string().optional(),
    program: z.string().optional(),
    school: z.string().optional(),
    namePrefix: z.string().optional(),
  }),
  
  // ✅ UPDATED: Accept String (JSON), Array (new format), or Object (legacy format)
  sections: z.union([
    z.string(), // Raw JSON string from FormData
    z.array(z.any()), // New array format: [{ id, type, title, enabled, proof }]
    z.object({
      aim: z.boolean().optional(),
      objectives: z.boolean().optional(),
      services: z.boolean().optional(),
      prerequisites: z.boolean().optional(),
      architecture: z.boolean().optional(),
      steps: z.boolean().optional(),
      verification: z.boolean().optional(),
      expectedOutput: z.boolean().optional(),
      conclusion: z.boolean().optional(),
      screenshotNote: z.boolean().optional(),
    }) // Legacy object format
  ]).optional(),

  imageLayout: z.enum(["perStep", "architectureOnly", "combineAll", "none"]).optional(),
  
  // ✅ UPDATED: Accept boolean or string (FormData sends "true"/"false")
  useGemini: z.union([z.boolean(), z.string()]).optional(),
  
  // ✅ ADDED: Allow frontend to bypass proof validation if needed
  allowMissingProof: z.union([z.boolean(), z.string()]).optional(),
});