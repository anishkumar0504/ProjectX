const bcrypt = require("bcryptjs");
exports.hash = (pw) => bcrypt.hash(pw, 10);
exports.hashSync = (pw) => bcrypt.hashSync(pw, 10);
exports.compare = (pw, h) => bcrypt.compare(pw, h);