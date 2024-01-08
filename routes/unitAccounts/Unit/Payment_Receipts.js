


const paymentreceipts = require("express").Router();
// const cors = require('cors');
// const { dbco, dbco1, dbgetData, deleteUnitData, updateUnitData } = require("../../../helpers/dbconn")
const { setupQueryMod } = require("../../../helpers/dbconn");
var bodyParser = require("body-parser");

paymentreceipts.get("/getcustomerdata", (req, res) => {
  const sql = "SELECT Cust_Code, Cust_name FROM magodmis.cust_data";
  setupQueryMod(sql, (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      //  console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

paymentreceipts.post("/saveReceipt", (req, res) => {
  console.log("qqqqqqqqqq", req.body.Amount, req.body.On_account);
  if (req.body.RecdPVID != "") {
    if (req.body.Amount == "") {
      amount = 0.0;
    } else {
      amount = req.body.Amount;
    }
    console.log("amount",amount);
    const updat =
      "UPDATE magodmis.payment_recd_voucher_register set TxnType=?, Amount=?, On_account=?, Description=?  WHERE RecdPVID =?";

    setupQueryMod(
      updat,
      [
        req.body.TxnType,
        amount,
        req.body.On_account,
        req.body.Description,
        req.body.RecdPVID,
      ],
      (e, r) => {
        //console.log(e, r)
        if (e) {
          console.log("33");
          return res.json({ status: "query", Error: "inside signup query" });
        } else {
          console.log("4121", r);

          return res.json({
            Status: "Success",
            result: { insertId: req.body.RecdPVID },
          });
        }
      }
    );
  } else {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // console.log("formatDate", formatDate);
    //Check if the data already exists in the database
    setupQueryMod(
      "SELECT RecdPVID FROM magodmis.payment_recd_voucher_register",
      (error, results) => {
        // console.log(results, 'jhjkkj');
        if (req.body.Amount == "") {
          amount = 0.0;
        } else {
          amount = req.body.Amount;
        }
        const sqlpost =
          "INSERT INTO magodmis.payment_recd_voucher_register(Recd_PV_Date, Cust_code, CustName, TxnType, Amount, Description, ReceiptStatus,On_account) VALUES (?   )";
        const values = [
          formatDate(req.body.Recd_PV_Date),
          req.body.Cust_code,
          req.body.CustName,
          req.body.TxnType,
          amount,
          req.body.Description,
          req.body.ReceiptStatus,
          req.body.On_account
        ];
        //console.log("values", values);
        setupQueryMod(sqlpost, [values], (err, result) => {
          if (err) {
            console.log("33");
            //  console.log(err);
            return res.json({ status: "query", Error: "inside signup query" });
          } else {
            console.log("4");
            return res.json({ Status: "Success", result: result });
          }
        });
      }
    );
  }
});

paymentreceipts.put("/postReceipt/:RecdPVID", (req, res) => {
  const id = req.params.RecdPVID;
  const date = new Date();
  //  console.log("post button", id);
  const getFinancialYear = () => {
    const year = date.getFullYear();
    const startYear = date.getMonth() >= 3 ? year : year - 1;
    const financialYearStartDate = new Date(`${startYear}-04-01`);
    // console.log(financialYearStartDate)
    return financialYearStartDate;
  };
  const getFinanYear = () => {
    const year = date.getFullYear();
    const incrementedResult = "";
    const getYear =
      date.getMonth() >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    console.log(getYear, "startYear");
    const yearParts = getYear.split("-");
    console.log(yearParts);
    const startYear = yearParts[0].slice(-2);
    const endYear = yearParts[1].slice(-2);
    const financialYearStartDate = `${startYear}/${endYear} / 0001`;
    //  console.log(financialYearStartDate)
    return financialYearStartDate;
  };
  function incrementFormattedString(inputString) {
    const parts = inputString.split(" / ");
    const numericPart = parts[1]; // Assuming the numeric part is always at index 2
    const numericValue = parseInt(numericPart);
    const incrementedNumericValue = numericValue + 1;
    const formattedNumericValue = incrementedNumericValue
      .toString()
      .padStart(numericPart.length, "0");
    const result = `${parts[0]} / ${formattedNumericValue}`;
    return result;
  }
  const query = `
            SELECT Recd_PVNo as last_row_count
            FROM magodmis.payment_recd_voucher_register 
            WHERE Recd_PV_Date >= ? AND Recd_PV_Date <= ? AND Recd_PVNo!='Draft' ORDER BY RecdPVID DESC LIMIT 1
            `;

  const financialYear = getFinancialYear();

  setupQueryMod(query, [financialYear, date], (error, results) => {
    console.log(results);
    if (error) {
      console.error(error);
      return;
    }
    if (results.length == 0) {
      incrementedResult = getFinanYear();
      // console.log(incrementedResult);
    } else {
      const lastRowCount = results[0].last_row_count;
      // console.log('Last row count:', lastRowCount);
      incrementedResult = incrementFormattedString(lastRowCount);
      // console.log(incrementedResult); // Output: '23/24 / 0003'
    }

    const updat = `UPDATE magodmis.payment_recd_voucher_register  p SET p.Recd_PVNo='${incrementedResult}', p.Recd_PV_Date=current_date(), p.ReceiptStatus=If('${parseFloat(
      req.body.receipt_data.On_account
    )}'=0,"Closed","Open") WHERE p.RecdPVID='${id}';`;

    setupQueryMod(updat, [id], (e, r) => {
      if (e) {
        console.log(e);
        return res.json({ Status: "Error", Error: "Failed to update" });
      }

      const data = `SELECT Receive_Now, Dc_inv_no FROM magodmis.payment_recd_voucher_details WHERE RecdPVID='${id}';`;
      setupQueryMod(data, (err, result) => {
        if (err) {
          console.log(err);
          return res.json({ Status: "Error", Error: "Failed to fetch data" });
        }

        const updateDCStatus = (i) => {
          if (i >= result.length) {
            return res.json({ Status: "Success", result: result });
          }

          const dc_inv_no = result[i].Dc_inv_no;
          setupQueryMod(
            `UPDATE magodmis.draft_dc_inv_register d SET d.PymtAmtRecd=d.PymtAmtRecd+'${result[i].Receive_Now}', d.DCStatus=If( d.GrandTotal=d.PymtAmtRecd,'Closed','Despatched') WHERE  d.DC_Inv_No='${dc_inv_no}'`,
            (updateErr, updateRes) => {
              if (updateErr) {
                //  console.log(updateErr);
                return res.json({
                  Status: "Error",
                  Error: "Failed to update DC status",
                });
              }

              updateDCStatus(i + 1);
            }
          );
        };

        updateDCStatus(0);
      });
    });
  });
});

paymentreceipts.get("/getinvlist", (req, res) => {
  const customercode = req.query.customercode; // Access the query parameter "customercode"
  console.log("cust code", customercode);
  //   const sql = "SELECT 'Jigani' AS UnitName,d.* FROM magodmis.draft_dc_inv_register d WHERE d.`Inv_no` IS NOT NULL AND d.`DCStatus` NOT LIKE 'Closed' AND  d.`DCStatus` NOT LIKE 'Cancelled' AND d.`Cust_Code`=?";
  const sql =
    "SELECT 'Jigani' as UnitName,d.`DC_Inv_No`, d.`DC_InvType`, d.`Inv_No`, d.`Inv_Date`,d.`Cust_Code`, d.`Cust_Name`,d.`GrandTotal`, d.`PymtAmtRecd`, d.`GrandTotal`- d.`PymtAmtRecd` as Balance,d.`Inv_Fin_Year` FROM magodmis.draft_dc_inv_register d WHERE d.`Cust_Code` =? AND d.`DCStatus`='Despatched' AND d.`GrandTotal`<> d.`PymtAmtRecd`;";
  setupQueryMod(sql, [customercode], (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      // console.log(" inv list result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

// paymentreceipts.put('/saveVoucherReceipt/:RecdPVID', (req, res) => {
//     console.log(req.body, req.body.length, 'jhhjjjjjjjjjjjjk');
//     const id = req.params.RecdPVID;
//    // console.log("iddd", id, Array.isArray(req.body));
//    // console.log("recdpvsrl", req.body.RecdPvSrl);
//     //Check if the data already exists in the database
//     for (let i = 0; i < req.body.length; i++) {
//         console.log("recdpvsrl", req.body[i].RecdPvSrl);
//     }
//     setupQueryMod(`SELECT RecdPVID,RecdPvSrl,Dc_inv_no FROM magodmis.payment_recd_voucher_details where RecdPVID='${id}'`, (error, results) => {
//         // console.log(results);

//         let y = true;
//         for (let i = 0; i < req.body.length; i++) {
//             const exists = results.some(obj =>
//                 obj.RecdPVID === parseInt(id) && obj.Dc_inv_no === req.body[i].Dc_inv_no
//             );
//             // console.log("exist", exists);
//             // if(results[i].RecdPVID=== parseInt(id) && results[i].RecdPvSrl===req.body[i].RecdPvSrl){
//             if (exists) {
//                 //  console.log("jjjjjjjjjjjjj",results[i].RecdPVID,id,results[i].Dc_inv_no,req.body[i].Dc_inv_no);
//                 // return res.json({status:'fail', message: 'Data already exists in the database.' });
//                 y = false;
//                 setupQueryMod(`Update magodmis.payment_recd_voucher_details set Receive_Now='${req.body[i].Receive_Now}',
//             InvUpdated='${req.body[i].InvUpdated}' where RecdPVID='${req.body[i].RecdPVID}' and Dc_inv_no='${req.body[i].Dc_inv_no}';`, (err, results) => {
//                     if (err) {
//                         console.log("33");
//                         console.log(err);
//                         // return res.json({  status:'query',Error: 'inside signup query' });
//                     }
//                     else {
//                         console.log("4");
//                          return res.json({ Status: 'Success', result: results })
//                     }
//                 })
//                 setupQueryMod(`Update magodmis.payment_recd_voucher_register d set d.On_account = CASE WHEN  '${i}' = 0 THEN d.Amount-'${parseFloat(req.body[i].Receive_Now)}' ELSE d.On_account-'${parseInt(req.body[i].Receive_Now)}' END where RecdPVID='${req.body[i].RecdPVID}';`, (err, r) => {
//                     //  console.log(i,r, 'rrrrrrrrrrrrrrrrrrrrr')
//                 })
//             }

//             else {
//                 console.log(y, 'true')
//                 const formatDate = (dateString) => {
//                     const date = new Date(dateString);
//                     const year = date.getFullYear();
//                     const month = String(date.getMonth() + 1).padStart(2, '0');
//                     const day = String(date.getDate()).padStart(2, '0');
//                     return `${year}-${month}-${day}`;
//                 };

//                 const sqlpost =
//                     "INSERT INTO magodmis.payment_recd_voucher_details(RecdPVID,RecdPvSrl,Dc_inv_no,Inv_No, Inv_Type,Inv_Amount, Amt_received, Receive_Now, InvUpdated, Inv_Date, RefNo) VALUES (?)";
//                 const values = [
//                     id,
//                     req.body[i].RecdPvSrl,
//                     req.body[i].Dc_inv_no,
//                     req.body[i].Inv_No,
//                     req.body[i].Inv_Type,
//                     req.body[i].Inv_Amount,
//                     req.body[i].Amt_received,
//                     req.body[i].Receive_Now,
//                     req.body[i].InvUpdated,
//                     formatDate(req.body[i].Inv_date),
//                     req.body[i].RefNo
//                 ]
//                 //console.log("values", values);
//                 setupQueryMod(sqlpost, [values], (err, result) => {
//                     if (err) {
//                         console.log("33");
//                         console.log(err);
//                         // return res.json({  status:'query',Error: 'inside signup query' });
//                     }
//                     else {
//                         console.log("4");
//                         // return res.json({ Status: 'Success', result: result })
//                     }
//                 })

//                 setupQueryMod(`Update magodmis.payment_recd_voucher_register d set d.On_account = CASE WHEN  '${req.body[i].RecdPvSrl}' = 1 THEN d.Amount-'${parseFloat(req.body[i].Receive_Now)}' ELSE d.On_account-'${parseInt(req.body[i].Receive_Now)}' END where RecdPVID='${req.body[i].RecdPVID}';`, (err, r) => {
//                   //  console.log(i, r, 'rrrrrrrrrrrrrrrrrrrrr')
//                 })

//                 // return res.json({ Status: 'Success', result: results })
//             }
//         }

//         return res.json({ Status: 'Success', result: results })

//     })
// })

paymentreceipts.put("/saveVoucherReceipt/:RecdPVID", async (req, res) => {
  console.log("wertyuiop", req.body);
  const id = req.params.RecdPVID;
  console.log("recd pvid", id);

  // Check if the data already exists in the database
  const results = await new Promise((resolve, reject) => {
    setupQueryMod(
      `SELECT RecdPVID,RecdPvSrl,Dc_inv_no FROM magodmis.payment_recd_voucher_details where RecdPVID='${id}'`,
      (error, results) => {
        if (error) {
          reject(error);
        } else {
          console.log("only recdpvid", results);
          resolve(results);
        }
      }
    );
  });

  const rows = req.body.map((item, i) => {
    console.log("ReceiveNow", item.Receive_Now);
    const exists = results.some(
      (obj) => obj.RecdPVID === parseInt(id) && obj.Dc_inv_no === item.Dc_inv_no
    );

    const coalesceReceiveNow = `COALESCE(NULLIF('${item.Receive_Now}', ''), '0')`;

    if (exists) {
      setupQueryMod(
        `Update magodmis.payment_recd_voucher_details set Receive_Now=${coalesceReceiveNow}, InvUpdated='${item.InvUpdated}' where RecdPVID='${item.RecdPVID}' and Dc_inv_no='${item.Dc_inv_no}';`,
        (err, updateResult) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Update Success");
          }
        }
      );

      setupQueryMod(
        `Update magodmis.payment_recd_voucher_register d set d.On_account = CASE WHEN  '${i}' = 0 THEN d.Amount-${coalesceReceiveNow} ELSE d.On_account-${coalesceReceiveNow} END where RecdPVID='${item.RecdPVID}';`,
        (err, r) => {
          if (err) {
            console.log("errrr", err);
          } else {
          }
        }
      );
    } else {
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      const sqlpost =
        "INSERT INTO magodmis.payment_recd_voucher_details(RecdPVID,RecdPvSrl,Dc_inv_no,Inv_No, Inv_Type,Inv_Amount, Amt_received, Receive_Now, InvUpdated, Inv_Date, RefNo) VALUES (?)";
      const values = [
        id,
        item.RecdPvSrl,
        item.Dc_inv_no,
        item.Inv_No,
        item.Inv_Type,
        item.Inv_Amount,
        item.Amt_received,
        item.Receive_Now,
        item.InvUpdated,
        formatDate(item.Inv_date),
        item.RefNo,
      ];
      console.log("values dc no", item.Dc_inv_no);
      setupQueryMod(sqlpost, [values], (err, insertResult) => {
        if (err) {
          console.log("error in insert", err);
        } else {
          console.log("Insert Success");
        }
      });

      setupQueryMod(
        `Update magodmis.payment_recd_voucher_register d set d.On_account = CASE WHEN  '${
          item.RecdPvSrl
        }' = 1 THEN d.Amount-'${parseFloat(
          item.Receive_Now
        )}' ELSE d.On_account-'${parseInt(
          item.Receive_Now
        )}' END where RecdPVID='${item.RecdPVID}';`,
        (err, r) => {
          //  console.log(i, r, 'rrrrrrrrrrrrrrrrrrrrr');
          if (err) {
            console.log("eroor", err);
          } else {
          }
        }
      );
    }
  });

  res.json({ Status: "Success", result: rows, RecdPVsrl: req.body[0] });
});

paymentreceipts.get("/getreceiptdata", (req, res) => {
  const customercode = req.query.customercode; // Access the query parameter "customercode"
  // console.log(customercode);
  const sql =
    "SELECT  * from magodmis.payment_recd_voucher_register  WHERE Cust_code =? and Recd_PVNo='Draft' ORDER BY RecdPVID DESC LIMIT 1;";
  setupQueryMod(sql, [customercode], (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      // console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

// paymentreceipts.delete("/deleteRecepitdetail/:PVSrlID", (req, res) => {
//     const uid = req.params.PVSrlID;
//     console.log("deleteeeeeeeee", req.params, typeof(uid));

//     setupQueryMod(`SELECT RecdPVID, Receive_Now FROM magodmis.payment_recd_voucher_details where PVSrlID='${uid}'`, (error, results) => {
//       console.log("delete remove voucher",results);

//         setupQueryMod(`Update magodmis.payment_recd_voucher_register d set d.On_account = d.On_account+'${parseFloat(results[0].Receive_Now)}'  where RecdPVID='${results[0].RecdPVID}';` , (err, r) => {
//             console.log(r, 'rrrrrrrrrrrrrrrrrrrrr')
//             })
//     })

//     const sql = "DELETE FROM magodmis.payment_recd_voucher_details WHERE PVSrlID=?";
//     setupQueryMod(sql, [uid], (err, result) => {
//         if (err) return res.json({ Error: ' err in sql' });

//         return res.json({ Status: 'Success' })
//     })

// })

paymentreceipts.delete("/deleteRecepitdetail/:PVSrlID", (req, res) => {
  const uid = req.params.PVSrlID;
  // console.log("deleteeeeeeeee", req.params, typeof(uid));

  setupQueryMod(
    `SELECT RecdPVID, Receive_Now FROM magodmis.payment_recd_voucher_details where PVSrlID='${uid}'`,
    (error, results) => {
      console.log("delete remove voucher", results);
      if (results.length > 0) {
        setupQueryMod(
          `Update magodmis.payment_recd_voucher_register d set d.On_account = d.On_account+'${parseFloat(
            results[0].Receive_Now
          )}'  where RecdPVID='${results[0].RecdPVID}';`,
          (err, r) => {
            console.log(r, "rrrrrrrrrrrrrrrrrrrrr");
          }
        );

        const sql =
          "DELETE FROM magodmis.payment_recd_voucher_details WHERE PVSrlID=?";
        setupQueryMod(sql, [uid], (err, result) => {
          if (err) return res.json({ Error: " err in sql" });

          return res.json({ Status: "Success" });
        });
      } else {
        console.log("error");
        return res.json({ Status: "error" });
      }
    }
  );
});

paymentreceipts.delete("/deleteRecepit/:RecdPVID", (req, res) => {
  const uid = req.params.RecdPVID;
  // console.log("delete", req.params, typeof (uid));

  const sql =
    "DELETE FROM magodmis.payment_recd_voucher_register WHERE RecdPVID=?";
  setupQueryMod(sql, [uid], (err, result) => {
    if (err) return res.json({ Error: " err in sql" });

    return res.json({ Status: "Success" });
  });
});


paymentreceipts.get("/getreceipt", (req, res) => {
  const receipt_id = req.query.receipt_id; // Access the query parameter "customercode"
  // console.log(receipt_id);
  const sql =
    "SELECT  * from magodmis.payment_recd_voucher_register  WHERE RecdPVID=?;";
  setupQueryMod(sql, [receipt_id], (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      //console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

paymentreceipts.get("/getrvdata", (req, res) => {
  const receipt_id = req.query.receipt_id; // Access the query parameter "customercode"
  //console.log(receipt_id);
  const sql =
    "SELECT  * from magodmis.payment_recd_voucher_details  WHERE `RecdPVID` =?;";
  setupQueryMod(sql, [receipt_id], (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      // console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

paymentreceipts.post("/addToVoucher", async (req, res, next) => {
  try {
    const { selectedRows, RecdPVID } = req.body;
    const insertResults = [];
    let existingDraftIds = [];

    const checkRecdPvSrlQuery = `SELECT MAX(RecdPvSrl) AS maxRecdPvSrl FROM magodmis.payment_recd_voucher_details WHERE RecdPVID=${RecdPVID};`;

    const checkRecdPvSrlData = await new Promise((resolve, reject) => {
      setupQueryMod(checkRecdPvSrlQuery, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    const maxRecdPvSrl = checkRecdPvSrlData[0].maxRecdPvSrl;

    const selectQuery = `SELECT * FROM magodmis.payment_recd_voucher_details WHERE RecdPVID=${RecdPVID};`;

    const selectData = await new Promise((resolve, reject) => {
      setupQueryMod(selectQuery, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    existingDraftIds = selectData.map((row) => row.Dc_inv_no);

    let recdPvSrlToInsert = maxRecdPvSrl !== null ? maxRecdPvSrl : 0;

    for (const row of selectedRows) {
      const { DC_Inv_No } = row;
      if (DC_Inv_No === undefined) {
        throw new Error("One or more IDs are not present.");
      }

      if (!existingDraftIds.includes(DC_Inv_No)) {
        const recdPvSrlToInsertIncremented = ++recdPvSrlToInsert;

        const insertQuery = `
      INSERT INTO magodmis.payment_recd_voucher_details (
        RecdPVID,
        RecdPvSrl,
        DC_inv_no,
        Inv_No,
        Inv_Type,
        Inv_Amount,
        Amt_received,
        Receive_Now,
        Inv_Date,
        RefNo
      )
      VALUES (
        ${RecdPVID},
        ${recdPvSrlToInsertIncremented},
        '${row.DC_Inv_No}',
        '${row.Inv_No}',
        '${row.DC_InvType}',
        ${row.GrandTotal},
        ${row.PymtAmtRecd},
        ${row.Balance},
        '${row.Inv_Date}',
        '${row.Inv_No} / ${row.Inv_Fin_Year}'
      )`;

        await new Promise((resolve, reject) => {
          setupQueryMod(insertQuery, (err, data) => {
            if (err) {
              insertResults.push({
                id: DC_Inv_No,
                error: "Insert failed.",
              });
              reject(err);
            } else {
              insertResults.push({
                id: DC_Inv_No,
                success: true,
              });
              resolve();
            }
          });
        });
      } else {
        insertResults.push({
          id: DC_Inv_No,
          error: "DC_Inv_No already exists in the firstTable.",
        });
      }
    }

    const finalSelectQuery = `SELECT * FROM magodmis.payment_recd_voucher_details WHERE RecdPVID=${RecdPVID};`;

    const finalSelectData = await new Promise((resolve, reject) => {
      setupQueryMod(finalSelectQuery, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    res.json(finalSelectData);
  } catch (error) {
    console.log("Error:", error.message);
    next(error);
  }
});



paymentreceipts.post("/removeVoucher", async (req, res, next) => {
  try {
    const { PVSrlID, RecdPVID } = req.body;

    console.log("PVSrlID", PVSrlID);

    // console.log("PVSrlID", PVSrlID);

    // Delete query
    const deleteQuery = `DELETE FROM magodmis.payment_recd_voucher_details WHERE PVSrlID=${PVSrlID}`;
    setupQueryMod(deleteQuery, (deleteErr) => {
      if (deleteErr) {
        console.log("Delete error", deleteErr);
        return res.json({ Error: "Error in DELETE query", Details: deleteErr });
      }

      // Select query to get the updated data after deletion
      const selectQuery = `SELECT * FROM magodmis.payment_recd_voucher_details WHERE RecdPVID=${RecdPVID}`;
      setupQueryMod(selectQuery, (selectErr, selectResult) => {
        if (selectErr) {
          console.log("Select error", selectErr);
          return res.json({
            Error: "Error in SELECT query after deletion",
            Details: selectErr,
          });
        }

        // Send the updated data after successful DELETE and SELECT
        res.send(selectResult);
      });
    });
  } catch (error) {
    console.log("Error:", error.message);
    next(error);
  }
});

paymentreceipts.post("/updateOnAccount", async (req, res, next) => {
  try {
    const { RecdPVID, onAccountValue } = req.body;
    console.log("REQ_BODY", req.body);

    // Update query
    const updateQuery = `UPDATE magodmis.payment_recd_voucher_register
    SET On_account='${onAccountValue}'
    WHERE RecdPVID=${RecdPVID}`;
    setupQueryMod(updateQuery, (updateErr) => {
      if (updateErr) {
        console.log("Update error", updateErr);
      }

      // Select query to get the updated data after deletion
      const selectQuery = `SELECT On_account FROM magodmis.payment_recd_voucher_register WHERE RecdPVID=${RecdPVID}`;
      setupQueryMod(selectQuery, (selectErr, selectResult) => {
        if (selectErr) {
          console.log("Select error", selectErr);
          return res.json({
            Error: "Error in SELECT query after deletion",
            Details: selectErr,
          });
        }

        // Send the updated data after successful DELETE and SELECT
        res.json({
          updatedOnAccount: selectResult,
        });
      });
    });
  } catch (error) {
    console.log("Error:", error.message);
    next(error);
  }
});

//customer RV
paymentreceipts.get("/getRVlist", (req, res) => {
  const customercode = req.query.customercode; // Access the query parameter "customercode"
  console.log(customercode);
  //   const sql = "SELECT 'Jigani' AS UnitName,d.* FROM magodmis.draft_dc_inv_register d WHERE d.`Inv_no` IS NOT NULL AND d.`DCStatus` NOT LIKE 'Closed' AND  d.`DCStatus` NOT LIKE 'Cancelled' AND d.`Cust_Code`=?";
  const sql =
    "SELECT 'Jigani' as UnitName, d.* FROM magodmis.payment_recd_voucher_register d WHERE d.`Cust_Code` =?  ORDER BY d.Recd_PV_Date DESC;";
  setupQueryMod(sql, [customercode], (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      //console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

//DraftReceipts
paymentreceipts.get("/getdraftreceipts", (req, res) => {
  const sql =
    "SELECT p.`RecdPVID` AS Id, 'Jigani' AS UnitName,p.* FROM magodmis.payment_recd_voucher_register p WHERE p.Recd_pvno ='Draft';";
  setupQueryMod(sql, (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      //  console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

//OnAccount details
paymentreceipts.get("/getonaccountdetails", (req, res) => {
  const sql =
    "SELECT  p.`RecdPVID` AS Id,@UnitName AS UnitName,p.* FROM magodmis.payment_recd_voucher_register p WHERE p.`ReceiptStatus`='Open' AND p.`On_account`>0";

  setupQueryMod(sql, (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      //  console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

//open
paymentreceipts.get("/getopenreceipts", (req, res) => {
  const sql =
    "SELECT p.`RecdPVID` as Id, 'Jigani' as UnitName,p.* FROM magodmis.payment_recd_voucher_register p WHERE p.ReceiptStatus ='Open' ORDER BY p.Recd_PV_Date DESC";
  setupQueryMod(sql, (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      //  console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

//closed
paymentreceipts.get("/getclosedreceipts", (req, res) => {
  const sql =
    "SELECT p.`RecdPVID` as Id, 'Jigani' as UnitName,p.* FROM magodmis.payment_recd_voucher_register p WHERE p.ReceiptStatus ='Closed' ORDER BY p.Recd_PV_Date DESC";
  setupQueryMod(sql, (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      //  console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

//ALL
paymentreceipts.get("/getallreceipts", (req, res) => {
  const sql =
    "SELECT p.RecdPVID as Id, 'Jigani' as UnitName, p.* FROM magodmis.payment_recd_voucher_register p WHERE p.Recd_pvno <> 'Draft' ORDER BY p.Recd_pvno DESC";
  setupQueryMod(sql, (err, result) => {
    if (err) {
      console.log("error", err);
      return res.json({ Error: " error in sql" });
    } else {
      //  console.log("result", result);
      return res.json({ Status: "Success", Result: result });
    }
  });
});

module.exports = paymentreceipts;

