require("dotenv").config();

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const callbackURL = process.env.MPESA_CALLBACK_URL;
const Student = require("../models/studentModel");
const FeePayment = require("../models/feePaymentModel");

const getAccessToken = async () => {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const response = await fetch(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to fetch access token: ${JSON.stringify(data)}`);
  }

  return data.access_token;
};

exports.initiateStkPush = async (req, res) => {
  const { phone, amount, studentId } = req.body;

  try {
    const accessToken = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      "base64"
    );

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: studentId,
      TransactionDesc: "School Fees Payment",
    };

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("STK Push Error:", data);
      return res
        .status(500)
        .json({ success: false, message: "STK Push failed", error: data });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("STK Push Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.mpesaCallback = async (req, res) => {
  const callback = req.body.Body?.stkCallback;

  if (!callback) {
    console.error("No callback body found");
    return res.status(400).json({ message: "Invalid callback" });
  }

  const {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    CallbackMetadata,
  } = callback;

  if (ResultCode !== 0) {
    console.warn("M-Pesa transaction failed:", ResultDesc);
    return res
      .status(200)
      .json({ message: "STK Push failed", status: ResultDesc });
  }

  console.log(callback);

  try {
    const amount = CallbackMetadata.Item.find(
      (item) => item.Name === "Amount"
    )?.Value;
    const mpesaReceipt = CallbackMetadata.Item.find(
      (item) => item.Name === "MpesaReceiptNumber"
    )?.Value;
    const phoneNumber = CallbackMetadata.Item.find(
      (item) => item.Name === "PhoneNumber"
    )?.Value;

    const accountRef = req.body.Body.stkCallback.CallbackMetadata.Item.find(
      (item) => item.Name === "AccountReference"
    )?.Value;

    const student = await Student.findById(accountRef);
    if (!student) {
      console.error("Student not found for account reference:", accountRef);
      return res.status(404).json({ message: "Student not found" });
    }

    await FeePayment.create({
      studentId: student._id,
      amount,
      date: new Date(),
      transactionCode: mpesaReceipt,
      method: "mpesa",
    });

    console.log("✅ M-Pesa payment recorded successfully");
    res.status(200).json({ message: "Payment recorded successfully" });
  } catch (err) {
    console.error("Failed to process callback:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
