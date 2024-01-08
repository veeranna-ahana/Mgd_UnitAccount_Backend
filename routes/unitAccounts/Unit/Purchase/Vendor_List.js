const vendorList = require("express").Router();
// const cors = require('cors');
// const { dbco, dbco1, dbgetData, deleteUnitData, updateUnitData } = require("../../../helpers/dbconn")
const { setupQueryMod, misQuery } = require("../../../../helpers/dbconn")
var bodyParser = require('body-parser')


vendorList.get('/vendorData', (req, res) => {

    const sql = `SELECT
*,
DATE_FORMAT(DATE(Registration_Date), '%d-%m-%Y') AS Formatted_Registration_Date
FROM
magod_hq_mis.unit_vendor_list;
;`

    misQuery(sql, (err, result) => {
        if (err) {
            console.log("err in query", err);
        }
        else {
            // console.log("success", result);
            return res.json({ Result: result });
        }
    })
})


vendorList.get('/invoiceListData', (req, res) => {
    //console.log("hiiiiii");
    const sql = `SELECT u1.VrId, u.PaidNow, u1.VoucherType, u1.VrNo, u1.Status, u.PurInvVrId AS PI_ID, u1.Narration
    FROM magodmis.unit_pur_payment_details u
    JOIN magodmis.unit_pur_inv_payment_vrlist u1 ON u1.VrId = u.PVId
    WHERE u.PurInvUUID = @PurInvUUID`

    misQuery(sql, (err, result) => {
        if (err) {
            console.log("err in query", err);
        }
        else {
            //  console.log("invoice", result);
            return res.json({ Result: result });
        }
    })
})



vendorList.get('/invoiceTableLeft', (req, res) => {
    // console.log("hiiiiii");
    // const sql = ` SELECT *,
    //     DATE_FORMAT(DATE(Inv_date), '%d-%m-%Y') AS Formatted_Inv_Date FROM magodmis.unit_purchase_invoice_list LIMIT 500;`

    const sql = ` SELECT *
         FROM magodmis.unit_purchase_invoice_list LIMIT 500;`

    misQuery(sql, (err, result) => {
        if (err) {
            console.log("err in query", err);
        }
        else {
            // console.log("invoice left", result);
            return res.json({ Result: result });
        }
    })
})



vendorList.post("/postInvoice", (req, res) => {


   
    const q = `SELECT * FROM  magod_hq_mis.unit_vendor_list 
     WHERE UnitName='${req.body.UnitName}' AND Vendor_Code='${req.body.postInvoice.Vendor_Code}' `;

    misQuery(q, (err, results) => {
       
        if(results.length===0){
            
            console.log("insert");
                 const sql = `INSERT INTO magod_hq_mis.unit_vendor_list
        (UnitName, Vendor_Code, Vendor_name, Address, City, State, Country, Pin_Code,   CreditLimit, CreditTime, VendorType, CURRENT, VendorStatus, Registration_Date)
        VALUES
        ('${req.body.UnitName}', '${req.body.postInvoice.Vendor_Code}', '${req.body.postInvoice.Vendor_name}', '${req.body.postInvoice.Address}',
        '${req.body.postInvoice.Place}', '${req.body.postInvoice.State}', '${req.body.postInvoice.Country}', '${req.body.postInvoice.Pin_Code}', 
        '${req.body.postInvoice.CreditLimit}', '${req.body.postInvoice.CreditTime}', '${req.body.postInvoice.VendorType}', '${req.body.postInvoice.CURRENT}',
         '${req.body.postInvoice.VendorStatus}',  '${req.body.postInvoice.Registration_Date}'  )
        `
        const val = [
            req.body.UnitName,
            req.body.Vendor_Code,
            req.body.Vendor_name,
            req.body.Address,
            req.body.City,
            req.body.State,
            req.body.Country,
            req.body.Pin_Code,
            req.body.GSTNo,
            req.body.StateId,
            req.body.CreditLimit,
            req.body.CreditTime,
            req.body.VendorType,
            req.body.Current,
            req.body.VendorStatus
        ];

     
        misQuery(sql, (err, result) => {
            if (err) {
                console.log("err in query", err);
                return res.json({ status: 'query'})
            }
            else {
                console.log("success");
                return res.json({ status: 'success', Result: result })
            }
        })



        }
        else{
            console.log("alreday exist");
            return res.json({ status: 'fail', message: 'Data already exists in the database.' });
        }

    })
  

   

    
    
})














vendorList.put("/updateVendorList/:UnitName/:Vendor_Code", (req, res) => {
    console.log("hiiiiiiiii");
    let StateId = 0;
    const unitName = req.params.UnitName;
    const vendorCode = req.params.Vendor_Code;

    console.log("update id", req.body);

    const up = 'SELECT UnitName, Vendor_Code  FROM magod_hq_mis.unit_vendor_list  ';


    const q = `SELECT StateCode ,State FROM magod_setup.state_codelist WHERE State='${req.body.State}'`
    misQuery(q, (err, re) => {
        if (err) {
            console.log("errrrrrrr", err);
        }

        for (let i = 0; i < re.length; i++) {
            console.log("hi");

            if (re[i].State === req.body.State) {

                StateId = re[i].StateCode;
                break;

            }


        }
    })
    misQuery(up, (e, r) => {

        // console.log("rr", r);

        let x = 0;
        for (let i = 0; i < r.length; i++) {
            if (r[i].UnitName === unitName && r[i].Vendor_Code === vendorCode) {

                x++;
                //console.log("req id and ", req.body.UnitID, r[i].UnitID);
            }
        }

        if (x === 1) {
            // const updatequery = `UPDATE magod_hq_mis.unit_vendor_lists SET ,
            //  Address='${req.body.Address}', 
            // Place='${req.body.Place}',Pin_Code='${req.body.Pin_Code}',State='${req.body.State}', 
            // Country='${req.body.Country}',ECC_No='${req.body.ECC_No}',GSTNo='${req.body.GSTNo}',
            // PAN_No='${req.body.PAN_No}', CreditLimit='${req.body.CreditLimit}',
            // CreditTime='${req.body.CreditTime}',
            //  CURRENT='${req.body.CURRENT}', 
            // StateId='${StateId}' , VendorType='${req.body.VendorType}', 
            // ServiceTax_no='${req.body.ServiceTax_no}',
            // VendorStatus='${req.body.VendorStatus}'
            // WHERE UnitName='${req.body.UnitName}' AND  Vendor_Code='${req.body.Vendor_Code}'`;


            const qer = `UPDATE magod_hq_mis.unit_vendor_list
                SET Address='${req.body.Address}',
                    City='${req.body.Place}',
                    Pin_Code='${req.body.Pin_Code}',
                    State='${req.body.State}',
                    Country='${req.body.Country}',
                    ECC_No='${req.body.ECC_No}',
                    GSTNo='${req.body.GSTNo}',
                    PAN_No='${req.body.PAN_No}',
                    CreditLimit='${req.body.CreditLimit}',
                    CreditTime='${req.body.CreditTime}',
                    CURRENT='${req.body.CURRENT}',
                    StateId='${StateId}',
                    VendorType='${req.body.VendorType}',
                    ServiceTax_no='${req.body.ServiceTax_no}',
                    VendorStatus='${req.body.VendorStatus}'
                WHERE UnitName='${req.body.UnitName}' AND  Vendor_Code='${req.body.Vendor_Code}';
                `
            //console.log("updt qry", updatequery);
            const values = [


                req.body.Address,
                req.body.Place,
                req.body.Pin_Code,
                req.body.State,
                req.body.Country,
                req.body.CURRENTs,
                req.body.GSTNo,
                req.body.ECC_No,
                req.body.PAN_No,
                StateId,
                req.body.CreditLimit,
                req.body.CreditTime,
                req.body.VendorType,
                req.body.ServiceTax_no,
                req.body.VendorStatus
            ];
            //   console.log("updt values", values);

            misQuery(qer, values, (err, result) => {
                if (err) {

                    console.log("err in update query", err);
                }
                else {
                    console.log("successfuly update");
                    return res.json({ status: 'success' });
                }
            })
        }
        else {
            console.log("error becoz unit is not in db");
            return res.json({ status: 'query' })
        }

    })
})
module.exports = vendorList;