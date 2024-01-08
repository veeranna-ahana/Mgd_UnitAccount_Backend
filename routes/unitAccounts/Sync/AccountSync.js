const accountSyncRouter = require("express").Router();
const { dailyReportQuery, setupQuery } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

//Invoiced Cust List
//List of Customers in Invoices That do not have a HOSyncId
accountSyncRouter.get("/invoicedCustList", async (req, res, next) => {
  try {
    dailyReportQuery(
      `SELECT 
        Sync_HOId,  'Jigani' AS UnitName,  Cust_Code, Cust_name, Branch, 
        Address, City, State,StateID, IsGovtOrg, IsForiegn, GSTNo, Country, Pin_Code, 
        CreditTerms, CreditLimit, CURRENT, LastBilling, FirstBilling, PAN_No, CustStatus, 
        IsBranch
    FROM 
        magodmis.cust_data c 
    WHERE 
        c.Sync_HOId = 0;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//InvoiceList That has not yet been Synced with HO Details
accountSyncRouter.get("/invoiceNotYetSynced", async (req, res, next) => {
  try {
    dailyReportQuery(
      `SELECT  
      'Jigani' AS unitName,d.*, d.Dc_Inv_No AS Unit_Uid 
    FROM 
      magodmis.draft_dc_inv_register d
    WHERE 
      d.Inv_No IS NOT NULL  
      AND d.Sync_HOId=0 
      AND NOT d.IsDC;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Inovoice Taxes  Not Yet Sync with HO
accountSyncRouter.get("/invoiceTaxesSync", async (req, res, next) => {
  try {
    dailyReportQuery(
      `SELECT  'Jigani' AS unitName,d1.*, d1.dc_invTaxId AS Unit_Uid ,t.accthead
      FROM magodmis.draft_dc_inv_register d,magodmis.dc_inv_taxtable d1,magodmis.taxdb t
      WHERE d.Inv_No IS NOT NULL   AND d.Sync_HOId=0 AND NOT d.IsDC
      AND d.DC_Inv_No=d1.DC_Inv_No AND t.TaxID=d1.TaxId;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Invoice Symmary Not Yet Synced with HO
accountSyncRouter.get("/invoiceSummarySync", async (req, res, next) => {
  try {
    dailyReportQuery(
      `SELECT  'Jigani' AS unitName, d.Id AS Unit_UId, d.Sync_HOId, d.DC_Inv_No, d.SummarySrl, 
        d.OrderScheduleNo, d.dc_invType, d.Mtrl, d.Material, d.Excise_CL_no, d.TotQty, d.TotAmount, 
        d.SrlWt, d.cut_length, d.TotHoles, d.Thickness, d.JW_Amount, d.Mtrl_Amount  
        FROM magodmis.draft_dc_inv_register d1,magodmis.dc_inv_summary d
        WHERE d1.Inv_No IS NOT NULL  AND d1.Sync_HOId=0 
        AND NOT d1.IsDC  AND d.DC_Inv_No=d1.DC_Inv_No;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Payment Receipts Vouchers in Unit Not Sycnhed with HO
accountSyncRouter.get("/paymentReceiptsSync", async (req, res, next) => {
  try {
    dailyReportQuery(
      `SELECT 'Jigani' AS UnitName,p.*, p.RecdPVId AS Unit_UId
        FROM magodmis.payment_recd_voucher_register p
        WHERE p.Sync_HOId=0  AND Recd_PvNo <> 'Draft'`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Payment Receipts Adjusted Inv List in Unit Not Sycnhed with HO
accountSyncRouter.get("/paymentAdjustedSync", async (req, res, next) => {
  try {
    dailyReportQuery(
      `SELECT 'Jigani' AS UnitName,p1.*,p1.PVSrlID AS Unit_uid
        FROM magodmis.payment_recd_voucher_register p, magodmis.payment_recd_voucher_details p1
        WHERE p.Sync_HOId=0  AND Recd_PvNo <> 'Draft' AND p1.RecdPVId=p.RecdPVId`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Unit Cancelled Vouchers Not yet Synced with HO
accountSyncRouter.get("/unitCancelledSync", async (req, res, next) => {
  try {
    dailyReportQuery(
      `SELECT 'Jigani' AS UnitName, c.* 
         FROM magodmis.canceled_vouchers_list c 
         WHERE c.HO_Sync_Id=0;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = accountSyncRouter;
