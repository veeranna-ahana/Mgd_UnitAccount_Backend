const cancellVrListRouter = require("express").Router();
const { dailyReportQuery, setupQuery } = require("../../../../helpers/dbconn");
var bodyParser = require("body-parser");

cancellVrListRouter.get("/cancelVrInvoices", async (req, res, next) => {
  try {
    dailyReportQuery(
      `SELECT * FROM magodmis.canceled_vouchers_list c
        WHERE  c.RefVrType LIKE 'Service' OR c.RefVrType LIKE 'Job Work' OR c.RefVrType LIKE 'Sales'`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = cancellVrListRouter;
