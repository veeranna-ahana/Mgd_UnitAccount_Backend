const fromHOUpdateSyncRouter = require("express").Router();
const { dailyReportQuery01, setupQuery } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

fromHOUpdateSyncRouter.post("/updateSyncInfo", async (req, res, next) => {
  const {
    syncInfo_unit_inv,
    syncInfo_tax_list,
    syncInfo_dc_summary,
    syncInfo_receipts_register,
    syncInfo_receipts_adjusted,
    syncInfo_cust_data,
    syncInfo_cancelled_vouchers,
  } = req.body;

  try {
    let updatedData = [];

    if (
      syncInfo_unit_inv.length > 0 &&
      syncInfo_unit_inv.some(
        (item) => item.Sync_HOId !== 0 && item.UnitName === "Jigani"
      )
    ) {
      for (let i = 0; i < syncInfo_unit_inv.length; i++) {
        await dailyReportQuery01(
          `UPDATE magodmis.draft_dc_inv_register d SET d.Sync_HOId= 
          '${syncInfo_unit_inv[i].Sync_HOId}'
          WHERE d.DC_Inv_No= '${syncInfo_unit_inv[i].Unit_UId}'`
        );
        updatedData.push(syncInfo_unit_inv[i]);
      }

      for (let i = 0; i < syncInfo_tax_list.length; i++) {
        await dailyReportQuery01(
          `UPDATE magodmis.dc_inv_taxtable d SET d.Sync_HOId= 
          '${syncInfo_tax_list[i].Sync_HOId}'
          WHERE d.dc_invTaxId= '${syncInfo_tax_list[i].Unit_UId}'`
        );
        updatedData.push(syncInfo_tax_list[i]);
      }

      for (let i = 0; i < syncInfo_dc_summary.length; i++) {
        await dailyReportQuery01(
          `UPDATE magodmis.dc_inv_summary d SET d.Sync_HOId= 
          '${syncInfo_dc_summary[i].Sync_HOId}'
          WHERE d.Id= '${syncInfo_dc_summary[i].Unit_UId}'`
        );
        updatedData.push(syncInfo_dc_summary[i]);
      }
    }

    if (
      syncInfo_cust_data.length > 0 &&
      syncInfo_cust_data.some((item) => item.UnitName === "Jigani")
    ) {
      for (let i = 0; i < syncInfo_cust_data.length; i++) {
        await dailyReportQuery01(
          `UPDATE magodmis.Cust_data SET Sync_HOId= '${syncInfo_cust_data[i].HO_Uid}' 
          WHERE Cust_Code= '${syncInfo_cust_data[i].Unit_Uid}'`
        );
        updatedData.push(syncInfo_cust_data[i]);
      }
    }

    if (
      syncInfo_receipts_register.length > 0 &&
      syncInfo_receipts_register.some(
        (item) => item.Sync_HOId !== 0 && item.UnitName === "Jigani"
      )
    ) {
      for (let i = 0; i < syncInfo_receipts_register.length; i++) {
        await dailyReportQuery01(
          `UPDATE magodmis.payment_recd_voucher_register p 
          SET p.Sync_HOId= '${syncInfo_receipts_register[i].Sync_HOId}'
          WHERE p.RecdPVID= '${syncInfo_receipts_register[i].RecdPVID}'`
        );
        updatedData.push(syncInfo_receipts_register[i]);
      }

      for (let i = 0; i < syncInfo_receipts_adjusted.length; i++) {
        await dailyReportQuery01(
          `UPDATE magodmis.payment_recd_voucher_details p 
          SET p.Sync_HOId= '${syncInfo_receipts_adjusted[i].Sync_HOId}'
          WHERE p.PVSrlID= '${syncInfo_receipts_adjusted[i].Unit_UId}'`
        );
        updatedData.push(syncInfo_receipts_adjusted[i]);
      }
    }

    if (syncInfo_cancelled_vouchers > 0) {
      for (let i = 0; i < syncInfo_cancelled_vouchers.length; i++) {
        await dailyReportQuery01(
          `UPDATE magodmis.canceled_vouchers_list c 
          SET c.HO_Sync_Id= '${syncInfo_cancelled_vouchers[i].HO_Sync_Id}'
          WHERE c.Unit_Uid= '${syncInfo_cancelled_vouchers[i].Unit_Uid}';`
        );
        updatedData.push(syncInfo_cancelled_vouchers[i]);
      }
    }

    return res.json({
      Status: "Success",
      result: "updated successfully",
      updatedData: updatedData,
    });
  } catch (error) {
    console.error(error);
    return res.json({ Status: "Error", result: "failed to update data" });
  }
});

module.exports = fromHOUpdateSyncRouter;
