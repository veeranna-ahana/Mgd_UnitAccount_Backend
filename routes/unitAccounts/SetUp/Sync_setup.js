const sync = require("express").Router();
const {
  setupQueryMod,
  setupsyncQueryMod,
  hqQuery,
} = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

sync.get("/getdata", (req, res, next) => {
  try {
    const sql =
      "SELECT 'Jigani' AS UnitName,d.* FROM magodmis.draft_dc_inv_register d WHERE d.`Inv_no` IS NOT NULL AND d.`DCStatus` NOT LIKE 'Closed' AND  d.`DCStatus` NOT LIKE 'Cancelled'";
    setupQueryMod(sql, (err, data) => {
      if (err) {
        console.log("err in query");
      } else {
        console.log("data", data);
        return res.json({ Status: "Success", Result: data });
      }
    });
  } catch (error) {
    console.log("error", error);
    next(error);
  }
});

sync.get("/getreceiptdata", (req, res) => {
  const sql =
    "SELECT 'Jigani' AS UnitName, ROW_NUMBER()  OVER (ORDER BY  p.RecdPVID ) AS Id, p.* FROM magodmis.payment_recd_voucher_register p WHERE p.`ReceiptStatus` NOT LIKE 'Closed'";
  setupQueryMod(sql, (err, result) => {
    if (err) {
      //console.log("error", err);
      return res.json({ Error: "err in query" });
    } else {
      //  console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

sync.get("/getHOdata", (req, res, next) => {
  try {
    const sql =
      "SELECT 'Jigani' AS UnitName,d.* FROM magodmis.draft_dc_inv_register d WHERE d.`Inv_no` IS NOT NULL AND d.`DCStatus` NOT LIKE 'Closed' AND  d.`DCStatus` NOT LIKE 'Cancelled'";
    setupQueryMod(sql, (err, data) => {
      if (err) {
        console.log("err in query");
      } else {
        console.log("data", data);
        return res.json({ Status: "Success", Result: data });
      }
    });
  } catch (error) {
    console.log("error", error);
    next(error);
  }
});

sync.get("/getHOreceiptdata", (req, res) => {
  const sql =
    "SELECT 'Jigani' AS UnitName, ROW_NUMBER()  OVER (ORDER BY  p.RecdPVID ) AS Id, p.* FROM magodmis.payment_recd_voucher_register p WHERE p.`ReceiptStatus` NOT LIKE 'Closed'";
  setupQueryMod(sql, (err, result) => {
    if (err) {
      //console.log("error", err);
      return res.json({ Error: "err in query" });
    } else {
      //  console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

// sync.post('/postData', (req, res) => {
//     console.log(req.body)
//         if(req.body.open_inv.length>0){
//         for(let i=0;i<req.body.open_inv.length;i++){
//             setupQueryMod(`Update magodmis.draft_dc_inv_register set PymtAmtRecd='${req.body.open_inv[i].HO_PymtAmtRecd}', GrandTotal='${req.body.open_inv[i].HO_GrandTotal}', DCStatus='${req.body.open_inv[i].HO_DCStatus}' where DC_Inv_No='${req.body.open_inv[i].DC_Inv_No}';` , (err, results) => {
//                       if (err) {
//                           console.log("33");
//                           console.log(err);
//                           //return res.json({  status:'query',Error: 'failed to update data' });
//                       }
//                       else {
//                           console.log("4");
//                           //return res.json({ Status: 'Success', result: "updated invoices successfully" })
//                       }
//               })
//           }}
//           if(req.body.open_rec.length>0){
//           for(let i=0;i<req.body.open_rec.length;i++){
//             setupQueryMod(`Update magodmis.payment_recd_voucher_register set On_account='${req.body.open_rec[i].HO_On_account}', ReceiptStatus='${req.body.open_rec[i].HO_ReceiptStatus}' where RecdPVID='${req.body.open_rec[i].RecdPVID}';` , (err, results) => {
//                       if (err) {
//                           console.log("33");
//                           console.log(err);
//                           //return res.json({  status:'query',Error: 'failed to update data' });
//                       }
//                       else {
//                           console.log("4");
//                           //return res.json({ Status: 'Success', result: "updated receipts successfully" })
//                       }
//               })
//           }
//         }
//         return res.json({ Status: 'Success', result: "updated successfully" });
//         })

sync.post("/postData", async (req, res) => {
  try {
    console.log(req.body);

    if (req.body.open_inv.length > 0) {
      for (let i = 0; i < req.body.open_inv.length; i++) {
        console.log(i);
        await setupsyncQueryMod(
          `Update magodmis.draft_dc_inv_register set PymtAmtRecd='${req.body.open_inv[i].HO_PymtAmtRecd}', GrandTotal='${req.body.open_inv[i].HO_GrandTotal}', DCStatus='${req.body.open_inv[i].HO_DCStatus}' where DC_Inv_No='${req.body.open_inv[i].DC_Inv_No}';`
        );
      }
    }

    if (req.body.open_rec.length > 0) {
      for (let i = 0; i < req.body.open_rec.length; i++) {
        await setupsyncQueryMod(
          `Update magodmis.payment_recd_voucher_register set On_account='${req.body.open_rec[i].HO_On_account}', ReceiptStatus='${req.body.open_rec[i].HO_ReceiptStatus}' where RecdPVID='${req.body.open_rec[i].RecdPVID}';`
        );
      }
    }

    return res.json({ Status: "Success", result: "updated successfully" });
  } catch (error) {
    console.error(error);
    return res.json({ Status: "Error", result: "failed to update data" });
  }
});



module.exports = sync;
