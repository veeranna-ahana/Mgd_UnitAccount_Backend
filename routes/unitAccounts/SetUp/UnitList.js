const unitlist = require("express").Router();
// const cors = require('cors');
// const { dbco, dbco1, dbgetData, deleteUnitData, updateUnitData } = require("../../../helpers/dbconn")
const { setupQueryMod } = require("../../../helpers/dbconn");
const logger = require("../../../helpers/logger");
var bodyParser = require("body-parser");

unitlist.get("/getUnitData", (req, res, next) => {
  try {
    setupQueryMod(`SELECT * FROM magod_setup.magodlaser_units`, (err, data) => {
      if (err) {
        logger.error(err);
      } else {
        return res.json({ Status: "Success", Result: data });
      }
    });
  } catch (error) {
    console.log("error", error);
    next(error);
  }
});

module.exports = unitlist;
