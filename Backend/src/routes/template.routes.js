    const router = require("express").Router();
    const ctrl = require("../controllers/template.controller");
    // ⚠️  NO auth middleware — testing phase
    router.get("/", ctrl.list);
    router.get("/:slug", ctrl.get);
    module.exports = router;