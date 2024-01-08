 const billingDetails = require("express").Router();
// const cors = require('cors');
// const { dbco, dbco1, dbgetData, deleteUnitData, updateUnitData } = require("../../../helpers/dbconn")
const { setupQueryMod,misQuery } = require("../../../../helpers/dbconn")



billingDetails.get('/getTabPageData', (req,res)=>{
    const selectedDate = req.query.date;
   console.log('Selected Date in server:', selectedDate);
    try {
//const sqlquery=`SELECT * FROM magodmis.draft_dc_inv_register WHERE Inv_Date='2010-04-13'`

// const z=` SELECT m.UnitName,d.* FROM magodmis.draft_dc_inv_register d,magod_setup.magodlaser_units m WHERE 
//  d.Inv_Date='${req.query.date}'`

 const z=`SELECT  m.UnitName, d.* FROM magodmis.draft_dc_inv_register d,magod_setup.magodlaser_units m WHERE 
 d.Inv_Date='${req.query.date}' AND m.UnitName='Jigani' ;`

 const z1=` SELECT
 m.UnitName,
 d.*,
 CASE
     WHEN TIME(d.DC_inv_Date) != '00:00:00' THEN DATE_FORMAT(d.DC_inv_Date, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.DC_inv_Date, '%d-%m-%Y')
 END AS Formatted_DC_inv_Date,
 CASE
     WHEN TIME(d.OrderDate) != '00:00:00' THEN DATE_FORMAT(d.OrderDate, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.OrderDate, '%d-%m-%Y')
 END AS Formatted_OrderDate,
 CASE
     WHEN TIME(d.DC_Date) != '00:00:00' THEN DATE_FORMAT(d.DC_Date, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.DC_Date, '%d-%m-%Y')
 END AS Formatted_DC_Date,
 CASE
     WHEN TIME(d.Inv_Date) != '00:00:00' THEN DATE_FORMAT(d.Inv_Date, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.Inv_Date, '%d-%m-%Y')
 END AS Formatted_Inv_Date,
 CASE
     WHEN TIME(d.PaymentDate) != '00:00:00' THEN DATE_FORMAT(d.PaymentDate, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.PaymentDate, '%d-%m-%Y')
 END AS Formatted_PaymentDate,
 CASE
     WHEN TIME(d.DespatchDate) != '00:00:00' THEN DATE_FORMAT(d.DespatchDate, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.DespatchDate, '%d-%m-%Y')
 END AS Formatted_DespatchDate,
 CASE
     WHEN TIME(d.PaymentDate) != '00:00:00' THEN DATE_FORMAT(d.PaymentDate, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.PaymentDate, '%d-%m-%Y')
 END AS Formatted_PaymentDate,
 CASE
     WHEN TIME(d.PO_Date) != '00:00:00' THEN DATE_FORMAT(d.PO_Date, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.PO_Date, '%d-%m-%Y')
 END AS Formatted_PO_Date,
 CASE
     WHEN TIME(d.DespatchTime) != '00:00:00' THEN DATE_FORMAT(d.DespatchTime, '%d-%m-%Y %H:%i:%s')
     ELSE DATE_FORMAT(d.DespatchTime, '%d-%m-%Y')
 END AS Formatted_DespatchTime
FROM
 magodmis.draft_dc_inv_register d
INNER JOIN
 magod_setup.magodlaser_units m
ON
 m.UnitName = 'Jigani' AND  m.Current = 1
WHERE
 d.Inv_Date = '${req.query.date}';`
        misQuery(z1, (err, data) => {
            if (err) {
               // console.log("err in query", err);
            }
            else {
                 console.log("long table tabdata", data);
                return res.json({ Status: 'Success', Result: data });
            }

        });
    } catch (error) {
       // console.log("error", error);
        next(error);
    }
})




billingDetails.get("/getTab2Data", (req,res)=>{
    const selectedDate = req.query.date;
    console.log('Selected Date in server:', selectedDate);

    
    const a=`SELECT
    t1.DC_InvType,
    t1.DC_Inv_NO,
    t1.Net_Total,
    t2.InvTypeCount,
    t2.TotalNetAmount,
    t1.Inv_No
FROM
    magodmis.draft_dc_inv_register AS t1
JOIN (
    SELECT
        DC_InvType,
        COUNT(*) AS InvTypeCount,
        SUM(Net_Total) AS TotalNetAmount
    FROM
        magodmis.draft_dc_inv_register
    WHERE
        Inv_Date = '${selectedDate}'
    GROUP BY
        DC_InvType
) AS t2 ON t1.DC_InvType = t2.DC_InvType
WHERE
    t1.Inv_Date = '${selectedDate}';`

    

//     const k=`SELECT    DC_InvType,Inv_No , Net_Total,
//     COUNT(*) AS InvTypeCount,SUM(Net_Total) AS TotalNetAmount
// FROM magodmis.draft_dc_inv_register WHERE  Inv_Date = '2015-02-04'   GROUP BY
//     DC_InvType;`
    misQuery(a, (err, data) => {
        if (err) {
           // console.log("err in query", err);
        }
        else {
            //console.log("data", data);
            return res.json({ Status: 'Success', Result: data });
        }

    });

})



module.exports = billingDetails;




