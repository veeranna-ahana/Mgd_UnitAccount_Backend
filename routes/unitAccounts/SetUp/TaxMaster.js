const taxMaster = require("express").Router();
const { setupQueryMod } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");
const logger = require("../../../helpers/logger");

taxMaster.get("/getTaxData", (req, res, next) => {
  try {
    const sql = `SELECT
*,
DATE_FORMAT(EffectiveFrom, '%d/%m/%Y') AS FormattedEffectiveFrom,
DATE_FORMAT(EffectiveTO, '%d/%m/%Y') AS FormattedEffectiveTO
FROM magod_setup.taxdb;
`;

    const sql2 = `SELECT * FROM magod_setup.taxdb`;

    setupQueryMod(sql, (err, data) => {
      if (err) {
        logger.error(err);
        console.log("err in query", err);
      } else {
        return res.json({ Status: "Success", Result: data });
      }
    });
  } catch (error) {
    console.log("error", error);
    next(error);
  }
});

module.exports = taxMaster;
