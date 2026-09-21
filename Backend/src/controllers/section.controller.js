const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Available section types
const AVAILABLE_SECTIONS = [
  { id: "aim", label: "Aim", description: "The primary objective of this practical", defaultEnabled: true, screenshotRequired: false },
  { id: "objectives", label: "Objectives", description: "Specific goals to be achieved", defaultEnabled: true, screenshotRequired: false },
  { id: "services", label: "Services Used", description: "Cloud or technical services utilized", defaultEnabled: true, screenshotRequired: false },
  { id: "prerequisites", label: "Prerequisites", description: "Requirements before starting", defaultEnabled: true, screenshotRequired: false },
  { id: "architecture", label: "Architecture Diagram", description: "Visual representation of the setup", defaultEnabled: true, screenshotRequired: false },
  { id: "steps", label: "Step-by-Step Implementation", description: "Detailed instructions to follow", defaultEnabled: true, screenshotRequired: true },
  { id: "verification", label: "Verification / Testing", description: "Steps to confirm success", defaultEnabled: true, screenshotRequired: false },
  { id: "expectedOutput", label: "Expected Output", description: "What the result should look like", defaultEnabled: true, screenshotRequired: false },
  { id: "conclusion", label: "Result / Conclusion", description: "Final summary of the practical", defaultEnabled: true, screenshotRequired: false },
];

exports.getAvailableSections = async (req, res) => {
  try {
    res.json({ sections: AVAILABLE_SECTIONS });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available sections" });
  }
};

exports.getTemplateSections = async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await prisma.template.findUnique({
      where: { id: templateId },
      select: { defaultSections: true, sectionOrder: true },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const defaultSections = JSON.parse(template.defaultSections || "{}");
    const sectionOrder = JSON.parse(template.sectionOrder || "[]");

    // Combine available sections with template configuration
    const configuredSections = AVAILABLE_SECTIONS.map(section => ({
      ...section,
      enabled: defaultSections[section.id] ?? section.defaultEnabled,
      screenshotRequired: section.id === "steps" ? true : false,
      order: sectionOrder.indexOf(section.id) !== -1 ? sectionOrder.indexOf(section.id) : 999,
    })).sort((a, b) => a.order - b.order);

    res.json({ sections: configuredSections });
  } catch (error) {
    console.error("Error fetching template sections:", error);
    res.status(500).json({ error: "Failed to fetch template sections" });
  }
};

exports.updateDocumentSections = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { sections, sectionOrder } = req.body;

    // Validate sections
    if (!sections || typeof sections !== "object") {
      return res.status(400).json({ error: "Invalid sections configuration" });
    }

    // Ensure at least one section is enabled
    const enabledCount = Object.values(sections).filter(v => v === true).length;
    if (enabledCount === 0) {
      return res.status(400).json({ error: "At least one section must be enabled" });
    }

    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        sections: JSON.stringify(sections),
        sectionOrder: sectionOrder ? JSON.stringify(sectionOrder) : null,
      },
    });

    res.json({ 
      message: "Sections updated successfully",
      document: {
        id: document.id,
        sections: JSON.parse(document.sections),
        sectionOrder: document.sectionOrder ? JSON.parse(document.sectionOrder) : null,
      }
    });
  } catch (error) {
    console.error("Error updating sections:", error);
    res.status(500).json({ error: "Failed to update sections" });
  }
};

exports.addCustomSection = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title, description, screenshotRequired } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Section title is required" });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { sections: true, sectionOrder: true },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const currentSections = JSON.parse(document.sections || "{}");
    const currentOrder = JSON.parse(document.sectionOrder || "[]");
    
    const customId = `custom_${Date.now()}`;
    
    // Add custom section to configuration
    currentSections[customId] = {
      title: title.trim(),
      description: description?.trim() || "",
      enabled: true,
      screenshotRequired: screenshotRequired || false,
      isCustom: true,
    };

    // Add to end of order
    currentOrder.push(customId);

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        sections: JSON.stringify(currentSections),
        sectionOrder: JSON.stringify(currentOrder),
      },
    });

    res.json({
      message: "Custom section added successfully",
      sectionId: customId,
      sections: JSON.parse(updated.sections),
    });
  } catch (error) {
    console.error("Error adding custom section:", error);
    res.status(500).json({ error: "Failed to add custom section" });
  }
};