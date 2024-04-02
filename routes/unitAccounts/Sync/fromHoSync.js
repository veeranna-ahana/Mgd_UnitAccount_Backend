const fromHOSyncRouter = require("express").Router();
const { dailyReportQuery01, setupQuery } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

//Purchase Invoices
fromHOSyncRouter.post("/purchaseInv", async (req, res, next) => {
  const { open_pur_inv, open_inv_tax } = req.body;
  let purchaseInvUnitUid = null;

  try {
    const responseData = [];

    // Process open_pur_inv
    if (open_pur_inv && open_pur_inv.length > 0) {
      const responsePurInvData = await Promise.all(
        open_pur_inv.map(async (item, k) => {
          try {
            const creditValue = item.Credit ? 1 : 0;
            const query = `
                INSERT INTO magodmis.unit_purchase_invoice_list(
                  UnitName, HO_SyncId, InvoiceType, Purchase_Receipt_no, Vendor_Code,
                  Vendor_Name, Vendor_Address, Vendor_Place, Vendor_State, Vendor_Country,
                  Vendor_Pin, VendorGSTNo, Invoice_No, Inv_date, Inv_NetAmount, Inv_Amount,
                  Tax_Amount, Receipt_Date, PI_Date, Remarks, Status, Credit_Days,
                  Amount_Paid, Balance, VoucherType, BookUnder, Credit, PaymentDueDate, UUID
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE Inv_Amount = ?, UUID = ?, Amount_Paid = ?, Status = ?;
              `;

            const selectQuery = `SELECT Id as Unit_Uid, UnitName, HO_SyncId 
            FROM magodmis.unit_purchase_invoice_list WHERE HO_SyncId = ?;`;

            const values = [
              item.UnitName || null,
              item.HO_SyncId || 0,
              item.InvoiceType || null,
              item.Purchase_Receipt_no || "Draft",
              item.Vendor_Code || null,
              item.Vendor_Name || null,
              item.Vendor_Address || null,
              item.Vendor_Place || null,
              item.Vendor_State || null,
              item.Vendor_Country || null,
              item.Vendor_Pin || null,
              item.VendorGSTNo || "Not Known",
              item.Invoice_No || "Invoice No",
              item.Inv_Date || null,
              item.Inv_NetAmount || 0.0,
              item.Inv_Amount || 0.0,
              item.Tax_Amount || 0.0,
              item.Receipt_Date || null,
              item.PI_Date || null,
              item.Remarks || null,
              item.Status || "Created",
              item.Credit_Days || 0,
              item.Amount_Paid || 0.0,
              item.Balance || 0.0,
              item.VoucherType || null,
              item.BookUnder || "Null",
              creditValue || 1,
              item.PaymentDueDate || null,
              item.UUID || null,
              item.Inv_Amount || null,
              item.UUID || null,
              item.Amount_Paid || null,
              item.Status || null,
            ];

            // Insert or update the data
            const data = await dailyReportQuery01(query, values);

            // Retrieve Unit_Uid
            const [unitUidResult] = await dailyReportQuery01(selectQuery, [
              item.HO_SyncId,
            ]);

            purchaseInvUnitUid = unitUidResult ? unitUidResult.Unit_Uid : null; // Check if unitUidResult is not null

            // console.log("inside Purinv", purchaseInvUnitUid);

            return {
              Unit_Uid: unitUidResult && unitUidResult.Unit_Uid,
              UnitName: unitUidResult && unitUidResult.UnitName,
              HO_SyncId: unitUidResult && unitUidResult.HO_SyncId,
            };
          } catch (error) {
            console.error(`Error in iteration ${k}: ${error.message}`);
            return {
              error: `Error in iteration ${k}: ${error.message}`,
            };
          }
        })
      );
      responseData.push({ purchaseInvData: responsePurInvData });
    }

    // Process open_inv_tax
    if (open_inv_tax && open_inv_tax.length > 0) {
      const responsePurInvTax = await Promise.all(
        open_inv_tax.map(async (taxItem, k) => {
          try {
            // console.log("Processing tax item:", taxItem);
            const taxQuery = `
              INSERT INTO magodmis.unit_purchase_inv_taxes(
                UnitName, PI_Id, Ho_SyncId, Tax_amount, AcctHead, UUID
              ) VALUES (?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE Tax_amount = ?, AcctHead = ?;
            `;

            // console.log("inside Tax inv", purchaseInvUnitUid);

            // Insert or update tax information
            const taxValues = [
              taxItem.UnitName,
              purchaseInvUnitUid,
              taxItem.Ho_SyncId,
              taxItem.Tax_amount,
              taxItem.AcctHead,
              taxItem.UUID,
              // On Duplicate values
              taxItem.Tax_amount,
              taxItem.AcctHead,
            ];

            const updateQuery = `
              UPDATE magodmis.unit_purchase_inv_taxes
              SET Unit_Uid = PurInvTaxID
              WHERE Ho_SyncId = ?;
            `;

            const selectQuery = `
              SELECT Unit_Uid, UnitName FROM magodmis.unit_purchase_inv_taxes WHERE UUID = ?;
            `;

            // Insert or update tax data
            const taxQueryResult = await dailyReportQuery01(
              taxQuery,
              taxValues
            );

            // console.log(taxQueryResult);

            const updateResult = await dailyReportQuery01(updateQuery, [
              taxItem.Ho_SyncId,
            ]);

            // console.log(updateResult);

            // Retrieve Unit_Uid
            const [taxUnitUidResult] = await dailyReportQuery01(selectQuery, [
              taxItem.UUID,
            ]);

            const taxUnitUid = taxUnitUidResult
              ? taxUnitUidResult.Unit_Uid
              : null;

            return {
              Unit_Uid: taxUnitUidResult.Unit_Uid,
              UnitName: taxUnitUidResult.UnitName,
            };
          } catch (error) {
            console.error(`Error in iteration ${k}: ${error.message}`);
            return {
              error: `Error in iteration ${k}: ${error.message}`,
            };
          }
        })
      );

      responseData.push({ purchaseInvTax: responsePurInvTax });
    }

    res.send(responseData);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//Vendor data
fromHOSyncRouter.post("/vendorDataa", async (req, res, next) => {
  const { open_vendor_data } = req.body;

  try {
    const responseData = [];

    if (open_vendor_data && open_vendor_data.length > 0) {
      // Check if open_vendor_data exists and has length greater than 0
      const responseVendorData = await Promise.all(
        open_vendor_data.map(async (itemVendor, k) => {
          try {
            const currentValue = itemVendor.CURRENT ? 1 : 0;

            const vendorQuery = `
              INSERT INTO magodmis.unit_vendor_list (UnitName, Vendor_Code, Vendor_name, Branch, 
              Address, City, State, StateId, Country, Pin_Code, GSTNo, CreditLimit, CreditTime, 
              AveragePymtPeriod, VendorType, CURRENT, LastBilling, FirstBilling, PAN_No, VendorStatus, 
              Registration_Date, HO_Id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
              ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE CURRENT = ?, LastBilling = ?, FirstBilling = ?, 
              VendorStatus = ?, Registration_Date = ?, HO_Id = ?;`;

            const vendorValues = [
              itemVendor.UnitName || null,
              itemVendor.Vendor_Code || 0,
              itemVendor.Vendor_Name || "EnterCustomerName",
              itemVendor.Branch || null,
              itemVendor.Address || null,
              itemVendor.City || null,
              itemVendor.State || null,
              itemVendor.StateId || 0,
              itemVendor.Country || null,
              itemVendor.Pin_Code || null,
              itemVendor.GSTNo || null,
              itemVendor.CreditLimit || 0.0,
              itemVendor.CreditTime || 0,
              itemVendor.AveragePymtPeriod || 1000,
              itemVendor.VendorType || null,
              currentValue || 0,
              itemVendor.LastBilling || null,
              itemVendor.FirstBilling || null,
              itemVendor.PAN_No || null,
              itemVendor.VendorStatus || "OK",
              itemVendor.Registration_Date || null,
              itemVendor.Sync_HOId || 0,
              //On Duplicate values
              currentValue || 0,
              itemVendor.LastBilling || null,
              itemVendor.FirstBilling || null,
              itemVendor.VendorStatus || "OK",
              itemVendor.Registration_Date || null,
              itemVendor.Sync_HOId || 0,
            ];

            const vendorSelect = `
              SELECT u.Id as Unit_Uid, UnitName, u.HO_Id as Sync_HOId 
              FROM magodmis.unit_vendor_list u WHERE u.HO_Id = ?;
            `;

            // Insert or update the data
            const vendorData = await dailyReportQuery01(
              vendorQuery,
              vendorValues
            );

            // Retrieve Unit_Uid
            const [vendorUnitUidResult] = await dailyReportQuery01(
              vendorSelect,
              [itemVendor.Sync_HOId]
            );

            const vendorUnitUid = vendorUnitUidResult
              ? vendorUnitUidResult.Unit_Uid
              : null;

            return {
              Unit_Uid: vendorUnitUidResult.Unit_Uid,
              UnitName: vendorUnitUidResult.UnitName,
              Sync_HOId: vendorUnitUidResult.Sync_HOId,
            };
          } catch (error) {
            console.error(`Error in iteration ${k}: ${error.message}`);
            return { error: `Error in iteration ${k}: ${error.message}` };
          }
        })
      );

      responseData.push({
        responseVendorData,
      });
    }

    res.send(responseData);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//Payment Rv register
fromHOSyncRouter.post("/paymentRvRegisterDataa", async (req, res, next) => {
  const { paymentrv_register, paymentrv_details } = req.body;
  let paymentRvUnitUid = null; // Define paymentRvUnitUid outside of the map scope

  try {
    const responseData = [];

    // Process paymentrv_register
    if (paymentrv_register && paymentrv_register.length > 0) {
      const responseVendorData = [];
      for (let k = 0; k < paymentrv_register.length; k++) {
        const itemPayemetrv = paymentrv_register[k];
        try {
          const paymentQuery = `
            INSERT INTO magodmis.ho_paymentrv_register (Unitname, Cust_code, CustName,
            TxnType, Amount, Description, On_account, HORef, Status, HoRefDate, HOPrvId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE Cust_code = ?;`;

          const vendorValues = [
            itemPayemetrv.Unitname || "",
            itemPayemetrv.Cust_code || "",
            itemPayemetrv.CustName || "",
            itemPayemetrv.TxnType || "Bank",
            itemPayemetrv.Amount || 0.0,
            itemPayemetrv.Description || "",
            itemPayemetrv.On_account || 0.0,
            itemPayemetrv.HORef || "Draft",
            itemPayemetrv.Status || "Draft",
            itemPayemetrv.HoRefDate,
            itemPayemetrv.HOPrvId || 0,
            itemPayemetrv.Cust_code || "",
          ];

          const paymentSelect = `
            SELECT Id, Id AS Unit_RecdPVID, Id AS Unit_Uid, Status, Unitname, HOPrvId
            FROM magodmis.ho_paymentrv_register
            WHERE HOPrvId = ?;`;

          // Insert or update the data
          const vendorData = await dailyReportQuery01(
            paymentQuery,
            vendorValues
          );

          // Retrieve Unit_Uid
          const [paymentRvUnitUidResult] = await dailyReportQuery01(
            paymentSelect,
            [itemPayemetrv.HOPrvId]
          );

          paymentRvUnitUid = paymentRvUnitUidResult
            ? paymentRvUnitUidResult.Unit_Uid
            : null;

          responseVendorData.push({
            Id: paymentRvUnitUidResult.Id,
            Unit_RecdPVID: paymentRvUnitUidResult.Unit_RecdPVID,
            Unit_Uid: paymentRvUnitUidResult.Unit_Uid,
            Status: paymentRvUnitUidResult.Status,
            Unitname: paymentRvUnitUidResult.Unitname,
            HOPrvId: paymentRvUnitUidResult.HOPrvId,
          });
        } catch (error) {
          console.error(`Error in iteration ${k}: ${error.message}`);
          responseVendorData.push({
            error: `Error in iteration ${k}: ${error.message}`,
          });
        }
      }
      responseData.push({ paymentRvRegister: responseVendorData });
    }

    // Process paymentrv_details
    if (paymentrv_details && paymentrv_details.length > 0) {
      const responsePaymentRvDetails = [];
      for (let k = 0; k < paymentrv_details.length; k++) {
        const itemRvDetails = paymentrv_details[k];
        try {
          const paymentQuery = `
            INSERT INTO magodmis.ho_paymentrv_details (HOPrvId, UnitID,  Unitname,
            RecdPvSrl, Dc_inv_no, Inv_No, Inv_Type, Inv_Amount, Amt_received,
            Receive_Now, Inv_date, RefNo, HO_Uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE HO_Uid = ?;`;

          const vendorValues = [
            itemRvDetails.HOPrvId || 0,
            paymentRvUnitUid,
            itemRvDetails.Unitname,
            itemRvDetails.RecdPvSrl || 0,
            itemRvDetails.Dc_inv_no || 0,
            itemRvDetails.Inv_No || "",
            itemRvDetails.Inv_Type || "",
            itemRvDetails.Inv_Amount || 0.0,
            itemRvDetails.Amt_received || 0.0,
            itemRvDetails.Receive_Now || 0.0,
            itemRvDetails.Inv_date || "0000-00-00",
            itemRvDetails.RefNo || "",
            itemRvDetails.HO_Uid || 0,
            itemRvDetails.HO_Uid || 0,
          ];

          const paymentSelect = `
            SELECT h.Id, h.Id as Unit_Uid, HOPrvId, HO_Uid, Unitname
            FROM magodmis.ho_paymentrv_details h
            WHERE HO_Uid = ?;`;

          const vendorData = await dailyReportQuery01(
            paymentQuery,
            vendorValues
          );

          // Retrieve Unit_Uid
          const [paymentRvUnitUidResult] = await dailyReportQuery01(
            paymentSelect,
            [itemRvDetails.HO_Uid]
          );

          const paymentRvDetailsUnitUid = paymentRvUnitUidResult
            ? paymentRvUnitUidResult.Unit_Uid
            : null;

          responsePaymentRvDetails.push({
            Id: paymentRvUnitUidResult.Id,
            Unit_Uid: paymentRvUnitUidResult.Unit_Uid,
            HOPrvId: paymentRvUnitUidResult.HOPrvId,
            HO_Uid: paymentRvUnitUidResult.HO_Uid,
            Unitname: paymentRvUnitUidResult.Unitname,
          });
        } catch (error) {
          console.error(`Error in iteration ${k}: ${error.message}`);
          responsePaymentRvDetails.push({
            error: `Error in iteration ${k}: ${error.message}`,
          });
        }
      }
      responseData.push({ paymentRvDetails: responsePaymentRvDetails });
    }

    res.send(responseData);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//Cancelled vouchers
fromHOSyncRouter.post("/cancelledVouchersDataa", async (req, res, next) => {
  const { cancelled_vouchers_list } = req.body;

  try {
    const responseData = [];

    if (cancelled_vouchers_list && cancelled_vouchers_list.length > 0) {
      const responseVendorData = await Promise.all(
        cancelled_vouchers_list.map(async (itemCancelledRv, k) => {
          try {
            const CancelledQuery = `
            INSERT INTO magodmis.canceled_vouchers_list (UnitName, CancelVrNo, VrDate,
            VrAmount, CancelReason, RefVr_Uid, RefVrNo, RefVrDate, RefVrType, Cust_Code,
            Cust_Name, HO_Sync_Id, UUID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE CancelVrNo = ?, VrDate = ?, VrAmount = ?, CancelReason = ?,
            RefVr_Uid = ?, RefVrNo = ?, RefVrDate = ?, RefVrType = ?, Cust_Code = ?,
            Cust_Name = ?;`;

            const vendorValues = [
              itemCancelledRv.UnitName,
              itemCancelledRv.CancelVrNo,
              itemCancelledRv.VrDate,
              itemCancelledRv.VrAmount || 0.0,
              itemCancelledRv.CancelReason,
              itemCancelledRv.RefVr_Uid || 0,
              itemCancelledRv.RefVrNo,
              itemCancelledRv.RefVrDate,
              itemCancelledRv.RefVrType,
              itemCancelledRv.Cust_Code,
              itemCancelledRv.Cust_Name,
              itemCancelledRv.HO_Sync_Id || 0,
              itemCancelledRv.UUID,
              //On Duplicate
              itemCancelledRv.CancelVrNo,
              itemCancelledRv.VrDate,
              itemCancelledRv.VrAmount || 0.0,
              itemCancelledRv.CancelReason,
              itemCancelledRv.RefVr_Uid || 0,
              itemCancelledRv.RefVrNo,
              itemCancelledRv.RefVrDate,
              itemCancelledRv.RefVrType,
              itemCancelledRv.Cust_Code,
              itemCancelledRv.Cust_Name,
            ];

            const updateQuery = `UPDATE magodmis.canceled_vouchers_list
            SET Unit_Uid = Id
            WHERE UUID = ?;`;

            const cancelledSelect = `SELECT Id AS Unit_Uid, UnitName, HO_Sync_Id, UUID
            FROM magodmis.canceled_vouchers_list
            WHERE UUID = ?;`;

            // Insert or update the data
            const vendorData = await dailyReportQuery01(
              CancelledQuery,
              vendorValues
            );

            const updateData = await dailyReportQuery01(updateQuery, [
              itemCancelledRv.UUID,
            ]);

            // Retrieve Unit_Uid
            const [cancelledUnitUidResult] = await dailyReportQuery01(
              cancelledSelect,
              [itemCancelledRv.UUID]
            );

            const cancelledUnitUid = cancelledUnitUidResult
              ? cancelledUnitUidResult.Unit_Uid
              : null;

            responseData.push({
              Unit_Uid: cancelledUnitUidResult.Unit_Uid,
              UnitName: cancelledUnitUidResult.UnitName,
              HO_Sync_Id: cancelledUnitUidResult.HO_Sync_Id,
              UUID: cancelledUnitUidResult.UUID,
            });
            // return {
            //   Unit_Uid: cancelledUnitUidResult.Unit_Uid,
            //   UnitName: cancelledUnitUidResult.UnitName,
            //   HO_Sync_Id: cancelledUnitUidResult.HO_Sync_Id,
            //   UUID: cancelledUnitUidResult.UUID,
            // };
          } catch (error) {
            console.error(`Error in iteration ${k}: ${error.message}`);
            return { error: `Error in iteration ${k}: ${error.message}` };
          }
        })
      );

      // responseData.push({
      //   vendorInvoice: responseVendorData,
      // });
    }

    res.send(responseData);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = fromHOSyncRouter;
