const monthlyReportRouter = require("express").Router();
const { dailyReportQuery, setupQuery } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

//monthly report tax summary

monthlyReportRouter.post("/monthlyTaxSummary", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT
      d.DC_InvType AS InvoiceType,
      u.Tax_Name AS TaxName,
      SUM(u.TaxableAmount) AS TaxableAmount,
      u.TaxPercent,
      SUM(u.TaxAmt) AS TaxAmount
  FROM
      magodmis.dc_inv_taxtable u,
      magodmis.draft_dc_inv_register d
  WHERE
      d.DC_Inv_No = u.Dc_inv_No
      AND d.DCStatus NOT LIKE 'Cancelled'
      AND d.Inv_No IS NOT NULL
      AND YEAR(d.Inv_Date) = '${year}'
      AND MONTH(d.Inv_Date) = '${month}'
  GROUP BY
      u.Tax_Name,
      u.TaxPercent,
      InvoiceType
  ORDER BY
      InvoiceType,
      u.Tax_Name,
      u.TaxPercent;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

monthlyReportRouter.post("/monthlyInvSummaryNames", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT DISTINCT Cust_Name FROM magodmis.draft_dc_inv_register;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//monthly invoice summary for customerwise

monthlyReportRouter.post(
  "/monthlyInvSummaryCustomerwise",
  async (req, res, next) => {
    const month = req.body.month;
    const year = req.body.year;
    const name = req.body.getName;
    try {
      dailyReportQuery(
        `SELECT d.*, IF(d.DC_InvType='Service','Service','Sales') AS InvType,m.UnitName,d.Dc_Inv_No AS Unit_UId,d.Sync_HOId  AS UpDated,
      SUM(d1.JW_Rate*d1.Qty) AS JwValue , SUM(d1.Mtrl_rate*d1.Qty) AS MaterialValue 
      FROM magodmis.draft_dc_inv_register d, magod_setup.magodlaser_units m,magodmis.draft_dc_inv_details d1
      WHERE m.Current AND  d.Inv_no IS NOT NULL AND  d.Dc_Inv_No= d1.Dc_Inv_No
      AND Cust_Name = '${name}'
      AND MONTH(d.Inv_Date)='${month}' 
      AND YEAR(d.Inv_Date)='${year}' GROUP BY d.Dc_Inv_No, m.UnitName ORDER BY d.Inv_no;`,
        (err, data) => {
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//Monthly Invoice Summary
monthlyReportRouter.post("/monthlyInvSummary", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT A.InvoiceType, A.WithTax, A.GrandTotal, A.Round_Off, A.InvTotal, A.TaxAmount, A.Discount, A.PymtAmtRecd,
      A.Del_Chg, A.TptCharges, B.ValueAdded, B.MaterialValue, A.BranchSale
FROM (
   SELECT d.DC_InvType AS InvoiceType, IF(d.TaxAmount > 0, 1, 0) AS WithTax, SUM(d.GrandTotal) AS GrandTotal,
          SUM(PymtAmtRecd) AS PymtAmtRecd, SUM(d.Round_Off) AS Round_Off, SUM(d.Net_Total) AS InvTotal,
          SUM(d.TaxAmount) AS TaxAmount, SUM(d.Discount) AS Discount, SUM(d.Del_Chg) AS Del_Chg,
          SUM(d.TptCharges) AS TptCharges, IF(c.IsBranch <> 0, 'Branch', '') AS BranchSale
   FROM magodmis.draft_dc_inv_register d, magodmis.cust_data c
   WHERE d.DCStatus NOT LIKE 'Cancelled' AND d.Inv_No IS NOT NULL AND c.Cust_Code = d.Cust_Code
   AND YEAR(d.Inv_Date) = '${year}' AND MONTH(d.Inv_Date) = '${month}'
   GROUP BY InvoiceType, WithTax, BranchSale
) AS A,
(
   SELECT d.DC_InvType AS InvoiceType, IF(d.TaxAmount > 0, 1, 0) AS WithTax, IF(c.IsBranch <> 0, 'Branch', '') AS BranchSale,
          SUM(d1.Mtrl_Amount) AS MaterialValue, SUM(d1.Jw_Amount) AS ValueAdded
   FROM magodmis.draft_dc_inv_register d, magodmis.dc_inv_summary d1, magodmis.cust_data c
   WHERE d.DCStatus NOT LIKE 'Cancelled' AND d.Inv_No IS NOT NULL
   AND YEAR(d.Inv_Date) = '${year}' AND MONTH(d.Inv_Date) = '${month}' AND d1.DC_Inv_No = d.DC_Inv_No
   AND c.Cust_Code = d.Cust_Code
   GROUP BY InvoiceType, WithTax, BranchSale
) AS B
WHERE A.InvoiceType = B.InvoiceType AND A.WithTax = B.WithTax AND A.BranchSale = B.BranchSale
ORDER BY A.InvoiceType, A.WithTax, A.BranchSale;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Material sales summary
monthlyReportRouter.post("/materialSalesSummary", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT A.*, A.MaterialValue / A.Weight AS PerKgRate
      FROM (
          SELECT d1.Cust_Code, d1.Cust_Name AS Customer, SUM(d.TotQty) AS Quantity, SUM(d.SrlWt) AS Weight,
                 SUM(d.Mtrl_amount) AS MaterialValue, d1.DC_InvType, d.Material
          FROM magodmis.dc_inv_summary d
          JOIN magodmis.draft_dc_inv_register d1 ON d.DC_Inv_No = d1.DC_Inv_No
          WHERE YEAR(d1.Inv_Date) = '${year}' AND MONTH(d1.Inv_Date) = '${month}'
              AND d1.DC_InvType LIKE '%Sales%'
              AND d1.DCStatus NOT LIKE 'Cancelled' AND d1.Inv_No IS NOT NULL
          GROUP BY d1.Cust_Code, d1.Cust_Name, d.Material, d1.DC_InvType
      ) AS A;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Sales OutStanding
monthlyReportRouter.post("/monthlySalesOutStanding", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT
      @UnitName AS UnitName,
      SUM(d.GrandTotal) AS totalBilling,
      SUM(d.PymtAmtRecd) AS AmountReceived,
      d.Cust_Code,
      MAX(d.Cust_Name) AS Cust_Name,  -- Use an aggregate function for Cust_Name
      SUM(d.GrandTotal - d.PymtAmtRecd) AS Outstanding
  FROM
      magodmis.draft_dc_inv_register d
  WHERE
      YEAR(d.Inv_Date) = '${year}'
      AND MONTH(d.Inv_Date) = '${month}'
      AND d.DC_InvType = 'Sales'
  GROUP BY
      @UnitName, d.Cust_Code  -- Include @UnitName in the GROUP BY clause
  HAVING
      totalBilling > AmountReceived
  ORDER BY
      Outstanding DESC;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Material Sales Summary
monthlyReportRouter.post("/materialSalesSummary", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT A.*, A.MaterialValue / A.Weight AS PerKgRate
      FROM (
          SELECT d1.Cust_Code, d1.Cust_Name AS Customer, SUM(d.TotQty) AS Quantity, SUM(d.SrlWt) AS Weight,
                 SUM(d.Mtrl_amount) AS MaterialValue, d1.DC_InvType, d.Material
          FROM magodmis.dc_inv_summary d
          JOIN magodmis.draft_dc_inv_register d1 ON d.DC_Inv_No = d1.DC_Inv_No
          WHERE YEAR(d1.Inv_Date) = '2015' AND MONTH(d1.Inv_Date) = '04'
              AND d1.DC_InvType LIKE '%Sales%'
              AND d1.DCStatus NOT LIKE 'Cancelled' AND d1.Inv_No IS NOT NULL
          GROUP BY d1.Cust_Code, d1.Cust_Name, d.Material, d1.DC_InvType
      ) AS A;
      `,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Machine Utilisation
monthlyReportRouter.post("/machineUtilaisation", async (req, res, next) => {
  const fDate = req.body.fDate;
  const tDate = req.body.tDate;
  // console.log(fDate, "and", tDate);
  try {
    dailyReportQuery(
      `SELECT s.Program, 
      SUM(TIMESTAMPDIFF(MINUTE, s.FromTime, s.ToTime)) AS TotalTime,
      s.Machine,  
      n.TaskNo, 
      n1.Cust_Code, 
      n1.Mtrl_Code,  
      n1.Thickness, 
      n1.Operation
FROM magodmis.shiftlogbook s
JOIN magodmis.ncprograms n ON n.NCProgramNo = s.Program
JOIN magodmis.nc_task_list n1 ON n1.NcTaskId = n.NcTaskId
WHERE s.TaskNo <> '100'  -- Use <> instead of NOT LIKE for exact comparison
 AND s.FromTime >= '${fDate}'  -- Use >= for greater than or equal condition
 AND s.ToTime < '${tDate}'  -- Use < for a date range that ends before '2014-02-01'
GROUP BY s.Program, s.Machine, n1.TaskNo, n1.Cust_Code, n1.Mtrl_Code, n1.Thickness, n1.Operation  -- Include all non-aggregated columns in the GROUP BY
ORDER BY s.Machine, n1.Operation
LIMIT 100;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//All OutStanding Bills
monthlyReportRouter.post("/allOutStandingBills", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT
      @UnitName AS UnitName,
      SUM(d.GrandTotal) AS totalBilling,
      SUM(d.PymtAmtRecd) AS AmountReceived,
      d.Cust_Code,
      d.Cust_Name,
      SUM(d.GrandTotal - d.PymtAmtRecd) AS Outstanding
  FROM
      magodmis.draft_dc_inv_register d
  WHERE
      YEAR(d.Inv_Date) = '${year}'
      AND MONTH(d.Inv_Date) = '${month}'
  GROUP BY
      d.Cust_Code,
      d.Cust_Name
  HAVING
      totalBilling > AmountReceived
  ORDER BY
      Outstanding DESC;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Collection Summary
monthlyReportRouter.post("/collectionSummary", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT p.TxnType, SUM(p.Amount) AS Amount
      FROM magodmis.payment_recd_voucher_register p
      WHERE YEAR(p.Recd_PV_Date) = '${year}' AND MONTH(p.Recd_PV_Date) = '${month}'
      GROUP BY p.TxnType
      UNION
      SELECT h.TxnType, SUM(h.Amount) AS Amount
      FROM magodmis.ho_paymentrv_register h
      WHERE YEAR(h.horefdate) = '${year}' AND MONTH(h.horefdate) = '${month}'
      GROUP BY h.TxnType;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Clearance Summary
monthlyReportRouter.post("/clearanceSummary", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT
      d.DC_InvType AS InvoiceType,
      IF(d.TaxAmount > 0, 1, 0) AS WithTax,
      u.Material,
      u.Excise_CL_no,
      SUM(u.TotQty) AS TotalQty,
      SUM(u.TotAmount) AS TotalValue,
      d.ExNotNo AS Ex_Not_No,
      SUM(u.SrlWt) AS TotalWeight
  FROM
      magodmis.draft_dc_inv_register d
  LEFT JOIN
      magodmis.dc_inv_summary u ON d.DC_Inv_No = u.DC_Inv_No
  WHERE
      d.DCStatus NOT LIKE 'Cancelled'
      AND d.Inv_No IS NOT NULL
      AND YEAR(d.Inv_Date) = '${year}'
      AND MONTH(d.Inv_Date) = '${month}'
  GROUP BY
      InvoiceType, WithTax, u.Material, u.Excise_CL_no, d.ExNotNo
  ORDER BY InvoiceType;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Customer Value Addition
monthlyReportRouter.post("/customerValueAddtion", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    dailyReportQuery(
      `SELECT
      @UnitName AS UnitName,
      Cust_Code,
      Cust_Name,
      SUM(totalBilling) AS totalBilling,
      SUM(AmountReceived) AS AmountReceived,
      SUM(ValueAdded) AS ValueAdded,
      SUM(MaterialValue) AS MaterialValue
  FROM (
      SELECT
          -- d.UnitName,
          d.Cust_Code,
          d.Cust_Name,
          SUM(d.GrandTotal) AS totalBilling,
          SUM(PymtAmtRecd) AS AmountReceived,
          0 AS ValueAdded,
          0 AS MaterialValue
      FROM magodmis.draft_dc_inv_register d
      WHERE d.DCStatus NOT LIKE 'Cancelled'
          AND d.Inv_No IS NOT NULL
          AND YEAR(d.Inv_Date) = '${year}'
          AND MONTH(d.Inv_Date) = '${month}'
          -- AND d.UnitName = @UnitName -- Replace with your desired UnitName
      GROUP BY d.Cust_Code, d.Cust_Name
      UNION ALL
      SELECT
          -- d.UnitName,
          'Nil' AS Cust_Code,
          'Others' AS Cust_Name,
          0 AS totalBilling,
          0 AS AmountReceived,
          SUM(d1.Jw_Amount) AS ValueAdded,
          SUM(d1.Mtrl_Amount) AS MaterialValue
      FROM magodmis.draft_dc_inv_register d
      JOIN magodmis.dc_inv_summary d1 ON d1.DC_Inv_No = d.DC_Inv_No
      WHERE d.DCStatus NOT LIKE 'Cancelled'
          AND d.Inv_No IS NOT NULL
          AND YEAR(d.Inv_Date) = '${year}'
          AND MONTH(d.Inv_Date) = '${month}'
         -- AND d.UnitName = @UnitName -- Replace with your desired UnitName
      GROUP BY d.Cust_Name
  ) AS subquery
  GROUP BY Cust_Code, Cust_Name
  ORDER BY ValueAdded DESC;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

// //AND Cust_Name = 'BHARAT ELECTRONICS LIMITED'

module.exports = monthlyReportRouter;
