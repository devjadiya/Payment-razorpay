const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Allow all origins for testing purposes
app.use(cors());

app.post("/order", async (req, res) => {
  try {
    console.log("Received order request:", req.body);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const options = req.body;
    console.log("Creating order with options:", options);
    const order = await razorpay.orders.create(options);

    if (!order) {
      console.error("Error creating order");
      return res.status(500).send("Error");
    }

    console.log("Order created:", order);
    res.json(order);
  } catch (err) {
    console.error("Error processing order:", err);
    res.status(500).send("Error");
  }
});

app.post("/order/validate", async (req, res) => {
  try {
    console.log("Received order validation request:", req.body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = sha.digest("hex");

    console.log("Calculated signature:", digest);

    if (digest !== razorpay_signature) {
      console.error("Signature does not match");
      return res.status(400).json({ msg: "Transaction is not legit!" });
    }

    console.log("Signature matched. Order validated successfully.");
    res.json({
      msg: "success",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error("Error processing order validation:", err);
    res.status(500).send("Error");
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
