const mailRouter = require("express").Router();
var createError = require("http-errors");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { sendQuotation, sendAttachmails } = require("../../helpers/sendmail");

mailRouter.post("/sendmail", async (req, res, next) => {
  try {
    const { customer, qtnDetails, qtnTC } = req.body;
    sendQuotation(customer, qtnDetails, qtnTC, (err, data) => {
      if (err) return createError(500, err);
      else res.send({ status: "success", data });
    });
  } catch (error) {
    next(error);
  }
});

mailRouter.post(
  "/sendDirectMail",
  upload.single("file"),
  async (req, res, next) => {
    console.log("Mail sending initiated...");
    try {
      console.log("Request body for mail:", req.body);
      const { toAddress, ccAddress, subjectLine, mailBody, fromAddress } =
        req.body;

      const attachment = req.file
        ? {
            filename: req.file.originalname,
            path: req.file.path,
          }
        : null;

      sendAttachmails(
        fromAddress,
        toAddress,
        ccAddress,
        subjectLine,
        mailBody,
        attachment,
        (error, data) => {
          if (error) {
            console.error("Error while sending mail:", error);
            return res.status(500).json({ status: "error", message: error });
          }
          console.log("Mail sent successfully with data:", data);
          res.json({ status: "success", messageId: data });
        }
      );
    } catch (error) {
      console.error("Error in /sendDirectMail route:", error);
      next(error);
    }
  }
);

module.exports = mailRouter;
