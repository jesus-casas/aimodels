import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// The full URL will be /downloads/ since we mounted at /downloads in server.js
router.get("/", (req, res) => {
  const filePath = path.resolve(__dirname, "../static/company_confidential_file.txt");
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    return res.status(404).send("File not found");
  }

  // Log the absolute path for debugging
  console.log("Attempting to download file from:", filePath);

  res.download(filePath, "company_confidential_file.txt", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      if (!res.headersSent) {
        res.status(500).send("Download failed.");
      }
    }
  });
});

export default router;