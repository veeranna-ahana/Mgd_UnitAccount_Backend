const express = require("express");
const fs = require("fs");
const multer = require("multer");
const puppeteer = require('puppeteer');
const path = require("path");
const PDFDocument = require("pdfkit");
const dailyReportPdfServerRouter = express.Router();

// Ensure the body is parsed as JSON
dailyReportPdfServerRouter.use(express.json());

dailyReportPdfServerRouter.post(
  "/dailyReportSalesReportPdf",
  async (req, res) => {
    const { date, groupedArray } = req.body; // Destructuring to get values
    const fileName = "SalesReport.pdf";
    const magodLogo = path.resolve(__dirname, "Logo", "MagodLogo.png"); // This will resolve the absolute path of the image
    const outputPath = path.join(process.env.FILE_SERVER_PDF_PATH, fileName);

    // Create a new PDF document
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Ensure the directory exists
    const dir = path.dirname(outputPath); // Use path.dirname to get the directory part
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    doc.pipe(fs.createWriteStream(outputPath));

    // Header
    try {
      doc
        .image(magodLogo, 50, 15, { width: 100 }) // Adjust path to the logo image
        .fontSize(18)
        .text("Magod Laser Machining Pvt Ltd", 200, 50, { align: "center" });
    } catch (error) {
      console.error("Error loading logo image:", error.message);
      return res.status(500).send("Failed to load logo image.");
    }

    doc.moveDown();

    // Date & Summary
    doc
      .fontSize(12)
      .text(`Unit: Jigani`, { continued: true })
      .text(`Date: ${new Date(date).toLocaleDateString("en-GB")}`, {
        align: "right",
      });

    doc.moveDown();

    // Draw line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

    doc.moveDown();

    // Invoice Summary Header
    doc.fontSize(14).text("Invoice Summary", { underline: true });

    doc.moveDown(0.5);

    // Table Header
    const tableHeaders = [
      "Type",
      "Net Billing",
      "Total Taxes",
      "Grand Total",
      "Discount",
      "Transport",
      "Value Added",
      "Material Value",
    ];
    const columnWidths = [50, 70, 70, 70, 60, 60, 70, 70];
    let xPos = 50;

    // Loop through headers to render the table header
    tableHeaders.forEach((header, index) => {
      doc.text(header, xPos, doc.y, {
        width: columnWidths[index],
        align: "center",
      });
      xPos += columnWidths[index];
    });

    doc.moveDown();

    // Table Rows
    groupedArray.forEach((item) => {
      xPos = 50;
      const row = [
        item.invType,
        item.netTotal,
        item.tax,
        item.total,
        item.discount,
        item.tptcharges,
        item.valueAdded,
        item.materialCost,
      ];

      // Render each row
      row.forEach((cell, index) => {
        doc.text(cell.toString(), xPos, doc.y, {
          width: columnWidths[index],
          align: "center",
        });
        xPos += columnWidths[index];
      });
      doc.moveDown(0.5);
    });

    // Footer
    doc.addPage(); // Example of adding a new page
    doc.fontSize(10).text("Footer Content Here", { align: "center" });

    // Finalize the PDF file
    doc.end();

    // Send the response with the file path
    res.status(200).json({
      message: "PDF generated successfully",
      filePath: outputPath,
    });
  }
);









// const uploadFolder = "C:/Magod";

// if (!fs.existsSync(uploadFolder)) {
//   try {
//     fs.mkdirSync(uploadFolder, { recursive: true });
//   } catch (err) {
//     console.error("Error creating folder:", err);
//     res.status(500).send({ message: "Error creating upload folder." });
//     return;
//   }
// }

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadFolder),
//   filename: (req, file, cb) => cb(null, file.originalname),
// });

// const upload = multer({ storage });

// dailyReportPdfServerRouter.post(
//   "/dailyReportSalesReportPdf",
//   upload.single("file"),
//   (req, res) => {
//     console.log("Received file details:");

//     // Ensure req.file is properly populated
//     if (req.file) {
//       console.log("Original Name:", req.file.originalname);
//       console.log("Mimetype:", req.file.mimetype); // Should be 'application/pdf'
//       console.log("File Path:", req.file.path);
//       console.log("Size:", req.file.size);
//       res.status(200).send({
//         message: "File uploaded successfully!",
//         filePath: req.file.path,
//       });
//     } else {
//       console.log("No file received or the file is not in the expected format.");
//       res.status(400).send({ message: "Error uploading file." });
//     }
//   }
// );



module.exports = dailyReportPdfServerRouter;
