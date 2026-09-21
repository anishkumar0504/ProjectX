const { ApiError } = require("../utils/apiError");

exports.validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const msg = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    return next(new ApiError(400, msg));
  }
  req[source] = result.data;
  next();
};