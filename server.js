const express = require("express");
const bodyParser = require("body-parser");
// const fs = require("fs");
// const sax = require("sax");
const cors = require("cors");
const app = express();
app.use(bodyParser.json({ limit: "50mb" }));

require("dotenv").config();

const dailyReport = require("./helpers/dbconn.js");

app.use(cors());

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("hello");
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
  // logger.error(`Status Code : ${err.status}  - Error : ${err.message}`);
});

app.listen(process.env.PORT, () => {
  console.log("listening on port " + process.env.PORT);
  //    logger.info('listening on port ' + process.env.PORT);
});

const unitlist = require("./routes/UnitAccounts/SetUp/UnitList");
app.use("/unitlist", unitlist);

const taxMaster = require("./routes/UnitAccounts/SetUp/TaxMaster");
app.use("/taxMaster", taxMaster);

const billingDetails = require("./routes/UnitAccounts/Invoice/Daily/Billing_Details");
app.use("/billingDetails", billingDetails);

const customerOutstanding = require("./routes/UnitAccounts/Unit/Customer_OutStanding");
app.use("/customerOutstanding", customerOutstanding);

const vendorList = require("./routes/UnitAccounts/Unit/Purchase/Vendor_List");
app.use("/vendorList", vendorList);

const setupSync = require("./routes/unitAccounts/SetUp/Sync_setup");
app.use("/setupSync", setupSync);

const Payment_Receipts = require("./routes/unitAccounts/Unit/Payment_Receipts");
app.use("/Payment_Receipts", Payment_Receipts);

const monthlyReportRouter = require("./routes/unitAccounts/Unit/MonthlyReport.js");
app.use("/monthlyReportData", monthlyReportRouter);

const dailyReportRouter = require("./routes/unitAccounts/Unit/DailyReport.js");
app.use("/dailyReport", dailyReportRouter);

const custMonthlyReportRouter = require("./routes/unitAccounts/Invoice/Daily/CustMonthlyReport.js");
app.use("/custMonthlyReportData", custMonthlyReportRouter);

const accountSyncRouter = require("./routes/unitAccounts/Sync/AccountSync.js");
app.use("/accountSync", accountSyncRouter);

const sync = require("./routes/unitAccounts/SetUp/Sync_setup");
app.use("/showSync", sync);

const showSyncStatusRouter = require("./routes/unitAccounts/Sync/showSyncStatus.js");
app.use("/showSyncStatus", showSyncStatusRouter);

const fromHOUpdateSyncRouter = require("./routes/unitAccounts/Sync/fromHoUpdate.js");
app.use("/fromHoUpdate", fromHOUpdateSyncRouter);

const fromHOSyncRouter = require("./routes/unitAccounts/Sync/fromHoSync.js");
app.use("/fromHoSync", fromHOSyncRouter);

const cancellVrListRouter = require("./routes/unitAccounts/Invoice/Daily/cancellVrList.js");
app.use("/cancelVrList", cancellVrListRouter);

const userRouter = require("./routes/user");
app.use("/user", userRouter);

const mailRouter = require("./routes/unitAccounts/mailer");
app.use("/mailer", mailRouter);

const dailyReportPdfServerRouter = require("./routes/unitAccounts/PDF/DailyReportPdfServer.js");
app.use("/dailyReportPdfServer", dailyReportPdfServerRouter);
