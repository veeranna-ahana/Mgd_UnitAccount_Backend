const fromHOSyncRouter = require("express").Router();
const { dailyReportQuery01, setupQuery } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

fromHOSyncRouter.post("/purchaseInv", async (req, res, next) => {
    const { open_pur_inv, open_inv_tax, open_vendor_data } = req.body;
  
    try {
      const responseData = [];
  
      if (open_pur_inv.length > 0) {
        const invResponseData = await Promise.all(
          open_pur_inv.map(async (item, i) => {
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
  
              const selectQuery = `SELECT Id as Unit_Uid FROM magodmis.unit_purchase_invoice_list WHERE HO_SyncId = ?;`;
  
              const values = [
                item.UnitName || UnitName,
                item.HO_SyncId || 0,
                item.InvoiceType || null,
                item.Purchase_Receipt_no || "Draft",
                item.Vendor_Code,
                item.Vendor_Name,
                item.Vendor_Address,
                item.Vendor_Place,
                item.Vendor_State,
                item.Vendor_Country || null,
                item.Vendor_Pin,
                item.VendorGSTNo || "Not Known",
                item.Invoice_No || "Invoice No",
                item.Inv_Date,
                item.Inv_NetAmount || 0.0,
                item.Inv_Amount || 0.0,
                item.Tax_Amount || 0.0,
                item.Receipt_Date,
                item.PI_Date,
                item.Remarks,
                item.Status || "Created",
                item.Credit_Days || 0,
                item.Amount_Paid || 0.0,
                item.Balance || 0.0,
                item.VoucherType,
                item.BookUnder || "Null",
                creditValue || 1,
                item.PaymentDueDate,
                item.UUID,
                item.Inv_Amount,
                item.UUID,
                item.Amount_Paid,
                item.Status,
              ];
  
              // Insert or update the data
              const data = await dailyReportQuery01(query, values);
  
              // Retrieve Unit_Uid
              const [unitUidResult] = await dailyReportQuery01(selectQuery, [
                item.HO_SyncId,
              ]);
  
              const unitUid = unitUidResult && unitUidResult.Unit_Uid;
  
              if (unitUid !== null && open_inv_tax.length > 0) {
                const taxResponseData = await Promise.all(
                  open_inv_tax.map(async (taxItem, i) => {
                    try {
                      const taxQuery = `
                            INSERT INTO magodmis.unit_purchase_inv_taxes(
                              UnitName, PI_Id, Ho_SyncId, Tax_amount, AcctHead, UUID
                            ) VALUES (?, ?, ?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE Tax_amount = '${taxItem.Tax_amount}', AcctHead = '${taxItem.AcctHead}';
                          `;
  
                      // Insert or update tax information
                      const taxValues = [
                        taxItem.UnitName || UnitName,
                        unitUid || 0,
                        taxItem.HO_UId || 0,
                        taxItem.Tax_amount || 0.0,
                        taxItem.AcctHead || null,
                        taxItem.UUID,
                      ];
  
                      const updateQuery = `
                            UPDATE magodmis.unit_purchase_inv_taxes
                            SET Unit_Uid = PurInvTaxID
                            WHERE Ho_SyncId = '${taxItem.HO_UId}';
                          `;
  
                      const selectQuery = `SELECT Unit_Uid FROM magodmis.unit_purchase_inv_taxes WHERE UUID = '${taxItem.UUID}';`;
  
                      // Insert or update tax data
                      await dailyReportQuery01(taxQuery, taxValues);
  
                      await dailyReportQuery01(updateQuery);
  
                      // Retrieve Unit_Uid
                      const [taxUnitUidResult] = await dailyReportQuery01(
                        selectQuery
                      );
  
                      const taxUnitUid =
                        taxUnitUidResult && taxUnitUidResult.Unit_Uid;
  
                      // Use taxUnitUid as needed
                    } catch (error) {
                      console.error(`Error in iteration ${i}: ${error.message}`);
                      // Depending on your use case, you might want to handle errors more gracefully here
                      return {
                        error: `Error in iteration ${i}: ${error.message}`,
                      };
                    }
                  })
                );
  
                responseData.push({
                  invTaxData: taxResponseData,
                });
  
                // res.send(taxResponseData);
              }
              return { ...data };
            } catch (error) {
              console.error(`Error in iteration ${i}: ${error.message}`);
              return { error: `Error in iteration ${i}: ${error.message}` };
            }
          })
        );
  
        responseData.push({
          purchaseInvoice: invResponseData,
        });
  
        // res.send(invResponseData);
      } else {
        console.log("No purchase invoice values found");
        res.status(400).json({ error: "No purchase invoice values found" });
      }
  
      if (open_vendor_data.length > 0) {
        const responseVendorData = await Promise.all(
          open_vendor_data.map(async (itemVendor, k) => {
            try {
              const vendorQuery = `INSERT INTO magodmis.unit_vendor_list (UnitName, Vendor_Code, Vendor_name,Branch, Address, City, State, StateId, Country, Pin_Code, GSTNo, CreditLimit, CreditTime, AveragePymtPeriod,VendorType, CURRENT, LastBilling, FirstBilling,  PAN_No,VendorStatus, Registration_Date, HO_Id)
              VALUES (?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                 ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE HO_Id = '${itemVendor.Sync_HOId}';`;
  
              const vendorValues = [
                itemVendor.UnitName || unitname,
                itemVendor.Vendor_Code || 0,
                itemVendor.Vendor_Name || EnterCustomerName,
                itemVendor.Branch,
                itemVendor.Address,
                itemVendor.City,
                itemVendor.State,
                itemVendor.StateId || 0,
                itemVendor.Country,
                itemVendor.Pin_Code,
                itemVendor.GSTNo,
                itemVendor.CreditLimit || 0.0,
                itemVendor.CreditTime || 0,
                itemVendor.AveragePymtPeriod || 1000,
                itemVendor.VendorType,
                itemVendor.CURRENT || 0,
                itemVendor.LastBilling,
                itemVendor.FirstBilling,
                itemVendor.PAN_No,
                itemVendor.VendorStatus || OK,
                itemVendor.Registration_Date,
                itemVendor.Sync_HOId || 0,
              ];
  
              const vendorSelect = `SELECT u.Id as Unit_Uid FROM magodmis.unit_vendor_list u WHERE u.HO_Id = '${itemVendor.Sync_HOId}';`;
  
              // Insert or update the data
              const vendorData = await dailyReportQuery01(
                vendorQuery,
                vendorValues
              );
  
              // Retrieve Unit_Uid
              const [vendorUnitUidResult] = await dailyReportQuery01(
                vendorSelect
              );
  
              const vendorUnitUid =
                vendorUnitUidResult && vendorUnitUidResult.Unit_Uid;
  
              // Use vendorUnitUid as needed
            } catch (error) {
              console.error(`Error in iteration ${k}: ${error.message}`);
              return { error: `Error in iteration ${k}: ${error.message}` };
            }
          })
        );
        responseData.push({
          vendorInvoice: responseVendorData,
        });
        //   res.send(responseVendorData);
      }
      res.send(responseData);
    } catch (error) {
      console.error(error);
      next(error);
    }
  });
  
  //Batch wise
  // fromHOSyncRouter.post("/purchaseInv", async (req, res, next) => {
  //   const { open_pur_inv, open_inv_tax, open_vendor_data } = req.body;
  
  //   try {
  //     const responseData = [];
  
  //     if (open_pur_inv.length > 0) {
  //       // Batch processing for purchase invoices
  //       const batchSize = 1000;
  
  //       for (let i = 0; i < open_pur_inv.length; i += batchSize) {
  //         const batch = open_pur_inv.slice(i, i + batchSize);
  
  //         const invResponseData = await Promise.all(
  //           batch.map(async (item, i) => {
  //             try {
  //               const creditValue = item.Credit ? 1 : 0;
  //               const query = `
  //                   INSERT INTO magodmis.unit_purchase_invoice_list(
  //                     UnitName, HO_SyncId, InvoiceType, Purchase_Receipt_no, Vendor_Code,
  //                     Vendor_Name, Vendor_Address, Vendor_Place, Vendor_State, Vendor_Country,
  //                     Vendor_Pin, VendorGSTNo, Invoice_No, Inv_date, Inv_NetAmount, Inv_Amount,
  //                     Tax_Amount, Receipt_Date, PI_Date, Remarks, Status, Credit_Days,
  //                     Amount_Paid, Balance, VoucherType, BookUnder, Credit, PaymentDueDate, UUID
  //                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  //                   ON DUPLICATE KEY UPDATE Inv_Amount = ?, UUID = ?, Amount_Paid = ?, Status = ?;
  //                 `;
  
  //               const selectQuery = `SELECT Id as Unit_Uid FROM magodmis.unit_purchase_invoice_list WHERE HO_SyncId = ?;`;
  
  //               const values = [
  //                 item.UnitName || UnitName,
  //                 item.HO_SyncId || 0,
  //                 item.InvoiceType || null,
  //                 item.Purchase_Receipt_no || "Draft",
  //                 item.Vendor_Code,
  //                 item.Vendor_Name,
  //                 item.Vendor_Address,
  //                 item.Vendor_Place,
  //                 item.Vendor_State,
  //                 item.Vendor_Country || null,
  //                 item.Vendor_Pin,
  //                 item.VendorGSTNo || "Not Known",
  //                 item.Invoice_No || "Invoice No",
  //                 item.Inv_Date,
  //                 item.Inv_NetAmount || 0.0,
  //                 item.Inv_Amount || 0.0,
  //                 item.Tax_Amount || 0.0,
  //                 item.Receipt_Date,
  //                 item.PI_Date,
  //                 item.Remarks,
  //                 item.Status || "Created",
  //                 item.Credit_Days || 0,
  //                 item.Amount_Paid || 0.0,
  //                 item.Balance || 0.0,
  //                 item.VoucherType,
  //                 item.BookUnder || "Null",
  //                 creditValue || 1,
  //                 item.PaymentDueDate,
  //                 item.UUID,
  //                 item.Inv_Amount,
  //                 item.UUID,
  //                 item.Amount_Paid,
  //                 item.Status,
  //               ];
  
  //               // Insert or update the data
  //               const data = await dailyReportQuery01(query, values);
  
  //               // Retrieve Unit_Uid
  //               const [unitUidResult] = await dailyReportQuery01(selectQuery, [
  //                 item.HO_SyncId,
  //               ]);
  
  //               const unitUid = unitUidResult && unitUidResult.Unit_Uid;
  
  //               if (unitUid !== null && open_inv_tax.length > 0) {
  //                 const batchSize = 1000;
  
  //                 for (let i = 0; i < open_inv_tax.length; i += batchSize) {
  //                   const batch = open_inv_tax.slice(i, i + batchSize);
  
  //                   const taxResponseData = await Promise.all(
  //                     batch.map(async (taxItem, i) => {
  //                       try {
  //                         const taxQuery = `
  //                           INSERT INTO magodmis.unit_purchase_inv_taxes(
  //                             UnitName, PI_Id, Ho_SyncId, Tax_amount, AcctHead, UUID
  //                           ) VALUES (?, ?, ?, ?, ?, ?)
  //                           ON DUPLICATE KEY UPDATE Tax_amount = '${taxItem.Tax_amount}', AcctHead = '${taxItem.AcctHead}';
  //                         `;
  
  //                         // Insert or update tax information
  //                         const taxValues = [
  //                           taxItem.UnitName || UnitName,
  //                           unitUid || 0,
  //                           taxItem.HO_UId || 0,
  //                           taxItem.Tax_amount || 0.0,
  //                           taxItem.AcctHead || null,
  //                           taxItem.UUID,
  //                         ];
  
  //                         const updateQuery = `
  //                           UPDATE magodmis.unit_purchase_inv_taxes
  //                           SET Unit_Uid = PurInvTaxID
  //                           WHERE Ho_SyncId = '${taxItem.HO_UId}';
  //                         `;
  
  //                         const selectQuery = `SELECT Unit_Uid FROM magodmis.unit_purchase_inv_taxes WHERE UUID = '${taxItem.UUID}';`;
  
  //                         // Insert or update tax data
  //                         await dailyReportQuery01(taxQuery, taxValues);
  
  //                         await dailyReportQuery01(updateQuery);
  
  //                         // Retrieve Unit_Uid
  //                         const [taxUnitUidResult] = await dailyReportQuery01(
  //                           selectQuery
  //                         );
  
  //                         const taxUnitUid =
  //                           taxUnitUidResult && taxUnitUidResult.Unit_Uid;
  
  //                         // Use taxUnitUid as needed
  //                       } catch (error) {
  //                         console.error(
  //                           `Error in iteration ${i}: ${error.message}`
  //                         );
  //                         // Depending on your use case, you might want to handle errors more gracefully here
  //                         return {
  //                           error: `Error in iteration ${i}: ${error.message}`,
  //                         };
  //                       }
  //                     })
  //                   );
  
  //                   responseData.push({
  //                     invTaxData: taxResponseData,
  //                   });
  //                 }
  
  //                 // res.send(taxResponseData);
  //               }
  //               return { ...data };
  //             } catch (error) {
  //               console.error(`Error in iteration ${i}: ${error.message}`);
  //               return { error: `Error in iteration ${i}: ${error.message}` };
  //             }
  //           })
  //         );
  
  //         responseData.push({
  //           purchaseInvoice: invResponseData,
  //         });
  //       }
  
  //       // res.send(invResponseData);
  //     } else {
  //       console.log("No purchase invoice values found");
  //       res.status(400).json({ error: "No purchase invoice values found" });
  //     }
  
  //     if (open_vendor_data.length > 0) {
  //       const responseVendorData = await Promise.all(
  //         open_vendor_data.map(async (itemVendor, k) => {
  //           try {
  //             const vendorQuery = `INSERT INTO magodmis.unit_vendor_list (UnitName, Vendor_Code, Vendor_name,Branch, Address, City, State, StateId, Country, Pin_Code, GSTNo, CreditLimit, CreditTime, AveragePymtPeriod,VendorType, CURRENT, LastBilling, FirstBilling,  PAN_No,VendorStatus, Registration_Date, HO_Id)
  //             VALUES (?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  //                ?, ?, ?, ?, ?, ?, ?, ?)
  //             ON DUPLICATE KEY UPDATE HO_Id = '${itemVendor.Sync_HOId}';`;
  
  //             const vendorValues = [
  //               itemVendor.UnitName || unitname,
  //               itemVendor.Vendor_Code || 0,
  //               itemVendor.Vendor_Name || EnterCustomerName,
  //               itemVendor.Branch,
  //               itemVendor.Address,
  //               itemVendor.City,
  //               itemVendor.State,
  //               itemVendor.StateId || 0,
  //               itemVendor.Country,
  //               itemVendor.Pin_Code,
  //               itemVendor.GSTNo,
  //               itemVendor.CreditLimit || 0.0,
  //               itemVendor.CreditTime || 0,
  //               itemVendor.AveragePymtPeriod || 1000,
  //               itemVendor.VendorType,
  //               itemVendor.CURRENT || 0,
  //               itemVendor.LastBilling,
  //               itemVendor.FirstBilling,
  //               itemVendor.PAN_No,
  //               itemVendor.VendorStatus || OK,
  //               itemVendor.Registration_Date,
  //               itemVendor.Sync_HOId || 0,
  //             ];
  
  //             const vendorSelect = `SELECT u.Id as Unit_Uid FROM magodmis.unit_vendor_list u WHERE u.HO_Id = '${itemVendor.Sync_HOId}';`;
  
  //             // Insert or update the data
  //             const vendorData = await dailyReportQuery01(
  //               vendorQuery,
  //               vendorValues
  //             );
  
  //             // Retrieve Unit_Uid
  //             const [vendorUnitUidResult] = await dailyReportQuery01(
  //               vendorSelect
  //             );
  
  //             const vendorUnitUid =
  //               vendorUnitUidResult && vendorUnitUidResult.Unit_Uid;
  
  //             // Use vendorUnitUid as needed
  //           } catch (error) {
  //             console.error(`Error in iteration ${k}: ${error.message}`);
  //             return { error: `Error in iteration ${k}: ${error.message}` };
  //           }
  //         })
  //       );
  //       responseData.push({
  //         vendorInvoice: responseVendorData,
  //       });
  //       //   res.send(responseVendorData);
  //     }
  //     res.send(responseData);
  //   } catch (error) {
  //     console.error(error);
  //     next(error);
  //   }
  // });
  
  //Vendor insert
  // fromHOSyncRouter.post("/vendorInsertData", async (req, res, next) => {
  //   const { open_pur_inv, open_inv_tax, open_vendor_data } = req.body;
  
  //   try {
  //     const responseData = [];
  
  //     if (open_vendor_data.length > 0) {
  //       const responseVendorData = await Promise.all(
  //         open_vendor_data.map(async (itemVendor, k) => {
  //           try {
  //             const vendorQuery = `INSERT INTO magodmis.unit_vendor_list (UnitName, Vendor_Code, Vendor_name,Branch, Address, City, State, StateId, Country, Pin_Code, GSTNo, CreditLimit, CreditTime, AveragePymtPeriod,VendorType, CURRENT, LastBilling, FirstBilling,  PAN_No,VendorStatus, Registration_Date, HO_Id)
  //             VALUES (?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  //                ?, ?, ?, ?, ?, ?, ?, ?)
  //             ON DUPLICATE KEY UPDATE HO_Id = '${itemVendor.Sync_HOId}';`;
  
  //             const vendorValues = [
  //               itemVendor.UnitName || unitname,
  //               itemVendor.Vendor_Code || 0,
  //               itemVendor.Vendor_Name || EnterCustomerName,
  //               itemVendor.Branch,
  //               itemVendor.Address,
  //               itemVendor.City,
  //               itemVendor.State,
  //               itemVendor.StateId || 0,
  //               itemVendor.Country,
  //               itemVendor.Pin_Code,
  //               itemVendor.GSTNo,
  //               itemVendor.CreditLimit || 0.0,
  //               itemVendor.CreditTime || 0,
  //               itemVendor.AveragePymtPeriod || 1000,
  //               itemVendor.VendorType,
  //               itemVendor.CURRENT || 0,
  //               itemVendor.LastBilling,
  //               itemVendor.FirstBilling,
  //               itemVendor.PAN_No,
  //               itemVendor.VendorStatus || OK,
  //               itemVendor.Registration_Date,
  //               itemVendor.Sync_HOId || 0,
  //             ];
  
  //             const vendorSelect = `SELECT u.Id as Unit_Uid FROM magodmis.unit_vendor_list u WHERE u.HO_Id = '${itemVendor.Sync_HOId}';`;
  
  //             // Insert or update the data
  //             const vendorData = await dailyReportQuery01(
  //               vendorQuery,
  //               vendorValues
  //             );
  
  //             // Retrieve Unit_Uid
  //             const [vendorUnitUidResult] = await dailyReportQuery01(
  //               vendorSelect
  //             );
  
  //             const vendorUnitUid =
  //               vendorUnitUidResult && vendorUnitUidResult.Unit_Uid;
  
  //             // Use vendorUnitUid as needed
  //           } catch (error) {
  //             console.error(`Error in iteration ${k}: ${error.message}`);
  //             return { error: `Error in iteration ${k}: ${error.message}` };
  //           }
  //         })
  //       );
  //       responseData.push({
  //         vendorInvoice: responseVendorData,
  //       });
  //       //   res.send(responseVendorData);
  //     }else {
  //       console.log("No purchase invoice values found");
  //       res.status(400).json({ error: "No purchase invoice values found" });
  //     }
  //     res.send(responseData);
  //   } catch (error) {
  //     console.error(error);
  //     next(error);
  //   }
  // });

module.exports = fromHOSyncRouter;