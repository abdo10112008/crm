const express = require("express");
const path = require("path");

const app = express();

// نخلي السيرفر يقرأ الملفات الثابتة (HTML, CSS, JS)
app.use(express.static(__dirname));

// لما حد يفتح الموقع
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server is running");
});
