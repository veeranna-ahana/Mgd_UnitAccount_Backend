const showSyncStatusRouter = require("express").Router();
const { hqQuery, dailyReportQuery01, setupQuery } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

showSyncStatusRouter.get("/getunitName", async (req, res, next) => {
  try {
    dailyReportQuery01(
      `SELECT DISTINCT UnitName FROM magod_setup.magodlaser_units;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

showSyncStatusRouter.put(
  "/updateUnitInvoicePaymentStatus",
  async (req, res, next) => {
    try {
      dailyReportQuery01(
        `UPDATE magodmis.draft_dc_inv_register d
          JOIN (
              SELECT b.DC_Inv_No,
                     CASE WHEN SUM(b.Receive_Now) IS NULL THEN 0 ELSE SUM(b.Receive_Now) END AS Receive_Now
              FROM (
                  SELECT d.DC_Inv_No,
                         SUM(h.Receive_Now) AS Receive_Now,
                         d.PymtAmtRecd,
                         d.DCStatus
                  FROM magodmis.ho_paymentrv_details h
                  JOIN magodmis.ho_paymentrv_register h1 ON h1.Id = h.UnitID
                  JOIN magodmis.draft_dc_inv_register d ON d.DC_Inv_No = h.Dc_inv_no
                  WHERE NOT (h1.Status = 'Cancelled' OR h1.Status = 'Draft')
                    AND (d.DCStatus LIKE 'Despatched' OR d.DCStatus LIKE 'OverPaid')
                  GROUP BY d.DC_Inv_No
          
                  UNION ALL
          
                  SELECT d.DC_Inv_No,
                         SUM(h.Receive_Now) AS Receive_Now,
                         d.PymtAmtRecd,
                         d.DCStatus
                  FROM magodmis.payment_recd_voucher_details h
                  JOIN magodmis.payment_recd_voucher_register h1 ON h1.RecdPVID = h.RecdPVID
                  JOIN magodmis.draft_dc_inv_register d ON d.DC_Inv_No = h.Dc_inv_no
                  WHERE NOT (h1.ReceiptStatus = 'Cancelled' OR h1.ReceiptStatus = 'Draft')
                    AND (d.DCStatus LIKE 'Despatched' OR d.DCStatus LIKE 'OverPaid')
                  GROUP BY d.DC_Inv_No
              ) AS b
              GROUP BY b.DC_Inv_No
              ORDER BY b.DC_Inv_No
          ) AS a ON d.DC_Inv_No = a.DC_Inv_No
          SET d.PymtAmtRecd = a.Receive_Now,
              d.DCStatus = CASE
                  WHEN d.GrandTotal = a.Receive_Now THEN 'Closed'
                  WHEN d.GrandTotal < a.Receive_Now THEN 'OverPaid'
                  ELSE 'Despatched'
              END
          WHERE d.DC_Inv_No = a.DC_Inv_No;`,
        (err, data) => {
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

showSyncStatusRouter.get(
  "/getUnitOpenInvAndReceipts/:getName",
  async (req, res, next) => {
    const getName = req.params.getName;
    const responseData = [];
    try {
      const cmdInvList = await dailyReportQuery01(
        `SELECT '${getName}' AS unitName,d.*, d.Dc_Inv_No AS Unit_Uid FROM magodmis.draft_dc_inv_register d
          WHERE d.Inv_No IS NOT NULL  AND NOT (d.DCStatus='Closed' OR d.DCStatus='Cancelled') AND NOT d.IsDC;`
      );

      const cmdInvPaymentVrList = await dailyReportQuery01(
        `SELECT
            '${getName}' AS unitName,
            d.dc_inv_no,
            p.Receive_Now,
            p1.Recd_PVNo AS VoucherNo,
            p1.ReceiptStatus AS VoucherStatus,
            TxnType
        FROM
            magodmis.draft_dc_inv_register d
        JOIN
            magodmis.payment_recd_voucher_details p ON p.Dc_Inv_no = d.dc_Inv_no
        JOIN
            magodmis.payment_recd_voucher_register p1 ON p1.RecdPVID = p.RecdPVID
        WHERE
            d.Inv_No IS NOT NULL
            AND NOT (d.DCStatus = 'Closed' OR d.DCStatus = 'Cancelled')
            AND NOT d.IsDC
            AND p1.ReceiptStatus <> 'Draft'
        
        UNION ALL
        
        SELECT
            '${getName}' AS unitName,
            d.dc_inv_no,
            p.Receive_Now,
            p1.HORef AS VoucherNo,
            p1.Status AS VoucherStatus,
            TxnType
        FROM
            magodmis.draft_dc_inv_register d
        JOIN
            magodmis.ho_paymentrv_details p ON p.Dc_Inv_no = d.dc_Inv_no
        JOIN
            magodmis.ho_paymentrv_register p1 ON p1.Id = p.UnitID
        WHERE
            d.Inv_No IS NOT NULL
            AND NOT (d.DCStatus = 'Closed' OR d.DCStatus = 'Cancelled')
            AND NOT d.IsDC;`
      );

      responseData.push({
        cmdInvList: cmdInvList,
        cmdInvPaymentVrList: cmdInvPaymentVrList,
      });

      res.send(responseData);
    } catch (error) {
      next(error);
    }
  }
);

showSyncStatusRouter.get(
  "/getHoOpenInvAndReceipts/:getName",
  async (req, res, next) => {
    const getName = req.params.getName;
    const responseData = [];
    try {
      const cmdHoInvList = await dailyReportQuery01(
        `SELECT u.*
        FROM magod_hq_mis.unit_invoices_list u
        WHERE u.UnitName = '${getName}' AND NOT (u.DCStatus = 'Closed' OR u.DCStatus = 'Cancelled');
        `
      );

      const cmdHoInvPaymentVrList = await dailyReportQuery01(
        `SELECT
        u.UnitName,
        u.DC_Inv_No,
        u1.Receive_Now,
        u2.Recd_PVNo AS VoucherNo,
        u2.TxnType,
        u2.PRV_Status AS VoucherStatus
    FROM
        magod_hq_mis.unit_invoices_list u
        JOIN magod_hq_mis.unit_payment_recd_voucher_details u1 ON u1.Dc_inv_no = u.DC_Inv_No AND u1.Unitname = u.UnitName
        JOIN magod_hq_mis.unit_payment_recd_voucher_register u2 ON u2.Id = u1.PvrId
    WHERE
        u.UnitName = '${getName}' AND NOT (u.DCStatus LIKE 'Closed' OR u.DCStatus LIKE 'Cancelled')
    
    UNION ALL
    
    SELECT
        u.UnitName,
        u.DC_Inv_No,
        u1.Receive_Now,
        u2.HORef AS VoucherNo,
        u2.TxnType,
        u2.Status AS VoucherStatus
    FROM
        magod_hq_mis.unit_invoices_list u
        JOIN magod_hq_mis.ho_paymentrv_details u1 ON u1.Dc_inv_no = u.DC_Inv_No AND u1.Unitname = u.UnitName
        JOIN magod_hq_mis.ho_paymentrv_register u2 ON u2.HOPrvId = u1.HOPrvId
    WHERE
        u.UnitName = '${getName}' AND NOT (u.DCStatus LIKE 'Closed' OR u.DCStatus LIKE 'Cancelled');`
      );

      responseData.push({
        cmdHoInvList: cmdHoInvList,
        cmdHoInvPaymentVrList: cmdHoInvPaymentVrList,
      });

      res.send(responseData);
    } catch (error) {
      next(error);
    }
  }
);

//Update the unmached rows in unit information
showSyncStatusRouter.put(
  "/updateUnmatchedRowsOfUnit/",
  async (req, res, next) => {
    const getName = req.body.getName;
    const dcInvNo = req.body.dcInvNo;

    // console.log(getName, 'and', dcInvNo);

    try {
      dailyReportQuery01(
        `UPDATE magod_hq_mis.unit_invoices_list d
        JOIN (
            SELECT
                CASE
                    WHEN SUM(a.Receive_Now) IS NULL THEN 0
                    ELSE SUM(a.Receive_Now)
                END AS Receive_now
            FROM (
                SELECT p.Receive_Now, p1.Recd_PvNo AS VrNo
                FROM magod_hq_mis.unit_payment_recd_voucher_details p
                JOIN magod_hq_mis.unit_payment_recd_voucher_register p1 ON p1.RecdPVID = p.RecdPVID
                WHERE p1.Unitname = '${getName}' AND p.Dc_inv_no = '${dcInvNo}'
                    AND NOT (p1.PRV_Status LIKE 'Cancelled' OR p1.PRV_Status LIKE 'Draft')
                UNION
                SELECT p.Receive_Now, p1.HORef AS VrNo
                FROM magod_hq_mis.ho_paymentrv_details p
                JOIN magod_hq_mis.ho_paymentrv_register p1 ON p1.HOPrvId = p.HOPrvId
                WHERE p1.Unitname = '${getName}' AND p.Dc_inv_no = '${dcInvNo}'
                    AND NOT (p1.Status LIKE 'Cancelled' OR p1.Status LIKE 'Draft')
            ) AS A
        ) AS B ON 1=1
        SET
            d.PymtAmtRecd = B.Receive_now,
            d.DCStatus = CASE
                WHEN d.grandTotal - B.Receive_now = 0 THEN 'Closed'
                WHEN d.grandTotal - B.Receive_now > 0 THEN 'Despatched'
                ELSE 'OverPaid'
            END
        WHERE
            d.Unitname = '${getName}' AND d.Dc_inv_no = '${dcInvNo}';
        `,
        (err, data) => {
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//Update the unmatched rows in Ho Information
showSyncStatusRouter.put(
  "/updateUnmatchedRowsOfHO/",
  async (req, res, next) => {
    const dcInvNo = req.body.dcInvNo;

    // console.log("and", dcInvNo);

    try {
      dailyReportQuery01(
        `UPDATE magodmis.draft_dc_inv_register d
        JOIN (
            SELECT
                CASE
                    WHEN SUM(a.Receive_Now) IS NULL THEN 0
                    ELSE SUM(a.Receive_Now)
                END AS Receive_now
            FROM (
                SELECT p.Receive_Now
                FROM magodmis.payment_recd_voucher_details p
                JOIN magodmis.payment_recd_voucher_register p1 ON p1.RecdPVID = p.RecdPVID
                WHERE p.Dc_inv_no = '${dcInvNo}'
                    AND NOT (p1.ReceiptStatus LIKE 'Cancelled' OR p1.ReceiptStatus LIKE 'Draft')
                UNION
                SELECT p.Receive_Now
                FROM magodmis.ho_paymentrv_details p
                JOIN magodmis.ho_paymentrv_register p1 ON p1.Id = p.HOPrvId
                WHERE p.Dc_inv_no = '${dcInvNo}'
                    AND NOT (p1.Status LIKE 'Cancelled' OR p1.Status LIKE 'Draft')
            ) AS A
        ) AS B ON 1=1
        SET
            d.PymtAmtRecd = B.Receive_now,
            d.DCStatus = CASE
                WHEN d.grandTotal - B.Receive_now = 0 THEN 'Closed'
                WHEN d.grandTotal - B.Receive_now > 0 THEN 'Despatched'
                ELSE 'OverPaid'
            END
        WHERE d.Dc_inv_no = '${dcInvNo}';`,
        (err, data) => {
          res.send(data);
        }
      );
    } catch (error) {
      next(error);
    }
  }
);

//Export Open invoices XML file
showSyncStatusRouter.get(
  "/getUnitOpenInvAndReceiptsForExport/:getName",
  async (req, res, next) => {
    const getName = req.params.getName;
    const responseData = [];
    try {
      const cmdInvList = await dailyReportQuery01(
        `SELECT  '${getName}' AS unitName,d.*, d.Dc_Inv_No AS Unit_Uid FROM magodmis.draft_dc_inv_register d
        WHERE d.Inv_No IS NOT NULL  AND NOT (d.DCStatus='Closed' OR d.DCStatus='Cancelled') AND NOT d.IsDC;`
      );

      const cmdInvPaymentVrList = await dailyReportQuery01(
        `SELECT
        '${getName}' AS unitName,
        d.dc_inv_no,
        p.Receive_Now,
        p1.Recd_PVNo AS VoucherNo,
        ReceiptStatus AS VoucherStatus,
        TxnType
    FROM
        magodmis.draft_dc_inv_register d
    JOIN
        magodmis.payment_recd_voucher_details p ON p.Dc_Inv_no = d.dc_Inv_no
    JOIN
        magodmis.payment_recd_voucher_register p1 ON p1.RecdPVID = p.RecdPVID
    WHERE
        d.Inv_No IS NOT NULL
        AND NOT (d.DCStatus = 'Closed' OR d.DCStatus = 'Cancelled')
        AND NOT d.IsDC
    
    UNION ALL
    
    SELECT
        '${getName}' AS unitName,
        d.dc_inv_no,
        p.Receive_Now,
        p1.HORef AS VoucherNo,
        Status AS VoucherStatus,
        TxnType
    FROM
        magodmis.draft_dc_inv_register d
    JOIN
        magodmis.ho_paymentrv_details p ON p.Dc_Inv_no = d.dc_Inv_no
    JOIN
        magodmis.ho_paymentrv_register p1 ON p1.Id = p.UnitID
    WHERE
        d.Inv_No IS NOT NULL
        AND NOT (d.DCStatus = 'Closed' OR d.DCStatus = 'Cancelled')
        AND NOT d.IsDC;`
      );
      responseData.push({
        cmdInvList: cmdInvList,
        cmdInvPaymentVrList: cmdInvPaymentVrList,
      });

      res.send(responseData);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = showSyncStatusRouter;
