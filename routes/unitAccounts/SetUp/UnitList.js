const unitlist = require("express").Router();
// const cors = require('cors');
// const { dbco, dbco1, dbgetData, deleteUnitData, updateUnitData } = require("../../../helpers/dbconn")
const { setupQueryMod } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

unitlist.get("/getUnitData", (req, res, next) => {
  console.log();
  try {
    setupQueryMod(`SELECT * FROM magod_setup.magodlaser_units`, (err, data) => {
      if (err) {
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

module.exports = unitlist;
