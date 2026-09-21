const templateService = require("../services/template.service");

exports.list = async (_req, res, next) => {
  try {
    const templates = await templateService.list();
    res.json({ templates });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const t = await templateService.getBySlug(req.params.slug);
    res.json({ template: t });
  } catch (e) { next(e); }
};