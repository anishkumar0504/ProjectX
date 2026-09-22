const templateService = require("../services/template.service");

exports.list = async (_req, res, next) => {
  try {
    const templates = await templateService.list();
    res.json({ templates });
  } catch (e) { 
    next(e); 
  }
};

exports.get = async (req, res, next) => {
  try {
    const t = await templateService.getBySlug(req.params.slug);
    if (!t) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.json({ template: t });
  } catch (e) { 
    next(e); 
  }
};