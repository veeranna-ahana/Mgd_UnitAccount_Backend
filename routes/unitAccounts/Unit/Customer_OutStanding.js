const customerOutstanding = require("express").Router();
// const cors = require('cors');
// const { dbco, dbco1, dbgetData, deleteUnitData, updateUnitData } = require("../../../helpers/dbconn")
const { setupQueryMod } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");
const logger = require("../../../helpers/logger");

customerOutstanding.get("/unitNames", (req, res) => {
  // const sql = `SELECT DISTINCT UnitName FROM magod_setup.magodlaser_units;`;
  const sql = `SELECT DISTINCT UnitName , PhonePrimary, PhoneSecondary,URL, GST_No, CIN_No,Unit_Address, Email FROM magod_setup.magodlaser_units where UnitName='Jigani';`;
 
  setupQueryMod(sql, (err, result) => {
    if (err) {
      logger.error(err);
    } else {
      
      return res.json({ Result: result });
    }
  });
});



customerOutstanding.get("/unitOutstandingData", (req, res) => {
  const unitname = req.query.unitname;

  const sqlQ = `
        SELECT @UnitName AS UnitName, u.*, a.OutStandingInvoiceCount, a.OutStandingAmount
        FROM magodmis.cust_data u
        INNER JOIN (
            SELECT
                COUNT(u.\`Cust_Code\`) AS OutStandingInvoiceCount,
                SUM(u.\`GrandTotal\` - u.\`PymtAmtRecd\`) AS OutStandingAmount,
                u.\`Cust_Code\`
            FROM magodmis.draft_Dc_Inv_Register u
            WHERE u.\`GrandTotal\` - u.\`PymtAmtRecd\` > 0
                AND u.\`DCStatus\` NOT LIKE 'Closed'
                AND u.\`Inv_No\` IS NOT NULL 
                AND u.\`Inv_Date\` <'2018-02-04'    
            GROUP BY u.\`Cust_Code\`
        ) AS a ON a.\`Cust_Code\` = u.\`Cust_Code\` ;
    `;

  const UnitNameQuery = `
    SELECT '${unitname}' AS UnitName, u.*, a.OutStandingInvoiceCount, a.OutStandingAmount
    FROM magodmis.cust_data u
    INNER JOIN (
        SELECT
            COUNT(u.\`Cust_Code\`) AS OutStandingInvoiceCount,
            SUM(u.\`GrandTotal\` - u.\`PymtAmtRecd\`) AS OutStandingAmount,
            u.\`Cust_Code\`
        FROM magodmis.draft_Dc_Inv_Register u
        WHERE u.\`GrandTotal\` - u.\`PymtAmtRecd\` > 0
            AND u.\`DCStatus\` NOT LIKE 'Closed'
            AND u.\`Inv_No\` IS NOT NULL 
              
        GROUP BY u.\`Cust_Code\`
    ) AS a ON a.\`Cust_Code\` = u.\`Cust_Code\` 
    WHERE   '${unitname}'  = (SELECT UnitName FROM magod_setup.magodlaser_units WHERE UnitName = '${unitname}' );
    
`;

  setupQueryMod(UnitNameQuery, (err, result) => {
    if (err) {
      logger.error(err);
      console.log("err in query", err);
    } else {
      //  console.log("success", result);
      return res.json({ Result: result });
    }
  });
});

customerOutstanding.get("/getCustomers", (req, res) => {
  const sql = `SELECT DISTINCT Cust_Code, Cust_name FROM magodmis.cust_data `;
  //  const sql=`
  // SELECT DISTINCT Cust_Code , Cust_Name FROM magodmis.draft_dc_inv_register `;
  setupQueryMod(sql, (err, result) => {
    if (err) {
      logger.error(err);
      console.log("err in query", err);
    } else {
      // console.log("cust sql query 500 change", result);
      return res.json({ Result: result });
    }
  });
});

// customerOutstanding.get("/getDataBasedOnCustomer", (req, res) => {
//   const custcode = req.query.selectedCustCode;
//   const selectedDCType = req.query.selectedDCType;
//   const invoiceFor = req.query.flag;
//   console.log("custcode, ", custcode);
//   console.log("dctype", selectedDCType);
//   console.log("invoiceFor, ", invoiceFor);

//   if (custcode === " " && (selectedDCType !== "" || invoiceFor !== "")) {
//     return res.json({ Result: "customer err" });
//   }

//   if (selectedDCType !== "" && invoiceFor === "") {
//     if (selectedDCType === "ALL") {
//       const sql2 = `SELECT
// u.PO_No,
// u.Inv_No,
// @UnitName AS UnitName,
// u.GrandTotal - u.PymtAmtRecd AS Balance,
// DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
// u.InvoiceFor,
// u.DCStatus,
// u.DC_InvType,
// u.Inv_Date,
// u.GrandTotal,
// u.Cust_Name,
// u.PymtAmtRecd,u.PIN_Code,u.DC_Inv_No,
// (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
// FROM magodmis.draft_dc_inv_register u
// WHERE
// u.Cust_Code = '${custcode}'
// AND u.Inv_No IS NOT NULL
// AND u.dcstatus NOT LIKE 'Closed';
// `;
//       setupQueryMod(sql2, (err, result) => {
//         if (err) {
//           console.log("err in query", err);
//         } else {
//           console.log("cust code result1 alllll", result);
//           return res.json({ Result: result });
//         }
//       });
//     } else {
//       const sql2 = `SELECT
//     u.PO_No,
//     u.Inv_No,
//     @UnitName AS UnitName,
//     u.GrandTotal - u.PymtAmtRecd AS Balance,
//     DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
//     u.InvoiceFor,
//     u.DCStatus,
//     u.DC_InvType,
//     u.Inv_Date,
//     u.GrandTotal,
//     u.Cust_Name,
//     u.PymtAmtRecd,u.PIN_Code, u.DC_Inv_No,
//     (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
//     FROM magodmis.draft_dc_inv_register u
//     WHERE    u.DC_InvType='${selectedDCType}' AND
//     u.Cust_Code = '${custcode}'
//     AND u.Inv_No IS NOT NULL
//     AND u.dcstatus NOT LIKE 'Closed';
//     `;

//       setupQueryMod(sql2, (err, result) => {
//         if (err) {
//           console.log("err in query", err);
//         } else {
//           if (result.length === 0) {
//             return res.json({ Result: "select dc type" });
//           } else {
//             //  console.log("cust code result2222", result);
//             return res.json({ Result: result });
//           }
//         }
//       });
//     }
//   } else if (selectedDCType !== "" && invoiceFor !== "") {
//     if (selectedDCType === "Sales & Jobwork") {
//       const sql2 = `SELECT
//     u.PO_No,
//     u.Inv_No,
//     @UnitName AS UnitName,
//     u.GrandTotal - u.PymtAmtRecd AS Balance,
//     DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
//     u.InvoiceFor,
//     u.DCStatus,
//     u.DC_InvType,
//     u.Inv_Date,
//     u.GrandTotal,
//     u.Cust_Name,
//     u.PymtAmtRecd,u.PIN_Code,u.DC_Inv_No,
//     (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
//     FROM magodmis.draft_dc_inv_register u
//     WHERE    u.DC_InvType IN ('Sales', 'Job Work')   AND u.InvoiceFor='${invoiceFor}' AND
//     u.Cust_Code = '${custcode}'
//     AND u.Inv_No IS NOT NULL
//     AND u.dcstatus NOT LIKE 'Closed';
//     `;

//       setupQueryMod(sql2, (err, result) => {
//         if (err) {
//           console.log("err in query", err);
//         } else {
//           if (result.length === 0) {
//             return res.json({ Result: "error in invoice for" });
//           } else {
//             //   console.log("cust code 4", result);
//             return res.json({ Result: result });
//           }
//         }
//       });
//     } else {
//       //         const sql2 = `SELECT
//       //     u.dc_Inv_No AS Id,
//       //     @UnitName AS UnitName,

//       //     u.GrandTotal - u.PymtAmtRecd AS Balance,
//       //     DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
//       //     u.Inv_No, u.InvoiceFor,  u.DCStatus, u.DC_InvType,u.Inv_Date, u.GrandTotal,
//       //     u.Cust_Name,u.PO_No,u.PymtAmtRecd,
//       //     (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
//       // FROM magodmis.draft_dc_inv_register u
//       // WHERE    u.DC_InvType='${selectedDCType}'   AND u.InvoiceFor='${invoiceFor}' AND
//       //     u.Cust_Code = '${custcode}'

//       //     AND u.Inv_No IS NOT NULL
//       //     AND u.dcstatus NOT LIKE 'Closed';

//       // `

//       const sql2 = `SELECT
//     u.PO_No,
//     u.Inv_No,
//     @UnitName AS UnitName,
//     u.GrandTotal - u.PymtAmtRecd AS Balance,
//     DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
//     u.InvoiceFor,
//     u.DCStatus,
//     u.DC_InvType,
//     u.Inv_Date,
//     u.GrandTotal,
//     u.Cust_Name,
//     u.PymtAmtRecd,u.PIN_Code,u.DC_Inv_No,
//     (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
//     FROM magodmis.draft_dc_inv_register u
//     WHERE     u.DC_InvType='${selectedDCType}'  AND u.InvoiceFor='${invoiceFor}' AND
//     u.Cust_Code = '${custcode}'
//     AND u.Inv_No IS NOT NULL
//     AND u.dcstatus NOT LIKE 'Closed';
//     `;

//       setupQueryMod(sql2, (err, result) => {
//         if (err) {
//           console.log("err in query", err);
//         } else {
//           if (result.length === 0) {
//             return res.json({ Result: "error in invoice for" });
//           } else {
//             // console.log("cust code result4444", selectedDCType, );
//             return res.json({ Result: result });
//           }
//         }
//       });
//     }
//   }
// });

customerOutstanding.get("/getDataBasedOnCustomer", (req, res) => {
  const custcode = req.query.selectedCustCode;
  const selectedDCType = req.query.selectedDCType;
  const invoiceFor = req.query.flag;
  console.log("custcode, ", custcode);
  console.log("dctype", selectedDCType);
  console.log("invoiceFor, ", invoiceFor);

  const sql1 = `SELECT
u.PO_No,
u.Inv_No,
@UnitName AS UnitName,
u.GrandTotal - u.PymtAmtRecd AS Balance,
DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
u.InvoiceFor,  
u.DCStatus, 
u.DC_InvType,
u.Inv_Date, 
u.GrandTotal,
u.Cust_Name,
u.PymtAmtRecd,u.PIN_Code,u.DC_Inv_No,
(SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
FROM magodmis.draft_dc_inv_register u
WHERE    
u.Cust_Code = '${custcode}'
AND u.Inv_No IS NOT NULL
AND u.dcstatus NOT LIKE 'Closed';`;
  const sql2 = `SELECT
    u.PO_No,
    u.Inv_No,
    @UnitName AS UnitName,
    u.GrandTotal - u.PymtAmtRecd AS Balance,
    DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
    u.InvoiceFor,  
    u.DCStatus, 
    u.DC_InvType,
    u.Inv_Date, 
    u.GrandTotal,
    u.Cust_Name,
    u.PymtAmtRecd,u.PIN_Code, u.DC_Inv_No,
    (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
    FROM magodmis.draft_dc_inv_register u
    WHERE    u.DC_InvType='${selectedDCType}' AND 
    u.Cust_Code = '${custcode}'
    AND u.Inv_No IS NOT NULL
    AND u.dcstatus NOT LIKE 'Closed'`;
  const sql3 = `SELECT
    u.PO_No,
    u.Inv_No,
    @UnitName AS UnitName,
    u.GrandTotal - u.PymtAmtRecd AS Balance,
    DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
    u.InvoiceFor,  
    u.DCStatus, 
    u.DC_InvType,
    u.Inv_Date, 
    u.GrandTotal,
    u.Cust_Name,
    u.PymtAmtRecd,u.PIN_Code,u.DC_Inv_No,
    (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
    FROM magodmis.draft_dc_inv_register u
    WHERE    u.DC_InvType='${selectedDCType}'  AND u.InvoiceFor='${invoiceFor}' AND 
    u.Cust_Code = '${custcode}'
    AND u.Inv_No IS NOT NULL
    AND u.dcstatus NOT LIKE 'Closed'`;
  const salesAndJobWork_Without_InvoiceFor = `SELECT
    u.PO_No,
    u.Inv_No,
    @UnitName AS UnitName,
    u.GrandTotal - u.PymtAmtRecd AS Balance,
    DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
    u.InvoiceFor,  
    u.DCStatus, 
    u.DC_InvType,
    u.Inv_Date, 
    u.GrandTotal,
    u.Cust_Name,
    u.PymtAmtRecd,u.PIN_Code,u.DC_Inv_No,
    (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
    FROM magodmis.draft_dc_inv_register u
    WHERE    u.DC_InvType IN ('Sales', 'Job Work')    AND 
    u.Cust_Code = '${custcode}'
    AND u.Inv_No IS NOT NULL
    AND u.dcstatus NOT LIKE 'Closed'`;
  const salesANDjobwork = `SELECT
    u.PO_No,
    u.Inv_No,
    @UnitName AS UnitName,
    u.GrandTotal - u.PymtAmtRecd AS Balance,
    DATEDIFF(CURRENT_DATE(), u.inv_date) AS duedays,
    u.InvoiceFor,  
    u.DCStatus, 
    u.DC_InvType,
    u.Inv_Date, 
    u.GrandTotal,
    u.Cust_Name,
    u.PymtAmtRecd,u.PIN_Code,u.DC_Inv_No,
    (SELECT SUM(GrandTotal) FROM magodmis.draft_dc_inv_register WHERE Cust_Code = '${custcode}' AND Inv_No IS NOT NULL AND dcstatus NOT LIKE 'Closed') AS Amount_Due
    FROM magodmis.draft_dc_inv_register u
    WHERE    u.DC_InvType IN ('Sales', 'Job Work')   AND u.InvoiceFor='${invoiceFor}' AND 
    u.Cust_Code = '${custcode}'
    AND u.Inv_No IS NOT NULL
    AND u.dcstatus NOT LIKE 'Closed'`;

  if (custcode === " " && (selectedDCType !== "" || invoiceFor !== "")) {
    return res.json({ Result: "customer err" });
  }

  if (selectedDCType !== "" && invoiceFor === "") {
    if (selectedDCType !== "ALL" && selectedDCType !== "Sales & Jobwork") {
      setupQueryMod(sql2, (err, result) => {
        if (err) {
          logger.error(err);
          console.log("err in query", err);
        } else {
          console.log("unitname, dc type, cust code  sql2", result);
          return res.json({ Result: result });
        }
      });
    } else if (selectedDCType === "ALL") {
      setupQueryMod(sql1, (err, result) => {
        if (err) {
          logger.error(err);
          console.log("err in query", err);
        } else {
          console.log("cust code for ALL  sql1", result.length);
          return res.json({ Result: result });
        }
      });
    } else if (selectedDCType === "Sales & Jobwork") {
      setupQueryMod(salesAndJobWork_Without_InvoiceFor, (err, result) => {
        if (err) {
          logger.error(err);
          console.log("err in query", err);
        } else {
          console.log("salesAndJobWork_Without_InvoiceFor", result.length);
          return res.json({ Result: result });
        }
      });
    } else {
      setupQueryMod(sql3, (err, result) => {
        if (err) {
          logger.error(err);
          console.log("err in query", err);
        } else {
          if (result.length === 0) {
            console.log("result length", result.length);
            return res.json({ Result: "error in invoice for" });
          } else {
            console.log(" sql3", result);
            return res.json({ Result: result });
          }
        }
      });
    }
  } 
  else if (selectedDCType !== "" && invoiceFor !== "") {
    console.log("sales or  jobworkkkkkk");
    if (selectedDCType === "Sales & Jobwork") {
      setupQueryMod(salesANDjobwork, (err, result) => {
        if (err) {
          logger.error(err);
          console.log("sales nad jobwork error ", err);
          console.log("err in query", err);
        } else {
          if (result.length === 0) {
            console.log(
              "sales nad jobwork error  result length",
              result.length
            );
            return res.json({ Result: "error in invoice for" });
          } else {
            console.log("salesANDjobwork", result);
            return res.json({ Result: result });
          }
        }
      });
    } else {
      console.log("hii");

      setupQueryMod(sql3, (err, result) => {
        if (err) {
          logger.error(err);
          console.log("err in query", err);
        } else {
          if (result.length === 0) {
            console.log("result.length === 0   sql3");
            return res.json({ Result: "error in invoice for" });
          } else {
            console.log("sql3", result.length);
            return res.json({ Result: result });
          }
        }
      });
    }
  }
});
customerOutstanding.get("/getDataTable2", (req, res) => {
  const DC_Inv_No = req.query.selectedDCInvNo;
  console.log("DC_INV_NO", DC_Inv_No);
  const sql = `SELECT CONCAT('HO/', h1.HORef) AS VrRef, h.Receive_Now, h1.TxnType, h1.Status AS VrStatus
        FROM magodmis.ho_paymentrv_details h
        JOIN magodmis.ho_paymentrv_register h1 ON h.HOPrvId = h1.HOPrvId
        WHERE h.Dc_inv_no = '${DC_Inv_No}'
        UNION
        SELECT u1.Recd_PVNo AS VrRef, u.Receive_Now, u1.TxnType, u1.ReceiptStatus AS VrStatus
        FROM magodmis.payment_recd_voucher_details u
        JOIN magodmis.payment_recd_voucher_register u1 ON u1.RecdPVID = u.RecdPVID
        WHERE u.Dc_inv_no = '${DC_Inv_No}';
        `;

  setupQueryMod(sql, (err, result) => {
    if (err) {
      logger.error(err);
      console.log("err in query", err);
    } else {
        console.log("DC_Inv_no result", result.length);
      return res.json({ Result: result });
    }
  });
});

customerOutstanding.get("/getDCTypes", (req, res) => {
  const sql = `SELECT  DISTINCT DC_InvType FROM magodmis.draft_dc_inv_register `;
  setupQueryMod(sql, (err, result) => {
    if (err) {
      logger.error(err);
      console.log("err in query", err);
    } else {
      //console.log("DC_Inv_type", result);
      return res.json({ Result: result });
    }
  });
});

module.exports = customerOutstanding;
